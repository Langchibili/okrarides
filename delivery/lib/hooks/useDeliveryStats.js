// PATH: driver/lib/hooks/useDeliveryStats.js
import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

const DEFAULT_STATS = {
  summary: {
    totalEarnings: 0,
    totalCommission: 0,
    completedDeliveries: 0,
    cancelledDeliveries: 0,
    totalDeliveries: 0,
    cashDeliveries: 0,
    digitalDeliveries: 0,
    averageDelivery: 0,
    totalDistance: 0,
    totalDuration: 0,
    acceptanceRate: 100,
  },
  allTime: {
    totalDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    currentBalance: 0,
    averageRating: 0,
  },
};

export function useDeliveryStats() {
  const [stats, setStats]   = useState(DEFAULT_STATS);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const fetchStats = useCallback(async (requestedPeriod = 'today') => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/delivery-driver/stats?period=${requestedPeriod}`);
      const data = response?.data || response;
      let summary = data?.stats || DEFAULT_STATS.summary
      if(data){
        data.summary = summary
      }
      setStats(data ?? DEFAULT_STATS);
      setPeriod(requestedPeriod);
      return data;
    } catch (err) {
      const message = err?.response?.error?.message ?? err?.message ?? 'Failed to load stats';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    period,
    setPeriod,
    loading,
    error,
    fetchStats,
    summary: stats.summary,
    allTime: stats.allTime,
  };
}