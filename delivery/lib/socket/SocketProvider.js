// PATH: driver/lib/socket/SocketProvider.js  (DELIVERY FRONTEND VERSION)
// Only two things changed from the ride driver version:
//   1. Joins as 'delivery:join' with deliveryPersonId
//   2. Listens for 'delivery:connected' and 'delivery:session-replaced'
// Everything else (on/off/emit/connected/updateLocation) is identical.
'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/hooks/useAuth';
import { SOCKET_EVENTS } from '@/Constants';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef           = useRef(null);
  const [connected, setConnected]   = useState(false);
  const [error, setError]           = useState(null);
  const eventHandlersRef    = useRef({});
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005';

  useEffect(() => {
    // Need deliveryProfile to exist before connecting
    if (!isAuthenticated() || !user?.id || !user?.deliveryProfile) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: maxReconnectAttempts,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Delivery socket connected:', socket.id);
      setConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      // ─── KEY DIFFERENCE: join as delivery driver ──────────────────────────
      socket.emit('delivery:join', {
        deliveryPersonId: user.id,
        location: user.currentLocation,
        metadata: {
          firstName:   user.firstName,
          lastName:    user.lastName,
          phoneNumber: user.phoneNumber,
          isOnline:    user.deliveryProfile.isOnline,
          isAvailable: user.deliveryProfile.isAvailable,
        },
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Delivery socket disconnected:', reason);
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

    // ─── KEY DIFFERENCE: delivery-specific connection events ─────────────────
    socket.on('delivery:connected', (data) => {
      console.log('Delivery driver connected:', data);
    });

    socket.on('delivery:session-replaced', (data) => {
      console.warn('Session replaced:', data.message);
    });

    // Re-register all event handlers
    Object.entries(eventHandlersRef.current).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => { if (socket) socket.disconnect(); };
  }, [user?.id, user?.deliveryProfile, isAuthenticated, SOCKET_URL]);

  const on = useCallback((event, handler) => {
    eventHandlersRef.current[event] = handler;
    if (socketRef.current) socketRef.current.on(event, handler);
  }, []);

  const off = useCallback((event) => {
    if (eventHandlersRef.current[event]) delete eventHandlersRef.current[event];
    if (socketRef.current) socketRef.current.off(event);
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Cannot emit event: Socket not connected');
    }
  }, [connected]);

  const updateLocation = useCallback((location, heading = 0, speed = 0) => {
    if (!user?.id) return;
    // Delivery location update — same event name as driver, backend handles routing
    emit('driver:location:update', {
      driverId: user.id,
      location,
      heading,
      speed,
    });
  }, [user?.id, emit]);

  const value = { socket: socketRef.current, connected, error, on, off, emit, updateLocation };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export default SocketProvider;