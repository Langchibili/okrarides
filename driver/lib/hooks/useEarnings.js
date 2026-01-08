'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

export const useEarnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEarnings = useCallback(async (period = 'today') => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/driver/earnings?period=${period}`);
      
      if (response.success) {
        setEarnings(response.earnings);
        setError(null);
        return response.earnings;
      } else {
        throw new Error(response.error || 'Failed to fetch earnings');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEarningsBreakdown = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/driver/earnings/breakdown', {
        params: { startDate, endDate },
      });
      
      if (response.success) {
        setError(null);
        return response.breakdown;
      } else {
        throw new Error(response.error || 'Failed to fetch earnings breakdown');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestWithdrawal = useCallback(async (amount, method, accountDetails) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/driver/withdrawal/request', {
        amount,
        method,
        accountDetails,
      });
      
      if (response.success) {
        setError(null);
        return response;
      } else {
        throw new Error(response.error || 'Failed to request withdrawal');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    earnings,
    loading,
    error,
    fetchEarnings,
    fetchEarningsBreakdown,
    requestWithdrawal,
  };
};


export default useEarnings;
