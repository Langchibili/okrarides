// Application-wide constants
export const APP_NAME = 'OkraRides';
export const APP_VERSION = '1.0.0';
export const DEFAULT_CURRENCY = 'ZMW';
export const DEFAULT_CURRENCY_SYMBOL = 'K';
export const CURRENCY_SYMBOL = 'K'; // Alias
export const DEFAULT_COUNTRY_CODE = '+260';
export const DEFAULT_COUNTRY = 'Zambia';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
export const DRIVER_APP_URL = process.env.NEXT_PUBLIC_DRIVER_APP_URL || 'http://localhost:3001';
export const RIDER_APP_URL = process.env.NEXT_PUBLIC_RIDER_APP_URL || 'http://localhost:3000';

// Driver Status
export const DRIVER_STATUS = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  BUSY: 'busy',
  ON_RIDE: 'on_ride',
  ARRIVING: 'arriving',
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

// Verification Status
export const VERIFICATION_STATUS = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  INACTIVE: 'inactive',
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended',
};

// Vehicle Types
export const VEHICLE_TYPE = {
  TAXI: 'taxi',
  BUS: 'bus',
  MOTORCYCLE: 'motorcycle',
  TRUCK: 'truck',
};

// Document Types
export const DOCUMENT_TYPE = {
  DRIVERS_LICENSE: 'drivers_license',
  NATIONAL_ID: 'national_id',
  PROOF_OF_ADDRESS: 'proof_of_address',
  VEHICLE_REGISTRATION: 'vehicle_registration',
  INSURANCE: 'insurance',
  ROAD_TAX: 'road_tax',
  FITNESS_CERTIFICATE: 'fitness_certificate',
};

// Earnings Period
export const EARNINGS_PERIOD = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  CUSTOM: 'custom',
};

// Navigation Actions
export const NAVIGATION_ACTIONS = {
  TURN_LEFT: 'turn_left',
  TURN_RIGHT: 'turn_right',
  CONTINUE_STRAIGHT: 'continue_straight',
  U_TURN: 'u_turn',
  ARRIVE: 'arrive',
};

// App Settings
export const MAX_RIDE_DISTANCE = 100; // km
export const DEFAULT_MAP_ZOOM = 15;
export const LOCATION_UPDATE_INTERVAL = 5000; // ms
export const MINIMUM_WITHDRAWAL_AMOUNT = 50; // ZMW
export const COMMISSION_RATE = 15; // percent (for float mode)

// Feature Flags
export const SOUND_ENABLED = true;
export const VIBRATION_ENABLED = true;
export const AUTO_NAVIGATE_TO_PICKUP = true;
export const DEFAULT_NAVIGATION_APP = 'google_maps';

// Colors (Driver App - Green Theme)
export const COLORS = {
  primary: '#4CAF50',
  primaryLight: '#81C784',
  primaryDark: '#388E3C',
  secondary: '#FFC107',
  accent: '#2196F3',
  earnings: '#FFA000',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  online: '#4CAF50',
  offline: '#757575',
  busy: '#FF9800',
  onRide: '#2196F3',
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
    DRIVER_ARRIVED: 'ride:driver:arrived',
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
  
  // Bus Route Events
  BUS: {
    ROUTE_STARTED: 'bus:route:started',
    LOCATION_UPDATED: 'bus:location:updated',
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

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  DRIVER_PREFERENCES: 'driver_preferences',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  RECENT_LOCATIONS: 'recent_locations',
  ACTIVE_RIDE: 'active_ride',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/local',
  REGISTER: '/auth/local/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // Driver
  TOGGLE_ONLINE: '/driver/toggle-online',
  UPDATE_LOCATION: '/driver/update-location',
  DRIVER_STATS: '/driver/stats',
  DRIVER_EARNINGS: '/driver/earnings',
  
  // Rides
  ACCEPT_RIDE: '/rides/:id/accept',
  DECLINE_RIDE: '/rides/:id/decline',
  START_TRIP: '/rides/:id/start',
  COMPLETE_TRIP: '/rides/:id/complete',
  CANCEL_RIDE: '/rides/:id/cancel',
  CONFIRM_ARRIVAL: '/rides/:id/confirm-arrival',
  
  // Subscriptions
  SUBSCRIPTION_PLANS: '/subscriptions/plans',
  START_TRIAL: '/subscriptions/start-trial',
  SUBSCRIBE: '/subscriptions/subscribe',
  RENEW: '/subscriptions/renew',
  CANCEL_SUBSCRIPTION: '/subscriptions/cancel',
  MY_SUBSCRIPTION: '/subscriptions/me',
  
  // Vehicles
  VEHICLES: '/driver/vehicles',
  ADD_VEHICLE: '/driver/vehicles',
  UPDATE_VEHICLE: '/driver/vehicles/:id',
  
  // Documents
  UPLOAD_DOCUMENT: '/driver/docs/upload',
  VERIFICATION_STATUS: '/driver/verification/status',
  
  // Earnings & Finance
  EARNINGS_BREAKDOWN: '/driver/earnings/breakdown',
  REQUEST_WITHDRAWAL: '/driver/withdrawal/request',
  FLOAT_BALANCE: '/driver/float/balance',
  TOPUP_FLOAT: '/driver/float/topup',
};

// Time Constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  OTP_RESEND_DELAY: 30,
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
};

export default {
  APP_NAME,
  APP_VERSION,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_SYMBOL,
  CURRENCY_SYMBOL,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_COUNTRY,
  API_BASE_URL,
  FRONTEND_URL,
  DRIVER_APP_URL,
  RIDER_APP_URL,
  DRIVER_STATUS,
  RIDE_STATUS,
  RIDE_STATUS_LABELS,
  RIDE_STATUS_COLORS,
  VERIFICATION_STATUS,
  SUBSCRIPTION_STATUS,
  VEHICLE_TYPE,
  DOCUMENT_TYPE,
  EARNINGS_PERIOD,
  NAVIGATION_ACTIONS,
  MAX_RIDE_DISTANCE,
  DEFAULT_MAP_ZOOM,
  LOCATION_UPDATE_INTERVAL,
  MINIMUM_WITHDRAWAL_AMOUNT,
  COMMISSION_RATE,
  SOUND_ENABLED,
  VIBRATION_ENABLED,
  AUTO_NAVIGATE_TO_PICKUP,
  DEFAULT_NAVIGATION_APP,
  COLORS,
  SOCKET_EVENTS,
  PAYMENT_METHODS,
  STORAGE_KEYS,
  API_ENDPOINTS,
  TIME,
  VALIDATION,
};