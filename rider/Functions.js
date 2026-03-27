// Core utility functions and CRUD operations- rider app

import { apiClient } from './lib/api/client';

// ============= Formatting Utilities =============

export const formatCurrency = (amount, currency = 'K') => {
  return `${currency}${Number(amount).toFixed(2)}`;
}

export const formatPhoneNumber = (phone,phoneNumberDigitLength = 9) => {
  const cleaned = phone?.replace(/\D/g, '');
  let phoneCode = null
  let numberLength = phoneNumberDigitLength === null || phoneNumberDigitLength === "null"? 9 : (phoneNumberDigitLength || 9)
  const savedphoneNumberDigitLength = typeof window !== 'undefined'? localStorage.getItem('phoneNumberDigitLength') : 9
  const savedPhoneCode = typeof window !== 'undefined'? localStorage.getItem('savedPhoneCode') : "260"
  if(savedphoneNumberDigitLength){
    numberLength = savedphoneNumberDigitLength === null || savedphoneNumberDigitLength === "null"? 9 : (savedphoneNumberDigitLength || 9)
  }
  if(savedPhoneCode){
     phoneCode = savedPhoneCode === null || savedPhoneCode === "null"? "260" : (savedPhoneCode || "260")
  }
  if (cleaned?.length === numberLength) {
     return `${savedPhoneCode}${getPhoneDigits(cleaned)}`;
  }
  return phone;
}
export const validatePhoneNumber = (phone,phoneNumberDigitLength=9) => {
  let numberLength = phoneNumberDigitLength === null || phoneNumberDigitLength === "null"? 9 : (phoneNumberDigitLength || 9)
  const savedphoneNumberDigitLength = typeof window !== 'undefined'? localStorage.getItem('phoneNumberDigitLength') : 9
  if(savedphoneNumberDigitLength){
    numberLength = savedphoneNumberDigitLength === null || savedphoneNumberDigitLength === "null"? 9 : (savedphoneNumberDigitLength || 9)
  }
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === numberLength && /^[123456789]/.test(cleaned)
}

export const getPhoneDigits = (phoneNumber, phoneNumberDigitLength = 9) => {
  if (!phoneNumber) return '';
  let numberLength = phoneNumberDigitLength === null || phoneNumberDigitLength === "null"? 9 : (phoneNumberDigitLength || 9)
  const savedphoneNumberDigitLength = typeof window !== 'undefined'? localStorage.getItem('phoneNumberDigitLength') : 9
  if(savedphoneNumberDigitLength){
    numberLength = savedphoneNumberDigitLength === null || savedphoneNumberDigitLength === "null"? 9 : (savedphoneNumberDigitLength || 9)
  }
  const digits = String(phoneNumber).replace(/\D/g, '');
  return digits.slice(-numberLength)
}

export const getSavedPhoneCode = ()=>{
  const savedPhoneCode = typeof window !== 'undefined'? localStorage.getItem('savedPhoneCode') : "260"
  return savedPhoneCode === null || savedPhoneCode === "null"? "260" : (savedPhoneCode || "260")
}
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  
  if (format === 'time') {
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return d.toLocaleDateString();
};

export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// ============= Validation =============

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

// ============= Distance Calculations =============

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// ============= Storage Utilities =============

export const storage = {
  get: (key) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },
  
  set: (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
    }
  },
  
  remove: (key) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  },
  
  clear: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

// ============= Notification Utilities =============

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      ...options,
    });
  }
};

// ============= Debounce & Throttle =============

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ============= Error Handling =============

export const handleError = (error) => {
  console.error('Error:', error);
  
  if (error.response) {
    // Server responded with error
    return error.response.data?.message || 'Server error occurred';
  } else if (error.request) {
    // No response received
    return 'Network error. Please check your connection';
  } else {
    // Other errors
    return error.message || 'An unexpected error occurred';
  }
};

// ============= URL Utilities =============

export const generateShareLink = (rideId) => {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/track/${rideId}`;
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

// ============= Date Utilities =============

export const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// ============= CRUD Operations =============

export const CRUD = {
  // Generic GET
  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return apiClient.get(url);
  },
  
  // Generic POST
  async create(endpoint, data) {
    return apiClient.post(endpoint, data);
  },
  
  // Generic PUT
  async update(endpoint, id, data) {
    return apiClient.put(`${endpoint}/${id}`, data);
  },
  
  // Generic DELETE
  async delete(endpoint, id) {
    return apiClient.delete(`${endpoint}/${id}`);
  },
};


/**
 * Extracts a URL from a Strapi image object.
 *
 * @param {object} image        - The Strapi image object (e.g. user.profilePicture)
 * @param {'thumbnail'|'small'|'medium'|'large'} [format] - Desired format key
 * @param {string} [baseUrl]    - Optional API base URL prefix (e.g. 'https://api.okrarides.com')
 * @returns {string|null}       - Full image URL or null if image is missing
 *
 * @example
 * getImageUrl(user.profilePicture, 'thumbnail')  // → '/uploads/thumbnail_...'
 * getImageUrl(user.profilePicture, 'small')       // → '/uploads/small_...'
 * getImageUrl(user.profilePicture)                // → '/uploads/original_...'
 * getImageUrl(user.profilePicture, 'large')       // falls back to .url if large doesn't exist
 */
export function getImageUrl(image, format = null, baseUrl = '') {
  if (!image) return null;

  // If a format is requested, try to find it in the formats object first
  if (format && image.formats?.[format]?.url) {
    return `${baseUrl}${image.formats[format].url}`;
  }

  // Fall back to the root .url (original)
  if (image.url) {
    return `${baseUrl}${image.url}`;
  }

  return null;
} 
// ============= Export all =============
export default {
  getImageUrl,
  formatCurrency,
  formatPhoneNumber,
  getPhoneDigits,
  formatDate,
  formatDistance,
  formatDuration,
  validatePhoneNumber,
  validateEmail,
  validateOTP,
  calculateDistance,
  storage,
  requestNotificationPermission,
  showNotification,
  debounce,
  throttle,
  handleError,
  generateShareLink,
  copyToClipboard,
  getRelativeTime,
  CRUD,
};

