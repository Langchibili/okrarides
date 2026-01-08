'use client';

import { useState } from 'react';
import { affiliateAPI } from '@/lib/api/affiliate';

export const useAffiliate = () => {
  const [affiliate, setAffiliate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAffiliateByCode = async (code) => {
    if (!code) {
      setAffiliate(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await affiliateAPI.getByCode(code);
      setAffiliate(data);
      return data;
    } catch (err) {
      setError(err.message || 'Invalid referral code');
      setAffiliate(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    affiliate,
    loading,
    error,
    fetchAffiliateByCode,
    setAffiliate
  };
};

export default useAffiliate;