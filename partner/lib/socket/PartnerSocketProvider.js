// PATH: lib/socket/PartnerSocketProvider.js
'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/hooks/useAuth';
import { savedCurrencySymbol } from '../utils/format';

const PartnerSocketContext = createContext(null);

export function usePartnerSocketContext() {
  const ctx = useContext(PartnerSocketContext);
  if (!ctx) throw new Error('usePartnerSocketContext must be inside PartnerSocketProvider');
  return ctx;
}

export function PartnerSocketProvider({ children, fleetDriverIds, onReconnect }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [tickerEvents, setTickerEvents] = useState([]);
  const [fleetStatuses, setFleetStatuses] = useState({});
  const [partnerFloatBalance, setPartnerFloatBalance] = useState(null);
  const [lowFloatAlerts, setLowFloatAlerts] = useState([]);
  const fleetSet = useRef(new Set(fleetDriverIds));
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => { fleetSet.current = new Set(fleetDriverIds); }, [fleetDriverIds]);
  useEffect(() => { onReconnectRef.current = onReconnect; }, [onReconnect]);

  const pushTicker = useCallback((ev) => {
    setTickerEvents((prev) => [ev, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    if (!user?.id || !user?.partnerProfile?.id) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 20,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('partner:join', { partnerId: user.id, metadata: {} });
      onReconnectRef.current();
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('driver:status:changed', ({ driverId, status }) => {
      const id = Number(driverId);
      if (!fleetSet.current.has(id)) return;
      setFleetStatuses((prev) => ({ ...prev, [id]: status.toUpperCase() }));
      pushTicker({ id: `${Date.now()}-${id}`, timestamp: Date.now(), driverId: id, driverName: `Driver #${id}`, message: `is now ${status}`, type: 'status' });
    });

    const rideMap = [
      ['ride:accepted', 'accepted a ride', 'ride_accepted'],
      ['ride:trip:started', 'started a trip', 'trip_started'],
      ['ride:trip:completed', 'completed a trip', 'trip_completed'],
      ['ride:cancelled', 'cancelled a ride', 'ride_cancelled'],
    ];
    rideMap.forEach(([event, message, type]) => {
      socket.on(event, (data) => {
        const id = Number(data.driverId ?? data.delivererId);
        if (!fleetSet.current.has(id)) return;
        const finalFare = data.finalFare ? ` — ${savedCurrencySymbol()}${Number(data.finalFare).toFixed(2)}` : '';
        pushTicker({ id: `${Date.now()}-${id}`, timestamp: Date.now(), driverId: id, driverName: `Driver #${id}`, message: `${message}${finalFare}`, type });
      });
    });

    const deliveryMap = [
      ['delivery:accepted', 'accepted a delivery', 'delivery_accepted'],
      ['delivery:completed', 'completed a delivery', 'delivery_completed'],
      ['delivery:cancelled', 'cancelled a delivery', 'delivery_cancelled'],
    ];
    deliveryMap.forEach(([event, message, type]) => {
      socket.on(event, (data) => {
        const id = Number(data.delivererId);
        if (!fleetSet.current.has(id)) return;
        const finalFare = data.finalFare ? ` — ${savedCurrencySymbol()}${Number(data.finalFare).toFixed(2)}` : '';
        pushTicker({ id: `${Date.now()}-${id}`, timestamp: Date.now(), driverId: id, driverName: `Driver #${id}`, message: `${message}${finalFare}`, type });
      });
    });

    socket.on('partner:float:updated', ({ newPartnerBalance }) => {
      if (typeof newPartnerBalance === 'number') setPartnerFloatBalance(newPartnerBalance);
    });

    socket.on('partner:driver:low-float', (data) => {
      setLowFloatAlerts((prev) => {
        const filtered = prev.filter((a) => a.driverId !== data.driverId);
        return [data, ...filtered];
      });
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?.id, user?.partnerProfile?.id, pushTicker]);

  return (
    <PartnerSocketContext.Provider value={{
      connected,
      socket: socketRef.current,
      tickerEvents,
      fleetStatuses,
      partnerFloatBalance,
      lowFloatAlerts,
      clearLowFloatAlert: (id) => setLowFloatAlerts((prev) => prev.filter((a) => a.driverId !== id)),
    }}>
      {children}
    </PartnerSocketContext.Provider>
  );
}
