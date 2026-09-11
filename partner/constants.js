// PATH: constants.js

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
  pending: '#F59E0B',
  accepted: '#3B82F6',
  arrived: '#10B981',
  passenger_onboard: '#EF4444',
  completed: '#10B981',
  cancelled: '#EF4444',
  no_drivers_available: '#6B7280',
};

export const PARTNER_SOCKET_EVENTS = {
  PARTNER_CONNECTED: 'partner:connected',
  PARTNER_FLOAT_UPDATED: 'partner:float:updated',
  PARTNER_DRIVER_LOW_FLOAT: 'partner:driver:low-float',
  DRIVER_STATUS_CHANGED: 'driver:status:changed',
  RIDE_ACCEPTED: 'ride:accepted',
  RIDE_TRIP_STARTED: 'ride:trip:started',
  RIDE_TRIP_COMPLETED: 'ride:trip:completed',
  RIDE_CANCELLED: 'ride:cancelled',
  DELIVERY_ACCEPTED: 'delivery:accepted',
  DELIVERY_COMPLETED: 'delivery:completed',
  DELIVERY_CANCELLED: 'delivery:cancelled',
  PAYMENT_SUCCESS: 'payment:success',
};

export const STATUS_CHIP_COLOR = {
  ONLINE: 'success',
  ON_TRIP: 'error',
  EN_ROUTE: 'warning',
  OFFLINE: 'default',
  PENDING: 'warning',
  SUSPENDED: 'error',
};

export const VEHICLE_TYPES = ['taxi', 'bus', 'motorcycle', 'motorbike', 'truck'];

export const VEHICLE_COLORS = [
  { key: 'white', label: 'White', body: '#F5F5F5', outline: '#D0D0D0' },
  { key: 'black', label: 'Black', body: '#1A1A1A', outline: '#444444' },
  { key: 'silver', label: 'Silver', body: '#C0C0C0', outline: '#A0A0A0' },
  { key: 'red', label: 'Red', body: '#CC2200', outline: '#991A00' },
  { key: 'blue', label: 'Blue', body: '#1A56CC', outline: '#1040AA' },
  { key: 'green', label: 'Green', body: '#1E7A3C', outline: '#155C2C' },
  { key: 'yellow', label: 'Yellow', body: '#F5C300', outline: '#D4A800' },
  { key: 'orange', label: 'Orange', body: '#E06000', outline: '#B04A00' },
  { key: 'brown', label: 'Brown', body: '#7A4A2A', outline: '#5C3520' },
  { key: 'beige', label: 'Beige', body: '#D9C4A0', outline: '#B8A070' },
  { key: 'maroon', label: 'Maroon', body: '#800020', outline: '#600018' },
  { key: 'gold', label: 'Gold', body: '#C8A800', outline: '#A88800' },
];

export const getColorByKey = (key) => {
  return VEHICLE_COLORS.find((c) => c.key === key) || VEHICLE_COLORS[0];
};
