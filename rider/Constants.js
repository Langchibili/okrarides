// Application-wide constants
export const APP_NAME = 'OkraRides';
export const APP_VERSION = '1.0.0';
export const APP_TAGLINE = 'Your Journey, Your Way';
export const DEFAULT_CURRENCY = 'ZMW';
export const DEFAULT_CURRENCY_SYMBOL = 'K';
export const DEFAULT_COUNTRY_CODE = '+260';
export const DEFAULT_COUNTRY = 'Zambia';

// API Configuration
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

// Ride Status
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
  pending: 'Finding Driver',
  accepted: 'Driver Accepted',
  arrived: 'Driver Arrived',
  passenger_onboard: 'Trip in Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_drivers_available: 'No Drivers Available',
};

export const RIDE_STATUS_COLORS = {
  pending: '#FF9800',
  accepted: '#2196F3',
  arrived: '#4CAF50',
  passenger_onboard: '#FFC107',
  completed: '#4CAF50',
  cancelled: '#F44336',
  no_drivers_available: '#9E9E9E',
};

// ✅ Unified Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Driver Events
  DRIVER: {
    JOIN: 'driver:join',
    CONNECTED: 'driver:connected',
    SESSION_REPLACED: 'driver:session-replaced',
    LOCATION_UPDATE: 'driver:location:update',
    LOCATION_UPDATED: 'driver:location:updated',
    ONLINE: 'driver:online',
    OFFLINE: 'driver:offline',
    ONLINE_SUCCESS: 'driver:online:success',
    OFFLINE_SUCCESS: 'driver:offline:success',
    FORCED_OFFLINE: 'driver:forced:offline',
    ARRIVED: 'driver:arrived',
  },
  
  // Rider Events
  RIDER: {
    JOIN: 'rider:join',
    CONNECTED: 'rider:connected',
    SESSION_REPLACED: 'rider:session-replaced',
    LOCATION_UPDATE: 'rider:location:update',
    LOCATION_UPDATED: 'rider:location:updated',
  },
  
  // Ride Lifecycle Events
  RIDE: {
    REQUEST_NEW: 'ride:request:new',
    REQUEST_CREATED: 'ride:request:created',
    REQUEST_SENT: 'ride:request:sent',
    REQUEST_RECEIVED: 'ride:request:received',
    ACCEPT: 'ride:accept',
    ACCEPTED: 'ride:accepted',
    ACCEPT_SUCCESS: 'ride:accept:success',
    DECLINE: 'ride:decline',
    DECLINED: 'ride:declined',
    DECLINE_SUCCESS: 'ride:decline:success',
    CANCELLED: 'ride:cancelled',
    TAKEN: 'ride:taken',
    TRIP_STARTED: 'ride:trip:started',
    TRIP_COMPLETED: 'ride:trip:completed',
    NO_DRIVERS: 'ride:no_drivers',
  },
  
  // Subscription Events
  SUBSCRIPTION: {
    EXPIRING_WARNING: 'subscription:expiring:warning',
    EXPIRED: 'subscription:expired',
    ACTIVATED: 'subscription:activated',
  },
  
  // Payment Events
  PAYMENT: {
    SUCCESS: 'payment:success',
    FAILED: 'payment:failed',
  },
  
  // Withdrawal Events
  WITHDRAWAL: {
    PROCESSED: 'withdrawal:processed',
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
    ALERT: 'sos:alert',
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

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  OKRAPAY: 'okrapay',
  MOBILE_MONEY: 'mobile_money',
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  okrapay: 'OkraPay',
  mobile_money: 'Mobile Money',
};

// Ride Types
export const RIDE_TYPES = {
  TAXI: 'taxi',
  BUS: 'bus',
  MOTORCYCLE: 'motorcycle',
  DELIVERY: 'delivery',
};

export const RIDE_TYPE_LABELS = {
  taxi: 'Okra Go',
  bus: 'Okra Bus',
  motorcycle: 'Okra Bike',
  delivery: 'Okra Delivery',
};

// Map Configuration
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

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  RECENT_LOCATIONS: 'recent_locations',
  SAVED_PLACES: 'saved_places',
  ACTIVE_RIDE: 'active_ride',
};

// Time Constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  OTP_RESEND_DELAY: 30,
  SESSION_DURATION: 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
  RIDE_REQUEST_TIMEOUT: 30,
};

// Validation
export const VALIDATION = {
  PHONE: {
    MIN_LENGTH: 9,
    MAX_LENGTH: 9,
    REGEX: /^[97]\d{8}$/,
    PREFIX: [9, 7],
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

// Error Messages
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

// Success Messages
export const SUCCESS_MESSAGES = {
  OTP_SENT: 'OTP sent successfully',
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_UPDATED: 'Profile updated successfully',
  RIDE_BOOKED: 'Ride booked successfully',
  PAYMENT_SUCCESS: 'Payment successful',
};

// Notification Types
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

// Rating Tags
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

// Feature Flags
export const FEATURES = {
  DARK_MODE: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === 'true',
  PWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
  NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  SCHEDULED_RIDES: true,
  FAVORITE_DRIVERS: true,
  SPLIT_PAYMENT: false,
  BIKE_TAXI: true,
  BUS_BOOKING: true,
  DELIVERY: true,
};

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
  SOCKET_EVENTS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  RIDE_TYPES,
  RIDE_TYPE_LABELS,
  MAP_CONFIG,
  STORAGE_KEYS,
  TIME,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  NOTIFICATION_TYPES,
  RATING_TAGS,
  FEATURES,
};