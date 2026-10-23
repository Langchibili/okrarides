// // PATH: lib/hooks/useAdminSettings.js
// 'use client';
// import { useState, useEffect } from 'react';
// import { getAdminSettings } from '@/lib/api/adminSettings';

// export function useAdminSettings() {
//   const [settings, setSettings] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     getAdminSettings()
//       .then(setSettings)
//       .catch(() => setSettings(null))
//       .finally(() => setLoading(false));
//   }, []);

//   return { settings, loading };
// }

'use client';
// PATH: lib/hooks/useAdminSettings.js

import { useState, useEffect } from 'react';
import {
  getAdminSettings,
  getAdminSettingsCacheKey,
  isDriverLicenseRequired,
  isNationalIdRequired,
  isProofOfAddressRequired,
  isInsuranceRequired,
  isRoadTaxRequired,
  isFitnessDocumentRequired,
  isVehicleRegistrationRequired,
} from '@/lib/api/adminSettings';

export function useAdminSettings({ countryId = null, userId = null } = {}) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = getAdminSettingsCacheKey(countryId, userId)
    const timestampKey = `${cacheKey}:timestamp`
    let cancelled = false

    const loadSettings = async () => {
      setLoading(true)
      try {
        const data = await getAdminSettings({ countryId })
        if (cancelled) return
        setSettings(data)
        window.__adminSettings = data
        localStorage.setItem(cacheKey, JSON.stringify(data))
        localStorage.setItem(timestampKey, Date.now().toString())
      } catch (error) {
        console.error('Failed to fetch country-resolved settings:', error)
        const cached = localStorage.getItem(cacheKey)
        if (!cancelled && cached) {
          try {
            const data = JSON.parse(cached)
            setSettings(data)
            window.__adminSettings = data
          } catch (cacheError) {
            console.error('Failed to parse cached country settings:', cacheError)
            setSettings(null)
          }
        } else if (!cancelled) {
          setSettings(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSettings()
    return () => { cancelled = true }
  }, [countryId, userId]);

  return {
    settings,
    loading,
    // Document requirements — all default to true when settings are null (safe default)
    isDriverLicenseRequired: isDriverLicenseRequired(settings),
    isNationalIdRequired: isNationalIdRequired(settings),
    isProofOfAddressRequired: isProofOfAddressRequired(settings),
    isInsuranceRequired: isInsuranceRequired(settings),
    isRoadTaxRequired: isRoadTaxRequired(settings),
    isFitnessDocumentRequired: isFitnessDocumentRequired(settings),
    isVehicleRegistrationRequired: isVehicleRegistrationRequired(settings),
  };
}