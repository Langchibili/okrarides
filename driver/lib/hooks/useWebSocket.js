'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export const useWebSocket = (url = null) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const eventHandlersRef = useRef({});

  const socketUrl = url || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError(err.message);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [socketUrl]);

  // Register event handler
  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      // Store handler reference
      eventHandlersRef.current[event] = handler;
      socketRef.current.on(event, handler);
    }
  }, []);

  // Unregister event handler
  const off = useCallback((event) => {
    if (socketRef.current && eventHandlersRef.current[event]) {
      socketRef.current.off(event, eventHandlersRef.current[event]);
      delete eventHandlersRef.current[event];
    }
  }, []);

  // Emit event
  const emit = useCallback((event, data) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event: Socket not connected');
    }
  }, [connected]);

  // Join room
  const joinRoom = useCallback((room) => {
    emit('join', room);
  }, [emit]);

  // Leave room
  const leaveRoom = useCallback((room) => {
    emit('leave', room);
  }, [emit]);

  return {
    connected,
    error,
    socket: socketRef.current,
    on,
    off,
    emit,
    joinRoom,
    leaveRoom,
  };
};

export default useWebSocket;
