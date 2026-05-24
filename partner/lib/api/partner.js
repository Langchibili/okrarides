// PATH: lib/api/partner.js
import { apiClient } from './client';

// ── Dashboard ─────────────────────────────────────────────────────────────
export const getDashboard = () => apiClient.get('/partner/dashboard');

// ── Drivers ───────────────────────────────────────────────────────────────
export const getDrivers = (params) => {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.status) q.set('status', params.status);
  if (params?.verificationStatus) q.set('verificationStatus', params.verificationStatus);
  q.set('page', String(params?.page ?? 1));
  q.set('pageSize', String(params?.pageSize ?? 20));
  return apiClient.get(`/partner/drivers?${q.toString()}`);
};

export const registerDriver = (data) => apiClient.post('/partner/drivers/register', data);

export const getDriverMetrics = (id, period = 'week') =>
  apiClient.get(`/partner/drivers/${id}/metrics?period=${period}`);

export const modifyDriverFloat = (id, action, amount, note) =>
  apiClient.put(`/partner/drivers/${id}/float`, { action, amount, note });

export const reportDriver = (id, reason, details) =>
  apiClient.post(`/partner/drivers/${id}/report`, { reason, details });

// ── Vehicles ──────────────────────────────────────────────────────────────
export const getVehicles = (search) =>
  apiClient.get(`/partner/vehicles${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const addVehicle = (data) => apiClient.post('/partner/vehicles', data);

export const assignVehicle = (vehicleId, driverId) =>
  apiClient.put(`/partner/vehicles/${vehicleId}/assign`, { driverId });

// ── Float ─────────────────────────────────────────────────────────────────
export const initiatePartnerFloatTopup = (amount) =>
  apiClient.post('/partner/float/topup', { amount });

// ── Fleet map ─────────────────────────────────────────────────────────────
export const getFleetLocations = () => apiClient.get('/partner/fleet/locations');

// ── Rides ─────────────────────────────────────────────────────────────────
export const getFleetRides = (params) => {
  const q = new URLSearchParams();
  if (params?.type) q.set('type', params.type);
  if (params?.status) q.set('status', params.status);
  if (params?.driverId) q.set('driverId', String(params.driverId));
  q.set('page', String(params?.page ?? 1));
  q.set('pageSize', String(params?.pageSize ?? 20));
  return apiClient.get(`/partner/rides?${q.toString()}`);
};

export const getRide = (id, isDelivery = false) =>
  apiClient.get(`/partner/rides/${id}${isDelivery ? '?isDelivery=true' : ''}`);

export const cancelRide = (id, reason, isDelivery = false) =>
  apiClient.post(`/partner/rides/${id}/cancel`, { reason, isDelivery });

// ── Support ───────────────────────────────────────────────────────────────
export const contactSupport = (subject, message) =>
  apiClient.post('/partner/support', { subject, message });
