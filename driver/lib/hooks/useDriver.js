//driver/lib/hooks/useDriver.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { useSocket } from '@/lib/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/Constants';

export const useDriver = () => {
  const { user, updateUser } = useAuth();
  
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Socket integration
  const { on, off, emit, updateLocation: socketUpdateLocation } = useSocket();

  useEffect(() => {
    const getDriver = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/users/me?populate[driverProfile][populate]=*');
        if (response.driverProfile) {
          setDriverProfile(response.driverProfile);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    getDriver()
  }, [user]);

  const refreshDriverProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/me?populate[driverProfile][populate]=*');
      if (response.driverProfile) {
        setDriverProfile(response.driverProfile);
        updateUser({ driverProfile: response.driverProfile });
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  const toggleOnline = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/driver/toggle-online');
      
      if (response.success) {
        await refreshDriverProfile();
        // Emit socket event
        if (newOnlineStatus) {
          emit(SOCKET_EVENTS.DRIVER.ONLINE, {
            driverId: user.id,
            location: user.currentLocation,
          });
        } else {
          emit(SOCKET_EVENTS.DRIVER.OFFLINE, {
            driverId: user.id,
          });
        }
        return response;
      } else {
        throw new Error(response.error || 'Failed to toggle online status');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshDriverProfile]);

  const updateLocation = useCallback(async (location) => {
    try {
      const response = await apiClient.post('/driver/update-location', {
        location,
      });
      return response;
    } catch (err) {
      console.error('Error updating location:', err);
      throw err;
    }
  }, []);

  const updatePreferences = useCallback(async (preferences) => {
    try {
      setLoading(true);
      const response = await apiClient.put('/driver/preferences', preferences);
      if (response.success) {
        await refreshDriverProfile();
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshDriverProfile]);
 
  // Socket Event Listeners
  useEffect(() => {
    if (!user?.id) return;

    // Listen for forced offline
    const handleForcedOffline = (data) => {
      setDriverProfile((prev) => ({
        ...prev,
        isOnline: false,
        isAvailable: false,
      }));
      
      // Show alert
      if (typeof window !== 'undefined') {
        alert(data.message || 'You have been taken offline');
      }
    };

    // Listen for subscription expiring
    const handleSubscriptionExpiring = (data) => {
      console.warn('Subscription expiring:', data);
      // You can show a snackbar/toast here
    };

    // Listen for subscription expired
    const handleSubscriptionExpired = (data) => {
      setDriverProfile((prev) => ({
        ...prev,
        subscriptionStatus: 'expired',
        isOnline: false,
        isAvailable: false,
      }));
      
      if (typeof window !== 'undefined') {
        alert(data.message || 'Your subscription has expired');
      }
    };

    on(SOCKET_EVENTS.DRIVER.FORCED_OFFLINE, handleForcedOffline);
    on(SOCKET_EVENTS.SUBSCRIPTION.EXPIRING_WARNING, handleSubscriptionExpiring);
    on(SOCKET_EVENTS.SUBSCRIPTION.EXPIRED, handleSubscriptionExpired);

    return () => {
      off(SOCKET_EVENTS.DRIVER.FORCED_OFFLINE);
      off(SOCKET_EVENTS.SUBSCRIPTION.EXPIRING_WARNING);
      off(SOCKET_EVENTS.SUBSCRIPTION.EXPIRED);
    };
  }, [user?.id, on, off]);

  return {
    driverProfile,
    loading,
    error,
    refreshDriverProfile,
    toggleOnline,
    updateLocation,
    updatePreferences,
    isOnline: driverProfile?.isOnline || false,
    isAvailable: driverProfile?.isAvailable || false,
    subscriptionStatus: driverProfile?.subscriptionStatus || 'inactive',
    verificationStatus: driverProfile?.verificationStatus || 'not_started',
  };
};

export default useDriver;

