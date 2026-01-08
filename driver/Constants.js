// Constants.js - Driver App Constants

// API Base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';

// App URLs
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
  NO_DRIVERS_AVAILABLE: 'no_drivers_available',
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
export const RIDE_REQUEST_TIMEOUT = 30; // seconds
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

// country
export const DEFAULT_COUNTRY_CODE = '+260';
export const DEFAULT_COUNTRY = 'Zambia';
// Currency
export const DEFAULT_CURRENCY = 'ZMW';
export const CURRENCY_SYMBOL = 'K';

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

// WebSocket Events
export const SOCKET_EVENTS = {
  RIDE_REQUEST_NEW: 'ride:request:new',
  RIDE_ACCEPTED: 'ride:accepted',
  RIDE_CANCELLED: 'ride:cancelled',
  RIDE_COMPLETED: 'ride:completed',
  DRIVER_STATUS_CHANGED: 'driver:status:changed',
  LOCATION_UPDATE: 'location:update',
  SUBSCRIPTION_EXPIRING: 'subscription:expiring:warning',
  SUBSCRIPTION_EXPIRED: 'subscription:expired',
  FORCED_OFFLINE: 'driver:forced:offline',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  DRIVER_PREFERENCES: 'driver_preferences',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
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