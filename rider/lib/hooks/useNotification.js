'use client';

import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission } from '@/Functions';

export const useNotification = () => {
  const [permission, setPermission] = useState('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    const granted = await requestNotificationPermission();
    setPermission(Notification.permission);
    return granted;
  }, [supported]);

  const showNotification = useCallback((title, options = {}) => {
    if (!supported) {
      console.warn('Notifications not supported');
      return null;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    return new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      ...options,
    });
  }, [supported, permission]);

  const showRideNotification = useCallback((type, data) => {
    const notifications = {
      driver_found: {
        title: 'Driver Found!',
        body: `${data.driverName} is on the way`,
        icon: '/icons/driver-found.png',
      },
      driver_arrived: {
        title: 'Driver Arrived',
        body: 'Your driver is waiting for you',
        icon: '/icons/driver-arrived.png',
      },
      ride_completed: {
        title: 'Ride Completed',
        body: `Total fare: K${data.fare}`,
        icon: '/icons/ride-completed.png',
      },
    };

    const notif = notifications[type];
    if (notif) {
      return showNotification(notif.title, {
        body: notif.body,
        icon: notif.icon,
        data,
        vibrate: [200, 100, 200],
      });
    }
  }, [showNotification]);

  return {
    permission,
    supported,
    requestPermission,
    showNotification,
    showRideNotification,
  };
};

export default useNotification;

// lib/hooks/index.js - Export all hooks
export { useAuth } from './useAuth';
export { useRide } from './useRide';
export { useWallet } from './useWallet';
export { useGeolocation } from './useGeolocation';
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useWebSocket } from './useWebSocket';
export { useNotification } from './useNotification';
