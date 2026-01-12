'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/hooks/useAuth';
import { SOCKET_EVENTS } from '@/Constants';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const eventHandlersRef = useRef({});
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005';

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated() || !user?.id || !user?.driverProfile) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Create socket connection
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: maxReconnectAttempts,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      // Join as driver
      const driverId = user.id;
      const metadata = {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        isOnline: user.driverProfile.isOnline,
        isAvailable: user.driverProfile.isAvailable,
      };

      socket.emit(SOCKET_EVENTS.DRIVER.JOIN, {
        driverId,
        location: user.currentLocation,
        metadata,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      reconnectAttemptsRef.current++;

      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        setError('Failed to connect to real-time services. Please check your connection.');
      }
    });

    // Driver-specific events
    socket.on(SOCKET_EVENTS.DRIVER.CONNECTED, (data) => {
      console.log('Driver connected:', data);
    });

    socket.on(SOCKET_EVENTS.DRIVER.SESSION_REPLACED, (data) => {
      console.warn('Session replaced:', data.message);
    });

    // Register all event handlers
    Object.entries(eventHandlersRef.current).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user?.id, user?.driverProfile, isAuthenticated, SOCKET_URL]);

  // Register event handler
  const on = useCallback((event, handler) => {
    eventHandlersRef.current[event] = handler;
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  // Unregister event handler
  const off = useCallback((event) => {
    if (eventHandlersRef.current[event]) {
      delete eventHandlersRef.current[event];
    }
    if (socketRef.current) {
      socketRef.current.off(event);
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

  // Update location
  const updateLocation = useCallback((location, heading = 0, speed = 0) => {
    if (!user?.id) return;
    
    emit(SOCKET_EVENTS.DRIVER.LOCATION_UPDATE, {
      driverId: user.id,
      location,
      heading,
      speed,
    });
  }, [user?.id, emit]);

  const value = {
    socket: socketRef.current,
    connected,
    error,
    on,
    off,
    emit,
    updateLocation,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export default SocketProvider;