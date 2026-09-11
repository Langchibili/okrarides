// rider/lib/hooks/useRiderBlocking.js
'use client';

import { useState, useCallback, useEffect } from 'react';
import { riderAPI } from '@/lib/api/rider';

export function useRiderBlocking() {
  const [blockedDrivers, setBlockedDrivers] = useState({
    tempBlocked: {},
    permanentlyBlocked: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clean temp blocks when app opens/hook mounts
  useEffect(() => {
    cleanTempBlocks();
  }, []);

  const cleanTempBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await riderAPI.cleanTempBlocks();
      
      if (result.success) {
        // Refresh blocked drivers list
        await loadBlockedDrivers();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBlockedDrivers = useCallback(async () => {
    try {
      const result = await riderAPI.getBlockedDrivers();
      
      if (result.success) {
        setBlockedDrivers({
          tempBlocked: result.data.tempBlocked || {},
          permanentlyBlocked: result.data.permanentlyBlocked || []
        });
      }
    } catch (err) {
      console.error('Error loading blocked drivers:', err);
    }
  }, []);

  const blockDriver = useCallback(async (driverId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await riderAPI.blockDriver(driverId);
      
      if (result.success) {
        await loadBlockedDrivers();
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadBlockedDrivers]);

  const unblockDriver = useCallback(async (driverId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await riderAPI.unblockDriver(driverId);
      
      if (result.success) {
        await loadBlockedDrivers();
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadBlockedDrivers]);

  const isDriverBlocked = useCallback((driverId) => {
    // Check permanent blocks
    if (blockedDrivers.permanentlyBlocked.includes(driverId)) {
      return true;
    }
    
    // Check temp blocks
    return !!blockedDrivers.tempBlocked[driverId];
  }, [blockedDrivers]);

  return {
    blockedDrivers,
    loading,
    error,
    cleanTempBlocks,
    blockDriver,
    unblockDriver,
    isDriverBlocked,
    loadBlockedDrivers
  };
}

export default useRiderBlocking;