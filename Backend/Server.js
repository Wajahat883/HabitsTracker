import dotenv from "dotenv";
import connectDB from "./src/Config/db.js";
import app from "./src/Config/app.js";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

// In-memory presence map { userId: { sockets: Set<string>, lastSeen: Date, status: 'online'|'offline' } }
const presence = new Map();

function addUserSocket(userId, socketId) {
  const entry = presence.get(userId) || { sockets: new Set(), lastSeen: new Date(), status: 'online' };
  entry.sockets.add(socketId);
  entry.status = 'online';
  entry.lastSeen = new Date();
  presence.set(userId, entry);
}
function removeUserSocket(userId, socketId) {
  const entry = presence.get(userId);
  if (!entry) return;
  entry.sockets.delete(socketId);
  entry.lastSeen = new Date();
  if (entry.sockets.size === 0) entry.status = 'offline';
  presence.set(userId, entry);
}

function getFriendRoom(userId) { return `friends:${userId}`; }

// Broadcast helper
function broadcastToUser(userId, event, payload) {
  io.to(`user:${userId}`).emit(event, payload);
}

let io; // will initialize after DB connect

dotenv.config({
  path: "./.env"   // agar .env backend ke andar hi hai
});

connectDB()
  .then(() => {
    const server = http.createServer(app);
    io = new SocketIOServer(server, {
      cors: {
        origin: (origin, cb) => cb(null, true), // rely on Express CORS earlier; keep permissive here for dev
        credentials: true
      },
      pingInterval: 20000,
      pingTimeout: 25000,
      maxHttpBufferSize: 1e6
    });

    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];
        if (!token) return next(new Error('Auth token missing'));
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        socket.userId = decoded.userId;
        next();
      } catch (e) {
        next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      const userId = socket.userId;
      if (!userId) { socket.disconnect(true); return; }
      // join personal room
      socket.join(`user:${userId}`);
      addUserSocket(userId, socket.id);
      // emit presence update to the user
      socket.emit('presence:init', { userId, status: 'online' });
      // Optionally: fetch friends list from DB (lazy requiring model to avoid circular)
      import('./src/Models/Friend.js').then(({ default: Friend }) => {
        Friend.find({ $or: [{ user: userId }, { friend: userId }], status: 'accepted' }).then(rels => {
          const friendIds = rels.map(r => (r.user.toString() === userId ? r.friend?.toString() : r.user?.toString())).filter(Boolean);
          friendIds.forEach(fid => socket.join(getFriendRoom(fid))); // join rooms to receive their events if needed
          // send current presence for friends we know about
          const presencePayload = friendIds.map(fid => ({ userId: fid, status: presence.get(fid)?.status || 'offline', lastSeen: presence.get(fid)?.lastSeen || null }));
          socket.emit('friends:presence', presencePayload);
        }).catch(()=>{});
      });

      // Listen for manual status change
      socket.on('presence:set', ({ status }) => {
        const entry = presence.get(userId) || { sockets: new Set(), lastSeen: new Date(), status: 'online' };
        entry.status = status === 'away' ? 'away' : 'online';
        entry.lastSeen = new Date();
        presence.set(userId, entry);
        io.to(`user:${userId}`).emit('presence:update', { userId, status: entry.status, lastSeen: entry.lastSeen });
      });

      // Habit update relay (server can also emit directly when logs/habits mutate)
      socket.on('habit:updated', (data) => {
        // broadcast to same user (other tabs) and optionally friends
        broadcastToUser(userId, 'habit:updated', data);
        socket.to(getFriendRoom(userId)).emit('friend:habit:update', { userId, ...data });
      });

      socket.on('disconnect', () => {
        removeUserSocket(userId, socket.id);
        const entry = presence.get(userId);
        io.to(`user:${userId}`).emit('presence:update', { userId, status: entry.status, lastSeen: entry.lastSeen });
        // inform friends if now offline
        socket.to(getFriendRoom(userId)).emit('friend:presence', { userId, status: entry.status, lastSeen: entry.lastSeen });
      });
    });

    // Expose emitter for controllers (naive global)
    app.set('io', io);
    app.set('broadcastToUser', broadcastToUser);

    // Daily rollover: lock yesterday's logs at UTC midnight and emit habit:updated events
    import('./src/Models/HabitLog.js').then(({ default: HabitLog }) => {
      const lockYesterday = async () => {
        try {
          const now = new Date();
          const yesterday = new Date(now);
          yesterday.setUTCDate(now.getUTCDate() - 1);
          const yStr = yesterday.toISOString().slice(0, 10);
          // mark all logs dated yesterday as locked
          const result = await HabitLog.updateMany({ date: yStr, locked: false }, { $set: { locked: true } });
          if (result.modifiedCount && result.modifiedCount > 0) {
            console.log(`Locked ${result.modifiedCount} logs for date ${yStr}`);
            // notify affected users to refresh streaks / progress
            const affected = await HabitLog.find({ date: yStr }).distinct('user');
            for (const uid of affected) {
              io.to(`user:${uid}`).emit('habit:updated', { type: 'dayLocked', date: yStr });
            }
          }
        } catch (e) { console.error('Daily rollover failed', e); }
      };

      // Schedule first run at next UTC midnight + 2s to allow DB writes to complete
      const scheduleNext = () => {
        const now = new Date();
        const nextUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 2);
        const delay = nextUTC.getTime() - now.getTime();
        console.log(`Next rollover scheduled in ${Math.round(delay / 1000)} seconds at ${nextUTC.toISOString()}`);
        setTimeout(async () => { await lockYesterday(); scheduleNext(); }, delay);
      };
      scheduleNext();
    }).catch(()=>{});

    // Auto port fallback logic
    const basePort = parseInt(process.env.PORT, 10) || 5000;
    let serverStarted = false;
    const tryListen = (p, attempts = 0) => {
      if (serverStarted) return; // Prevent multiple listen attempts
      
      const serverInstance = server.listen(p, () => {
        serverStarted = true;
        console.log(`🚀 Server + Socket.IO running at port : ${p}`);
      });
      
      serverInstance.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && attempts < 5 && !serverStarted) {
          const next = p + 1;
          console.warn(`Port ${p} in use, trying ${next}...`);
          setTimeout(() => tryListen(next, attempts + 1), 300);
        } else if (!serverStarted) {
          console.error('Failed to bind server:', err);
          process.exit(1);
        }
      });
    };
    tryListen(basePort);
  })
  .catch((err) => {
    console.log('❌ MONGO db connection failed', err);
  });

export { io, presence };
