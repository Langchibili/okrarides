// lib/hooks/useRiderNative.js - Custom hook for rider app
import { useEffect, useState, useCallback } from 'react';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { useAuth } from '@/lib/hooks/useAuth';

export const useRiderNative = () => {
  const { user, isAuthenticated } = useAuth();
  const nativeContext = useReactNative();
  const [initialized, setInitialized] = useState(false);

  // Initialize native services after authentication
  useEffect(() => {
    if (!isAuthenticated() || !user?.id || initialized) return;

    const initNative = async () => {
      if (nativeContext.isNative) {
        console.log('Initializing native services for rider...');

        try {
          const result = await nativeContext.initializeNativeServices(
            user.id,
            'rider', // frontendName
            process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL || 'http://localhost:3006'
          );

          if (result.success) {
            console.log('✅ Native services initialized:', result);
            setInitialized(true);

            // For riders, location is optional - just check status
            const locPerm = await nativeContext.checkPermission('location');
            console.log('Location permission status:', locPerm);
          }
        } catch (error) {
          console.error('Error initializing native services:', error);
        }
      }
    };

    initNative();
  }, [user?.id, isAuthenticated, nativeContext.isNative, initialized]);

  // Request location when needed (e.g., when booking ride)
  const requestLocationWhenNeeded = useCallback(async () => {
    const permission = await nativeContext.checkPermission('location');
    
    if (permission !== 'granted') {
      return await nativeContext.requestPermission('location');
    }
    
    return permission;
  }, [nativeContext]);

  // Get current location for pickup
  const getPickupLocation = useCallback(async () => {
    const permission = await requestLocationWhenNeeded();
    
    if (permission !== 'granted') {
      throw new Error('Location permission required to set pickup location');
    }

    return await nativeContext.getCurrentLocation();
  }, [nativeContext, requestLocationWhenNeeded]);

  return {
    ...nativeContext,
    initialized,
    requestLocationWhenNeeded,
    getPickupLocation,
  };
};
