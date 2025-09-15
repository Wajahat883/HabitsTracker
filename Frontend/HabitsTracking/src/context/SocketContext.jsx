import React, { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Export internal context separately for hook file to import
const SocketContext = createContext(null);
export default SocketContext;

export const SocketProvider = ({ token, children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [friendPresence, setFriendPresence] = useState({}); // { userId: { status, lastSeen } }

  useEffect(() => {
    if (!token) return;
    // Avoid duplicate connections
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    const url = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';
    const socket = io(url, {
      transports: ['websocket'],
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('presence:init', () => {
      // self presence (ignore or could set own presence state)
    });
    socket.on('friends:presence', (list) => {
      const map = {};
      list.forEach(p => { map[p.userId] = p; });
      setFriendPresence(prev => ({ ...prev, ...map }));
    });
    socket.on('friend:presence', (p) => {
      setFriendPresence(prev => ({ ...prev, [p.userId]: p }));
    });
    socket.on('presence:update', (p) => {
      if (!p.userId) return;
      setFriendPresence(prev => ({ ...prev, [p.userId]: p }));
    });

    socket.on('notification:new', (n) => {
      // Optional: dispatch a custom event for NotificationBell to refetch
      window.dispatchEvent(new CustomEvent('notification:new', { detail: n }));
    });

    socket.on('friend:habit:update', (payload) => {
      // Could be used to refresh specific friend progress lazily
      window.dispatchEvent(new CustomEvent('friendHabitUpdate', { detail: payload }));
    });

    return () => { socket.disconnect(); };
  }, [token]);

  const emitHabitUpdate = (habitId, change) => {
    if (!socketRef.current) return;
    socketRef.current.emit('habit:updated', { habitId, change });
  };

  const value = { socket: socketRef.current, connected, friendPresence, emitHabitUpdate };
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// Hook moved to separate file to satisfy fast refresh requirements
