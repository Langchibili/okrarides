// PATH: lib/hooks/useAdminSettings.js
'use client';
import { useState, useEffect } from 'react';
import { getAdminSettings } from '@/lib/api/adminSettings';

export function useAdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
