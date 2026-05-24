// PATH: lib/api/vehicles.js
import { apiClient } from './client';

export const getVehicleMakesAndModels = async (type) => {
  try {
    const res = await apiClient.get('/vehicle-makes-and-model');
    if (type === 'motorbike' || type === 'motorcycle') return res?.data?.motorbikes ?? {};
    return res?.data?.list ?? {};
  } catch {
    return {};
  }
};

export const getAllowedVehicleYears = async () => {
  try {
    const res = await apiClient.get('/allowed-vehicle-year');
    const years = res?.data?.years ?? [];
    const cur = new Date().getFullYear();
    const sorted = [...years].sort((a, b) => parseInt(a) - parseInt(b));
    const last = parseInt(sorted[sorted.length - 1] ?? String(cur));
    if (last >= cur) return sorted;
    return [...sorted, ...Array.from({ length: cur - last + 1 }, (_, i) => String(last + i + 1))];
  } catch {
    const cur = new Date().getFullYear();
    return Array.from({ length: cur - 2000 + 2 }, (_, i) => String(2000 + i));
  }
};
