import React, { createContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';

// Export internal context separately for hook file to import
const SocketContext = createContext(null);
export default SocketContext;

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [friendPresence, setFriendPresence] = useState({}); 
  // { userId: { status, lastSeen } }

  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      console.log('🔌 Socket.IO: No auth token found, connection skipped');
      return;
    }
    // Avoid duplicate connections
    if (socketRef.current) {
      console.log('🔌 Socket.IO: Closing existing connection');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    const url = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';
    console.log(`🔌 Socket.IO: Attempting connection to ${url}`);
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.5,
      timeout: 8000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO: Connected successfully');
      setConnected(true);
    });
    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket.IO: Disconnected - ${reason}`);
      setConnected(false);
      if (reason === 'io server disconnect') {
        // manual disconnect by server -> attempt reconnect
        socket.connect();
      }
    });
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO: Connection error:', error.message);
    });
    socket.io.on('reconnect_attempt', (attempt) => {
      // Could add UI indicator via custom event
      window.dispatchEvent(new CustomEvent('socket:reconnectAttempt', 
        { detail: { attempt } }));
    });
    socket.io.on('reconnect_error', (err) => {
      window.dispatchEvent(new CustomEvent('socket:reconnectError', 
        { detail: { message: err.message } }));
    });
    socket.io.on('reconnect_failed', () => {
      window.dispatchEvent(new CustomEvent('socket:reconnectFailed'));
    });
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

    socket.on('habit:updated', (payload) => {
      window.dispatchEvent(new CustomEvent('habitUpdated', { detail: payload }));
    });

    return () => { socket.disconnect(); };
  }, []);

  const emitHabitUpdate = useCallback((habitId, change) => {
    if (socketRef.current) socketRef.current.emit('habit:updated', { habitId, change });
  }, []);

  const value = useMemo(() => ({ socket: socketRef.current, connected, friendPresence, emitHabitUpdate }), [connected, friendPresence, emitHabitUpdate]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// Hook moved to separate file to satisfy fast refresh requirements
