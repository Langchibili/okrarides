//Okrarides\driver\lib\hooks\useDriverStats.js
/**
 * useDriverStats hook
 * PATH: lib/hooks/useDriverStats.js
 *
 * Fetches aggregated earnings + ride stats for the current driver.
 * Replaces the old useEarnings hook — one hook for both the home
 * page summary and the full earnings / analytics pages.
 */
import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

const DEFAULT_STATS = {
  summary: {
    totalEarnings:      0,
    totalFareCollected: 0,
    totalCommission:    0,
    completedRides:     0,
    cancelledRides:     0,
    totalRides:         0,
    cashRides:          0,
    digitalRides:       0,
    subscriptionRides:  0,
    floatRides:         0,
    averageRide:        0,
    totalDistance:      0,
    totalDuration:      0,
    acceptanceRate:     100,
    floatDeducted:      0,
  },
  lifetime: {
    totalRides:       0,
    completedRides:   0,
    cancelledRides:   0,
    totalEarnings:    0,
    currentBalance:   0,
    totalDistance:    0,
    averageRating:    0,
    totalRatings:     0,
    acceptanceRate:   100,
    completionRate:   100,
    cancellationRate: 0,
  },
  balances: {
    floatBalance:             0,
    withdrawableFloatBalance: 0,
    subscriptionStatus:       'inactive',
    currentSubscription:      null,
  },
  dailyBreakdown:  [],
  hourlyBreakdown: [],
};

export function useDriverStats() {
  const [stats, setStats]   = useState(DEFAULT_STATS);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const fetchStats = useCallback(async (requestedPeriod = 'today') => {
    setLoading(true);
    setError(null);
    try {
      // apiClient.get() returns the parsed JSON directly (no .data wrapper)
      // Our endpoint returns { success: true, data: { ... } }
      const response = await apiClient.get(`/rides/driver-stats?period=${requestedPeriod}`);
      const data = response?.data || response;
      setStats(data ?? DEFAULT_STATS);
      setPeriod(requestedPeriod);
      return data;
    } catch (err) {
      console.error('[useDriverStats] fetch error:', err);
      // apiClient throws a plain Error with .response attached (see client.js)
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
    // Convenience aliases used by the home page
    summary:  stats.summary,
    lifetime: stats.lifetime,
    balances: stats.balances,
    dailyBreakdown:  stats.dailyBreakdown,
    hourlyBreakdown: stats.hourlyBreakdown,
  };
}