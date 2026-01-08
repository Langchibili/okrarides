// Functions.js - Core CRUD Operations & Utilities
import { apiClient } from './lib/api/client';

//==========================================
// DRIVER STATUS MANAGEMENT
//==========================================
export const toggleOnlineStatus = async (isOnline) => {
  try {
    const response = await apiClient.post('/driver/toggle-online', {
      isOnline,
    });
    return response;
  } catch (error) {
    console.error('Error toggling online status:', error);
    throw error;
  }
};

export const updateDriverLocation = async (location) => {
  try {
    const response = await apiClient.post('/driver/update-location', {
      location,
    });
    return response;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

//==========================================
// RIDE MANAGEMENT
//==========================================
export const acceptRide = async (rideId) => {
  try {
    const response = await apiClient.post(`/rides/${rideId}/accept`);
    return response;
  } catch (error) {
    console.error('Error accepting ride:', error);
    throw error;
  }
};

export const declineRide = async (rideId, reason) => {
  try {
    const response = await apiClient.post(`/rides/${rideId}/decline`, {
      reason,
    });
    return response;
  } catch (error) {
    console.error('Error declining ride:', error);
    throw error;
  }
};

export const startTrip = async (rideId) => {
  try {
    const response = await apiClient.post(`/rides/${rideId}/start`);
    return response;
  } catch (error) {
    console.error('Error starting trip:', error);
    throw error;
  }
};

export const completeTrip = async (rideId, completionData) => {
  try {
    const response = await apiClient.post(`/rides/${rideId}/complete`, completionData);
    return response;
  } catch (error) {
    console.error('Error completing trip:', error);
    throw error;
  }
};

export const cancelRide = async (rideId, reason) => {
  try {
    const response = await apiClient.post(`/rides/${rideId}/cancel`, {
      reason,
    });
    return response;
  } catch (error) {
    console.error('Error cancelling ride:', error);
    throw error;
  }
};

export const confirmArrival = async (rideId, arrivalType) => {
  try {
    const response = await apiClient.post(`/rides/${rideId}/confirm-arrival`, {
      arrivalType, // 'pickup' or 'dropoff'
    });
    return response;
  } catch (error) {
    console.error('Error confirming arrival:', error);
    throw error;
  }
};

//==========================================
// EARNINGS & FINANCE
//==========================================
export const getEarnings = async (period = 'today') => {
  try {
    const response = await apiClient.get(`/driver/earnings?period=${period}`);
    return response;
  } catch (error) {
    console.error('Error fetching earnings:', error);
    throw error;
  }
};

export const getEarningsBreakdown = async (startDate, endDate) => {
  try {
    const response = await apiClient.get('/driver/earnings/breakdown', {
      params: {
        startDate,
        endDate,
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching earnings breakdown:', error);
    throw error;
  }
};

export const requestWithdrawal = async (amount, method, accountDetails) => {
  try {
    const response = await apiClient.post('/driver/withdrawal/request', {
      amount,
      method,
      accountDetails,
    });
    return response;
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    throw error;
  }
};

//==========================================
// SUBSCRIPTION MANAGEMENT
//==========================================
export const getSubscriptionPlans = async () => {
  try {
    const response = await apiClient.get('/subscriptions/plans');
    return response;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

export const subscribeToPlan = async (planId) => {
  try {
    const response = await apiClient.post('/subscriptions/subscribe', {
      planId,
    });
    return response;
  } catch (error) {
    console.error('Error subscribing:', error);
    throw error;
  }
};

export const startFreeTrial = async (planId) => {
  try {
    const response = await apiClient.post('/subscriptions/start-trial', {
      planId,
    });
    return response;
  } catch (error) {
    console.error('Error starting trial:', error);
    throw error;
  }
};

export const cancelSubscription = async (reason) => {
  try {
    const response = await apiClient.post('/subscriptions/cancel', {
      reason,
    });
    return response;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

//==========================================
// FLOAT MANAGEMENT (if float system enabled)
//==========================================
export const getFloatBalance = async () => {
  try {
    const response = await apiClient.get('/driver/float/balance');
    return response;
  } catch (error) {
    console.error('Error fetching float balance:', error);
    throw error;
  }
};

export const topupFloat = async (amount, paymentMethod) => {
  try {
    const response = await apiClient.post('/driver/float/topup', {
      amount,
      paymentMethod,
    });
    return response;
  } catch (error) {
    console.error('Error topping up float:', error);
    throw error;
  }
};


//==========================================
// DOCUMENT VERIFICATION
//==========================================
export const uploadDocument = async (documentType, file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('documentType', documentType);
    
    const response = await apiClient.upload('/driver/documents/upload', formData, onProgress);
    return response;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const getVerificationStatus = async () => {
  try {
    const response = await apiClient.get('/driver/verification/status');
    return response;
  } catch (error) {
    console.error('Error fetching verification status:', error);
    throw error;
  }
};

//==========================================
// NAVIGATION & DIRECTIONS
//==========================================
export const getDirections = async (origin, destination) => {
  try {
    const response = await apiClient.post('/navigation/directions', {
      origin,
      destination,
    });
    return response;
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
};

//==========================================
// STATISTICS & ANALYTICS
//==========================================
export const getDriverStats = async () => {
  try {
    const response = await apiClient.get('/driver/stats');
    return response;
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    throw error;
  }
};

export const getPerformanceMetrics = async (period = 'month') => {
  try {
    const response = await apiClient.get(`/driver/performance?period=${period}`);
    return response;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
};

//==========================================
// UTILITY FUNCTIONS
//==========================================
export const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 9 && /^[97]/.test(cleaned);
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

export const formatCurrency = (amount, currency = 'ZMW') => {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-ZM').format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('en-ZM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};