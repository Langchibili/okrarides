// PATH: lib/hooks/usePartnerSocket.js
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005';

export function usePartnerSocket(fleetDriverIds) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [tickerEvents, setTickerEvents] = useState([]);
  const [fleetStatuses, setFleetStatuses] = useState({});
  const [partnerBalance, setPartnerBalance] = useState(null);
  const [lowFloatAlerts, setLowFloatAlerts] = useState([]);
  const fleetIdsRef = useRef(new Set(fleetDriverIds));

  useEffect(() => {
    fleetIdsRef.current = new Set(fleetDriverIds);
  }, [fleetDriverIds]);

  const pushTicker = useCallback((driverId, driverName, message, type) => {
    setTickerEvents((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          driverId,
          driverName,
          message,
          type,
        },
        ...prev,
      ].slice(0, 50)
    );
  }, []);

  useEffect(() => {
    if (!user?.partnerProfile?.id) return;

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('partner:join', {
        partnerId: user.id,
        metadata: { businessName: user.partnerProfile?.businessName },
      });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('driver:status:changed', ({ driverId, status }) => {
      if (!fleetIdsRef.current.has(Number(driverId))) return;
      setFleetStatuses((prev) => ({ ...prev, [driverId]: status.toUpperCase() }));
      const label = status === 'online' ? 'went ONLINE' : status === 'offline' ? 'went OFFLINE' : `status: ${status}`;
      pushTicker(driverId, `Driver #${driverId}`, label, 'status');
    });

    socket.on('ride:accepted', ({ rideId, driverId }) => {
      if (!fleetIdsRef.current.has(Number(driverId))) return;
      pushTicker(driverId, `Driver #${driverId}`, 'accepted a ride', 'ride_accepted');
    });

    socket.on('ride:trip:started', ({ rideId, driverId }) => {
      if (!fleetIdsRef.current.has(Number(driverId))) return;
      pushTicker(driverId, `Driver #${driverId}`, 'started a trip', 'trip_started');
    });

    socket.on('ride:trip:completed', ({ rideId, driverId, finalFare }) => {
      if (!fleetIdsRef.current.has(Number(driverId))) return;
      pushTicker(driverId, `Driver #${driverId}`, `completed a trip — K${Number(finalFare).toFixed(2)}`, 'trip_completed');
    });

    socket.on('ride:cancelled', ({ rideId, driverId }) => {
      if (!fleetIdsRef.current.has(Number(driverId))) return;
      pushTicker(driverId, `Driver #${driverId}`, 'cancelled a ride', 'ride_cancelled');
    });

    socket.on('delivery:accepted', ({ deliveryId, delivererId }) => {
      if (!fleetIdsRef.current.has(Number(delivererId))) return;
      pushTicker(delivererId, `Driver #${delivererId}`, 'accepted a delivery', 'delivery_accepted');
    });

    socket.on('delivery:completed', ({ deliveryId, delivererId, finalFare }) => {
      if (!fleetIdsRef.current.has(Number(delivererId))) return;
      pushTicker(delivererId, `Driver #${delivererId}`, `completed a delivery — K${Number(finalFare).toFixed(2)}`, 'delivery_completed');
    });

    socket.on('partner:float:updated', ({ newPartnerBalance }) => {
      setPartnerBalance(newPartnerBalance);
    });

    socket.on('partner:driver:low-float', (data) => {
      setLowFloatAlerts((prev) => {
        const filtered = prev.filter((a) => a.driverId !== data.driverId);
        return [data, ...filtered];
      });
    });

    socket.on('payment:success', ({ userId, type }) => {
      if (userId === user.id && type === 'float_topup-partner') {
        setPartnerBalance(null);
      }
    });

    return () => { socket.disconnect(); };
  }, [user?.id, user?.partnerProfile?.id, pushTicker]);

  return {
    connected,
    tickerEvents,
    fleetStatuses,
    partnerBalance,
    lowFloatAlerts,
    clearLowFloatAlert: (driverId) => setLowFloatAlerts((prev) => prev.filter((a) => a.driverId !== driverId)),
    updateFleetStatus: (driverId, status) => setFleetStatuses((prev) => ({ ...prev, [driverId]: status })),
  };
}
