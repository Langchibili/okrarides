// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { requestNotificationPermission } from '@/Functions';

// export const useNotification = () => {
//   const [permission, setPermission] = useState('default');
//   const [supported, setSupported] = useState(false);

//   useEffect(() => {
//     // Check if notifications are supported
//     if ('Notification' in window) {
//       setSupported(true);
//       setPermission(Notification.permission);
//     }
//   }, []);

//   const requestPermission = useCallback(async () => {
//     if (!supported) {
//       console.warn('Notifications not supported in this browser');
//       return false;
//     }

//     const granted = await requestNotificationPermission();
//     setPermission(Notification.permission);
//     return granted;
//   }, [supported]);

//   const showNotification = useCallback((title, options = {}) => {
//     if (!supported) {
//       console.warn('Notifications not supported');
//       return null;
//     }

//     if (permission !== 'granted') {
//       console.warn('Notification permission not granted');
//       return null;
//     }

//     return new Notification(title, {
//       icon: '/icons/icon-192x192.png',
//       badge: '/icons/icon-96x96.png',
//       ...options,
//     });
//   }, [supported, permission]);

//   const showRideNotification = useCallback((type, data) => {
//     const notifications = {
//       driver_found: {
//         title: 'Driver Found!',
//         body: `${data.driverName} is on the way`,
//         icon: '/icons/driver-found.png',
//       },
//       driver_arrived: {
//         title: 'Driver Arrived',
//         body: 'Your driver is waiting for you',
//         icon: '/icons/driver-arrived.png',
//       },
//       ride_completed: {
//         title: 'Ride Completed',
//         body: `Total fare: K${data.fare}`,
//         icon: '/icons/ride-completed.png',
//       },
//     };

//     const notif = notifications[type];
//     if (notif) {
//       return showNotification(notif.title, {
//         body: notif.body,
//         icon: notif.icon,
//         data,
//         vibrate: [200, 100, 200],
//       });
//     }
//   }, [showNotification]);

//   return {
//     permission,
//     supported,
//     requestPermission,
//     showNotification,
//     showRideNotification,
//   };
// };

// export default useNotification;

// // lib/hooks/index.js - Export all hooks
// export { useAuth } from './useAuth';
// export { useRide } from './useRide';
// export { useWallet } from './useWallet';
// export { useGeolocation } from './useGeolocation';
// export { useDebounce } from './useDebounce';
// export { useLocalStorage } from './useLocalStorage';
// export { useWebSocket } from './useWebSocket';
// export { useNotification } from './useNotification';

// driver/lib/hooks/useRideNotifications.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { SOCKET_EVENTS } from '@/Constants';

export function useRideNotifications() {
  const [incomingRide, setIncomingRide] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const { socket, isConnected } = useWebSocket();

  // Request notification permissions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Handle incoming ride requests
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRideRequest = (data) => {
      console.log('New ride request received:', data);
      setIncomingRide(data);

      // Show notification
      showRideNotification(data);

      // Play sound if enabled
      playNotificationSound();

      // Vibrate if supported and enabled
      vibrateDevice();
    };

    const handleRideTaken = (data) => {
      // Clear incoming ride if it was taken by another driver
      if (incomingRide && incomingRide.rideId === data.rideId) {
        setIncomingRide(null);
      }
    };

    socket.on(SOCKET_EVENTS.RIDE_REQUEST_NEW, handleRideRequest);
    socket.on('ride:taken', handleRideTaken);

    return () => {
      socket.off(SOCKET_EVENTS.RIDE_REQUEST_NEW, handleRideRequest);
      socket.off('ride:taken', handleRideTaken);
    };
  }, [socket, isConnected, incomingRide]);

  const showRideNotification = useCallback((rideData) => {
    if (notificationPermission === 'granted') {
      const notification = new Notification('New Ride Request!', {
        body: `${rideData.distance.toFixed(1)}km away - K${rideData.estimatedFare.toFixed(2)}`,
        icon: '/icons/ride-request.png',
        badge: '/icons/badge.png',
        tag: `ride-${rideData.rideId}`,
        requireInteraction: true, // Keeps notification visible
        vibrate: [200, 100, 200],
        data: rideData
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [notificationPermission]);

  const playNotificationSound = useCallback(() => {
    try {
      // You can use a custom sound from admin settings or default
      const audio = new Audio('/sounds/ride-request.mp3');
      audio.play().catch(err => {
        console.error('Error playing notification sound:', err);
      });
    } catch (error) {
      console.error('Notification sound error:', error);
    }
  }, []);

  const vibrateDevice = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, []);

  const clearIncomingRide = useCallback(() => {
    setIncomingRide(null);
  }, []);

  return {
    incomingRide,
    notificationPermission,
    clearIncomingRide
  };
}

export default useRideNotifications;