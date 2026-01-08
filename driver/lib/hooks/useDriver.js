
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';

export const useDriver = () => {
  const { user, updateUser } = useAuth();
  
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const toggleOnline = useCallback(async (goOnline) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/driver/toggle-online', {
        isOnline: goOnline,
      });
      
      if (response.success) {
        await refreshDriverProfile();
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

