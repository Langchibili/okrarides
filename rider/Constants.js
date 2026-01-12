// Application-wide constants

// ============= App Configuration =============

export const APP_NAME = 'Okra Rides';
export const APP_VERSION = '1.0.0';
export const APP_TAGLINE = 'Your Journey, Your Way';

export const DEFAULT_CURRENCY = 'ZMW';
export const DEFAULT_CURRENCY_SYMBOL = 'K';
export const DEFAULT_COUNTRY_CODE = '+260';
export const DEFAULT_COUNTRY = 'Zambia';

// ============= API Endpoints =============

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/local',
    REGISTER: '/auth/local/register',
    VERIFY_OTP: '/auth/verify-otp',
    SEND_OTP: '/otp-verifications',
    ME: '/users/me',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
  },
  
  // Rides
  RIDES: {
    BASE: '/rides',
    ESTIMATE: '/rides/estimate',
    TRACK: (id) => `/rides/${id}/track`,
    CANCEL: (id) => `/rides/${id}/cancel`,
    RATE: '/ratings',
  },
  
  // User
  USER: {
    PROFILE: '/users/me',
    UPDATE: '/users/me',
    FAVORITES: '/favorite-locations',
    EMERGENCY_CONTACTS: '/emergency-contacts',
  },
  
  // Wallet
  WALLET: {
    BALANCE: '/wallet/balance',
    TOPUP: '/float-topups',
    TRANSACTIONS: '/transactions',
    WITHDRAW: '/withdrawals',
  },
  
  // Reference Data
  REFERENCE: {
    TAXI_TYPES: '/taxi-types',
    RIDE_CLASSES: '/ride-classes',
    COUNTRIES: '/countries',
    CURRENCIES: '/currencies',
    LANGUAGES: '/languages',
  },
};

// ============= Ride Status =============

export const RIDE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  ARRIVED: 'arrived',
  PASSENGER_ONBOARD: 'passenger_onboard',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_DRIVERS: 'no_drivers_available',
};

export const RIDE_STATUS_LABELS = {
  [RIDE_STATUS.PENDING]: 'Finding Driver',
  [RIDE_STATUS.ACCEPTED]: 'Driver Accepted',
  [RIDE_STATUS.ARRIVED]: 'Driver Arrived',
  [RIDE_STATUS.PASSENGER_ONBOARD]: 'Trip in Progress',
  [RIDE_STATUS.COMPLETED]: 'Completed',
  [RIDE_STATUS.CANCELLED]: 'Cancelled',
  [RIDE_STATUS.NO_DRIVERS]: 'No Drivers Available',
};

export const RIDE_STATUS_COLORS = {
  [RIDE_STATUS.PENDING]: '#FF9800',
  [RIDE_STATUS.ACCEPTED]: '#2196F3',
  [RIDE_STATUS.ARRIVED]: '#4CAF50',
  [RIDE_STATUS.PASSENGER_ONBOARD]: '#FFC107',
  [RIDE_STATUS.COMPLETED]: '#4CAF50',
  [RIDE_STATUS.CANCELLED]: '#F44336',
  [RIDE_STATUS.NO_DRIVERS]: '#9E9E9E',
};

// ============= WebSocket Events =============
export const SOCKET_EVENTS = {
  // Rider Events
  RIDER: {
    JOIN: 'rider:join',
    CONNECTED: 'rider:connected',
    SESSION_REPLACED: 'rider:session-replaced',
    LOCATION_UPDATE: 'rider:location:update',
  },
  
  // Ride Lifecycle Events
  RIDE: {
    REQUEST_CREATED: 'ride:request:created',
    REQUEST_SENT: 'ride:request:sent',
    ACCEPTED: 'ride:accepted',
    DECLINED: 'ride:declined',
    CANCELLED: 'ride:cancelled',
    DRIVER_ARRIVED: 'ride:driver:arrived',
    TRIP_STARTED: 'ride:trip:started',
    TRIP_COMPLETED: 'ride:trip:completed',
    TAKEN: 'ride:taken',
  },
  
  // Driver Location Events
  DRIVER: {
    LOCATION_UPDATED: 'driver:location:updated',
    ARRIVED: 'ride:driver:arrived',
  },
  
  // Payment Events
  PAYMENT: {
    SUCCESS: 'payment:success',
    FAILED: 'payment:failed',
  },
  
  // Rating Events
  RATING: {
    REQUEST: 'rating:request',
    SUBMITTED: 'rating:submitted',
  },
  
  // Notification Events
  NOTIFICATION: {
    NEW: 'notification:new',
    BROADCAST: 'notification:broadcast',
  },
  
  // SOS Events
  SOS: {
    TRIGGER: 'sos:trigger',
    TRIGGERED: 'sos:triggered',
    ACKNOWLEDGED: 'sos:acknowledged',
  },
  
  // Affiliate Events
  AFFILIATE: {
    REFERRAL_SIGNUP: 'affiliate:referral:signup',
    COMMISSION_EARNED: 'affiliate:commission:earned',
  },
  
  // System Events
  SYSTEM: {
    ANNOUNCEMENT: 'system:announcement',
  },
  
  // Connection Events
  CONNECTION: {
    PING: 'ping',
    PONG: 'pong',
    ERROR: 'error',
  },
};
// ============= Payment Methods =============

export const PAYMENT_METHODS = {
  CASH: 'cash',
  OKRAPAY: 'okrapay',
  MOBILE_MONEY: 'mobile_money',
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.OKRAPAY]: 'OkraPay',
  [PAYMENT_METHODS.MOBILE_MONEY]: 'Mobile Money',
};

// ============= Ride Types =============

export const RIDE_TYPES = {
  TAXI: 'taxi',
  BUS: 'bus',
  MOTORCYCLE: 'motorcycle',
  DELIVERY: 'delivery',
};

export const RIDE_TYPE_LABELS = {
  [RIDE_TYPES.TAXI]: 'Okra Go',
  [RIDE_TYPES.BUS]: 'Okra Bus',
  [RIDE_TYPES.MOTORCYCLE]: 'Okra Bike',
  [RIDE_TYPES.DELIVERY]: 'Okra Delivery',
};

// ============= Map Configuration =============

export const MAP_CONFIG = {
  DEFAULT_CENTER: {
    lat: -15.4167, // Lusaka
    lng: 28.2833,
  },
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 10,
  MAX_ZOOM: 20,
  
  // Zambia bounds
  BOUNDS: {
    north: -8.2,
    south: -18.1,
    west: 21.9,
    east: 33.7,
  },
  
  // Colors
  COLORS: {
    PICKUP: '#4CAF50',
    DROPOFF: '#F44336',
    ROUTE: '#2196F3',
    DRIVER: '#FFC107',
    BUS_ROUTE: '#9C27B0',
  },
};

// ============= Validation Rules =============

export const VALIDATION = {
  PHONE: {
    MIN_LENGTH: 9,
    MAX_LENGTH: 9,
    REGEX: /^[97]\d{8}$/,
    PREFIX: [9, 7], // Valid first digits
  },
  
  OTP: {
    LENGTH: 6,
    REGEX: /^\d{6}$/,
    EXPIRY_MINUTES: 10,
  },
  
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    REGEX: /^[a-zA-Z\s]+$/,
  },
};

// ============= Time Constants =============

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  
  OTP_RESEND_DELAY: 30, // seconds
  SESSION_DURATION: 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
  RIDE_REQUEST_TIMEOUT: 30, // seconds
};

// ============= Storage Keys =============

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  RECENT_LOCATIONS: 'recent_locations',
  SAVED_PLACES: 'saved_places',
  ACTIVE_RIDE: 'active_ride',
};

// ============= Error Messages =============

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_PHONE: 'Please enter a valid 9-digit phone number.',
  INVALID_OTP: 'Please enter a valid 6-digit OTP.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  LOCATION_DENIED: 'Location permission denied. Please enable location services.',
  LOCATION_UNAVAILABLE: 'Unable to get your location. Please try again.',
};

// ============= Success Messages =============

export const SUCCESS_MESSAGES = {
  OTP_SENT: 'OTP sent successfully',
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  RIDE_BOOKED: 'Ride booked successfully',
  PAYMENT_SUCCESS: 'Payment successful',
};

// ============= Notification Types =============

export const NOTIFICATION_TYPES = {
  RIDE_REQUEST: 'ride_request',
  RIDE_ACCEPTED: 'ride_accepted',
  RIDE_STARTED: 'ride_started',
  RIDE_COMPLETED: 'ride_completed',
  RIDE_CANCELLED: 'ride_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  PROMO_CODE: 'promo_code',
  SYSTEM: 'system_announcement',
};

// ============= Rating Tags =============

export const RATING_TAGS = {
  POSITIVE: [
    'Great Service',
    'Clean Vehicle',
    'Safe Driving',
    'Friendly',
    'On Time',
    'Professional',
  ],
  NEGATIVE: [
    'Late',
    'Rude Behavior',
    'Unsafe Driving',
    'Dirty Vehicle',
    'Wrong Route',
    'Unprofessional',
  ],
};

// ============= Feature Flags =============

export const FEATURES = {
  DARK_MODE: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === 'true',
  PWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
  NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  SCHEDULED_RIDES: true,
  FAVORITE_DRIVERS: true,
  SPLIT_PAYMENT: false, // Coming soon
  BIKE_TAXI: true,
  BUS_BOOKING: true,
  DELIVERY: true,
};

// ============= Export all =============

export default {
  APP_NAME,
  APP_VERSION,
  APP_TAGLINE,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_COUNTRY,
  API_BASE_URL,
  API_ENDPOINTS,
  RIDE_STATUS,
  RIDE_STATUS_LABELS,
  RIDE_STATUS_COLORS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  RIDE_TYPES,
  RIDE_TYPE_LABELS,
  MAP_CONFIG,
  VALIDATION,
  TIME,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  NOTIFICATION_TYPES,
  RATING_TAGS,
  FEATURES,
};


