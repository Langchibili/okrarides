import type { Schema, Struct } from '@strapi/strapi';

export interface AffiliateAffiliateProfile extends Struct.ComponentSchema {
  collectionName: 'components_affiliate_affiliate_profiles';
  info: {
    displayName: 'Affiliate Profile';
    icon: 'share';
  };
  attributes: {
    activeReferrals: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    affiliateCode: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    pendingEarnings: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    pointsBalance: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    qrCode: Schema.Attribute.Media<'images'>;
    totalEarnings: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalPoints: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    totalReferrals: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    withdrawableBalance: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ConductorProfilesConductorProfile
  extends Struct.ComponentSchema {
  collectionName: 'components_conductor_profiles_conductor_profiles';
  info: {
    displayName: 'Conductor Profile';
    icon: 'clipboard';
  };
  attributes: {
    assignedDriver: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    currentBalance: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    nationalIdBack: Schema.Attribute.Media<'images' | 'files'>;
    nationalIdFront: Schema.Attribute.Media<'images' | 'files'>;
    nationalIdNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    totalEarnings: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    verificationNotes: Schema.Attribute.Text;
    verificationStatus: Schema.Attribute.Enumeration<
      ['not_started', 'pending', 'approved', 'rejected', 'suspended']
    > &
      Schema.Attribute.DefaultTo<'not_started'>;
    verifiedAt: Schema.Attribute.DateTime;
  };
}

export interface DeliveryProfilesDeliveryProfile
  extends Struct.ComponentSchema {
  collectionName: 'components_delivery_profiles_delivery_profiles';
  info: {
    displayName: 'Delivery Profile';
    icon: 'box';
  };
  attributes: {
    activeVehicleType: Schema.Attribute.Enumeration<
      ['none', 'taxi', 'motorbike', 'motorcycle', 'truck']
    > &
      Schema.Attribute.DefaultTo<'none'>;
    averageRating: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    cancelledDeliveries: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    completedDeliveries: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    currentBalance: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isAvailable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    motorbike: Schema.Attribute.Component<'delivery-vehicles.motorbike', false>;
    motorcycle: Schema.Attribute.Component<
      'delivery-vehicles.motorcycle',
      false
    >;
    taxi: Schema.Attribute.Component<'delivery-vehicles.taxi', false>;
    totalDeliveries: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    totalEarnings: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    truck: Schema.Attribute.Component<'delivery-vehicles.truck', false>;
    verificationNotes: Schema.Attribute.Text;
    verificationStatus: Schema.Attribute.Enumeration<
      ['not_started', 'pending', 'approved', 'rejected', 'suspended']
    > &
      Schema.Attribute.DefaultTo<'not_started'>;
    verifiedAt: Schema.Attribute.DateTime;
  };
}

export interface DeliveryVehiclesMotorbike extends Struct.ComponentSchema {
  collectionName: 'components_delivery_vehicles_motorbikes';
  info: {
    displayName: 'Delivery Motorbike';
    icon: 'motorcycle';
  };
  attributes: {
    hasDeliveryBox: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    maxPackageWeight: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<20>;
    vehicle: Schema.Attribute.Relation<'oneToOne', 'api::vehicle.vehicle'>;
  };
}

export interface DeliveryVehiclesMotorcycle extends Struct.ComponentSchema {
  collectionName: 'components_delivery_vehicles_motorcycles';
  info: {
    displayName: 'Delivery Motorcycle';
    icon: 'motorcycle';
  };
  attributes: {
    hasDeliveryBox: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    maxPackageWeight: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<30>;
    vehicle: Schema.Attribute.Relation<'oneToOne', 'api::vehicle.vehicle'>;
  };
}

export interface DeliveryVehiclesTaxi extends Struct.ComponentSchema {
  collectionName: 'components_delivery_vehicles_taxis';
  info: {
    displayName: 'Delivery Taxi';
    icon: 'car';
  };
  attributes: {
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    maxPackageVolume: Schema.Attribute.Decimal;
    maxPackageWeight: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<50>;
    vehicle: Schema.Attribute.Relation<'oneToOne', 'api::vehicle.vehicle'>;
  };
}

export interface DeliveryVehiclesTruck extends Struct.ComponentSchema {
  collectionName: 'components_delivery_vehicles_trucks';
  info: {
    displayName: 'Delivery Truck';
    icon: 'truck';
  };
  attributes: {
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    maxPackageVolume: Schema.Attribute.Decimal;
    maxPackageWeight: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<1000>;
    truckType: Schema.Attribute.Enumeration<['pickup', 'van', 'lorry']> &
      Schema.Attribute.DefaultTo<'pickup'>;
    vehicle: Schema.Attribute.Relation<'oneToOne', 'api::vehicle.vehicle'>;
  };
}

export interface DriverProfilesBusDriver extends Struct.ComponentSchema {
  collectionName: 'components_driver_profiles_bus_drivers';
  info: {
    displayName: 'Bus Driver';
    icon: 'bus';
  };
  attributes: {
    assignedRoutes: Schema.Attribute.Relation<
      'manyToMany',
      'api::bus-route.bus-route'
    >;
    bus: Schema.Attribute.Relation<'oneToOne', 'api::vehicle.vehicle'>;
    conductor: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    totalEarnings: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalTrips: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    verificationStatus: Schema.Attribute.Enumeration<
      ['not_started', 'pending', 'approved', 'rejected']
    > &
      Schema.Attribute.DefaultTo<'not_started'>;
  };
}

export interface DriverProfilesDriverProfile extends Struct.ComponentSchema {
  collectionName: 'components_driver_profiles_driver_profiles';
  info: {
    displayName: 'Driver Profile';
    icon: 'car';
  };
  attributes: {
    acceptanceRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<100>;
    acceptedRideClasses: Schema.Attribute.Relation<
      'manyToMany',
      'api::ride-class.ride-class'
    >;
    acceptedTaxiTypes: Schema.Attribute.Relation<
      'manyToMany',
      'api::taxi-type.taxi-type'
    >;
    activeSubProfile: Schema.Attribute.Enumeration<
      ['none', 'taxi', 'bus', 'motorbike']
    > &
      Schema.Attribute.DefaultTo<'none'>;
    allowedCountries: Schema.Attribute.Relation<
      'manyToMany',
      'api::country.country'
    >;
    allowedGeofenceZones: Schema.Attribute.Relation<
      'manyToMany',
      'api::geofence-zone.geofence-zone'
    >;
    allowedNegativeBalance: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    assignedVehicle: Schema.Attribute.Relation<
      'manyToOne',
      'api::vehicle.vehicle'
    >;
    autoAcceptRides: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    autoWithdrawEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    autoWithdrawThreshold: Schema.Attribute.Decimal;
    averageRating: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    busDriver: Schema.Attribute.Component<'driver-profiles.bus-driver', false>;
    cancellationRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    cancelledRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    completedRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    completionRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<100>;
    conductor: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    currentBalance: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    currentRide: Schema.Attribute.Relation<'manyToOne', 'api::ride.ride'>;
    currentRoute: Schema.Attribute.Relation<
      'manyToOne',
      'api::bus-route.bus-route'
    >;
    currentSubscription: Schema.Attribute.Relation<
      'manyToOne',
      'api::driver-subscription.driver-subscription'
    >;
    deviceIMEI: Schema.Attribute.String & Schema.Attribute.Unique;
    deviceUnlocked: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    driverLicenseBack: Schema.Attribute.Media<'images' | 'files'>;
    driverLicenseFront: Schema.Attribute.Media<'images' | 'files'>;
    driverLicenseNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    emailNotifications: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    floatBalance: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    floatLimit: Schema.Attribute.Decimal;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isAvailable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isBusDriver: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isOnline: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lastCancellation: Schema.Attribute.DateTime;
    licenseExpiryDate: Schema.Attribute.Date;
    maxDistanceForPickup: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<10>;
    motorbikeRider: Schema.Attribute.Component<
      'driver-profiles.motorbike-rider',
      false
    >;
    nationalIdBack: Schema.Attribute.Media<'images' | 'files'>;
    nationalIdFront: Schema.Attribute.Media<'images' | 'files'>;
    nationalIdNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    negativeBalanceLimit: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    pendingWithdrawal: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    preferredNavigationApp: Schema.Attribute.Enumeration<
      ['google_maps', 'waze']
    > &
      Schema.Attribute.DefaultTo<'google_maps'>;
    preferredWithdrawalMethod: Schema.Attribute.Enumeration<['okrapay']> &
      Schema.Attribute.DefaultTo<'okrapay'>;
    proofOfAddress: Schema.Attribute.Media<'images' | 'files'>;
    pushNotifications: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    rideRequestSound: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    ridesCompletedForUnlock: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    smsNotifications: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    subscriptionHistory: Schema.Attribute.Relation<
      'oneToMany',
      'api::driver-subscription.driver-subscription'
    >;
    subscriptionPlan: Schema.Attribute.Relation<
      'manyToOne',
      'api::subscription-plan.subscription-plan'
    >;
    subscriptionStatus: Schema.Attribute.Enumeration<
      ['inactive', 'trial', 'active', 'expired', 'cancelled', 'suspended']
    > &
      Schema.Attribute.DefaultTo<'inactive'>;
    targetRidesForUnlock: Schema.Attribute.Integer;
    taxiDriver: Schema.Attribute.Component<
      'driver-profiles.taxi-driver',
      false
    >;
    totalDistance: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalEarnings: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalRatings: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    totalRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    vehicles: Schema.Attribute.Relation<'oneToMany', 'api::vehicle.vehicle'>;
    verificationNotes: Schema.Attribute.Text;
    verificationStatus: Schema.Attribute.Enumeration<
      ['not_started', 'pending', 'approved', 'rejected', 'suspended']
    > &
      Schema.Attribute.DefaultTo<'not_started'>;
    verifiedAt: Schema.Attribute.DateTime;
    verifiedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    voiceNavigationEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
  };
}

export interface DriverProfilesMotorbikeRider extends Struct.ComponentSchema {
  collectionName: 'components_driver_profiles_motorbike_riders';
  info: {
    displayName: 'Motorbike Rider';
    icon: 'motorcycle';
  };
  attributes: {
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    motorbike: Schema.Attribute.Relation<'oneToOne', 'api::vehicle.vehicle'>;
    totalEarnings: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    verificationStatus: Schema.Attribute.Enumeration<
      ['not_started', 'pending', 'approved', 'rejected']
    > &
      Schema.Attribute.DefaultTo<'not_started'>;
  };
}

export interface DriverProfilesTaxiDriver extends Struct.ComponentSchema {
  collectionName: 'components_driver_profiles_taxi_drivers';
  info: {
    displayName: 'Taxi Driver';
    icon: 'taxi';
  };
  attributes: {
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    totalEarnings: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    vehicle: Schema.Attribute.Relation<'oneToOne', 'api::vehicle.vehicle'>;
    verificationStatus: Schema.Attribute.Enumeration<
      ['not_started', 'pending', 'approved', 'rejected']
    > &
      Schema.Attribute.DefaultTo<'not_started'>;
  };
}

export interface PackagesRecipientDetails extends Struct.ComponentSchema {
  collectionName: 'components_packages_recipient_details';
  info: {
    displayName: 'Recipient Details';
    icon: 'user';
  };
  attributes: {
    address: Schema.Attribute.Text & Schema.Attribute.Required;
    alternatePhoneNumber: Schema.Attribute.String;
    location: Schema.Attribute.JSON & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    phoneNumber: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface RiderProfilesRiderProfile extends Struct.ComponentSchema {
  collectionName: 'components_rider_profiles_rider_profiles';
  info: {
    displayName: 'Rider Profile';
    icon: 'user';
  };
  attributes: {
    averageRating: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    cancelledRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    completedRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    defaultPaymentMethod: Schema.Attribute.Relation<
      'oneToOne',
      'api::payment-method.payment-method'
    >;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    paymentMethods: Schema.Attribute.Relation<
      'oneToMany',
      'api::payment-method.payment-method'
    >;
    ridePreferences: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    savedLocations: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    totalRatings: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    totalRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    totalSpent: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
  };
}

export interface SupportTicketResponse extends Struct.ComponentSchema {
  collectionName: 'components_support_ticket_responses';
  info: {
    displayName: 'Ticket Response';
    icon: 'comment';
  };
  attributes: {
    attachments: Schema.Attribute.Media<'images' | 'files', true>;
    isInternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    respondedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    timestamp: Schema.Attribute.DateTime & Schema.Attribute.Required;
  };
}

export interface TranslationsTranslationItem extends Struct.ComponentSchema {
  collectionName: 'components_translations_translation_items';
  info: {
    displayName: 'Translation Item';
    icon: 'language';
  };
  attributes: {
    language: Schema.Attribute.Relation<'manyToOne', 'api::language.language'> &
      Schema.Attribute.Required;
    value: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'affiliate.affiliate-profile': AffiliateAffiliateProfile;
      'conductor-profiles.conductor-profile': ConductorProfilesConductorProfile;
      'delivery-profiles.delivery-profile': DeliveryProfilesDeliveryProfile;
      'delivery-vehicles.motorbike': DeliveryVehiclesMotorbike;
      'delivery-vehicles.motorcycle': DeliveryVehiclesMotorcycle;
      'delivery-vehicles.taxi': DeliveryVehiclesTaxi;
      'delivery-vehicles.truck': DeliveryVehiclesTruck;
      'driver-profiles.bus-driver': DriverProfilesBusDriver;
      'driver-profiles.driver-profile': DriverProfilesDriverProfile;
      'driver-profiles.motorbike-rider': DriverProfilesMotorbikeRider;
      'driver-profiles.taxi-driver': DriverProfilesTaxiDriver;
      'packages.recipient-details': PackagesRecipientDetails;
      'rider-profiles.rider-profile': RiderProfilesRiderProfile;
      'support.ticket-response': SupportTicketResponse;
      'translations.translation-item': TranslationsTranslationItem;
    }
  }
}
