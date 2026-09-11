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
  isDriverLicenseRequired,
  isNationalIdRequired,
  isProofOfAddressRequired,
  isInsuranceRequired,
  isRoadTaxRequired,
  isFitnessDocumentRequired,
  isVehicleRegistrationRequired,
} from '@/lib/api/adminSettings';

export function useAdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

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