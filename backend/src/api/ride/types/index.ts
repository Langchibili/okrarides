// ============================================
// src/api/ride/types/index.ts
// ============================================

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface EstimateRequest {
  pickupLocation: Location;
  dropoffLocation: Location;
  rideType?: string;
  rideTypes?: string[];
  passengerCount?: number;
}

export interface FareEstimate {
  rideClassId: number;
  rideClassName: string;
  rideClassDescription?: string;
  taxiType?: string;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeFare: number;
  subtotal: number;
  totalFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  availableDrivers: number;
  surgeActive: boolean;
  surgeMultiplier: number;
}

export interface DriverLocation {
  location: Location & {
    heading?: number;
    speed?: number;
  };
  lastUpdated: Date;
  isOnline: boolean;
  rideStatus: string;
}

export interface TrackingData {
  ride: {
    id: number;
    rideCode: string;
    status: string;
    pickupLocation: Location;
    dropoffLocation: Location;
    requestedAt?: Date;
    acceptedAt?: Date;
    arrivedAt?: Date;
    tripStartedAt?: Date;
    estimatedDistance?: number;
    estimatedDuration?: number;
  };
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    profilePicture?: any;
    averageRating: number;
    totalRides: number;
    currentLocation?: Location;
  };
  vehicle?: {
    numberPlate: string;
    make: string;
    model: string;
    color: string;
  };
  tracking: {
    eta: string | null;
    distance: string | null;
    lastUpdated: Date;
  };
}