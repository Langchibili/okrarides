export type ResourceDefinition = {
  uid: string;
  category: string;
  single?: boolean;
  fields: string[];
  filters: string[];
  populate: Record<string, unknown>;
};

export const resources: Record<string, ResourceDefinition> = {
  users: {
    uid: 'plugin::users-permissions.user',
    category: 'users',
    fields: ['id', 'documentId', 'username', 'email', 'phoneNumber', 'firstName', 'lastName', 'blocked', 'confirmed', 'phoneVerified', 'adminType', 'activeProfile', 'createdAt', 'updatedAt', 'address'],
    filters: ['id', 'firstName', 'lastName', 'phoneNumber', 'username', 'blocked', 'confirmed', 'createdAt', 'country', 'driverProfile', 'deliveryProfile', 'riderProfile', 'affiliateProfile', 'partnerProfile'],
    populate: {
      country: { fields: ['id', 'name', 'code'] },
      partner: { fields: ['id', 'firstName', 'lastName', 'username'], populate: { partnerProfile: { fields: ['businessName'] } } },
      driverProfile: { populate: { assignedVehicle: true, currentSubscription: { populate: { subscriptionPlan: true } }, subscriptionHistory: { populate: { subscriptionPlan: true } }, vehicles: true } },
      deliveryProfile: { populate: { taxi: { populate: { vehicle: { fields: ['id', 'numberPlate', 'make', 'model'] } } }, motorbike: { populate: { vehicle: { fields: ['id', 'numberPlate', 'make', 'model'] } } }, motorcycle: { populate: { vehicle: { fields: ['id', 'numberPlate', 'make', 'model'] } } }, truck: { populate: { vehicle: { fields: ['id', 'numberPlate', 'make', 'model'] } } } } },
      riderProfile: true,
      affiliateProfile: { populate: { qrCode: true } },
      partnerProfile: true,
    },
  },
  countries: {
    uid: 'api::country.country',
    category: 'countries',
    fields: ['id', 'documentId', 'name', 'code', 'phoneCode', 'isActive', 'phoneNumberDigitLenth', 'phoneNumberRegex', 'currency', 'defaultCurrency', 'paymentSystemType', 'platformName', 'supportEmail', 'supportPhone', 'requireDriverLicense', 'requireNationalId', 'requireProofOfAddress', 'requireInsurance', 'requireRoadTax', 'requireFitnessDocument', 'requireVehicleRegistration', 'autoApproveDrivers', 'autoApproveDeliverers', 'initialDriverFloat', 'initialDelivererFloat', 'cashEnabled', 'okrapayEnabled', 'smsEnabled', 'emailEnabled', 'pushNotificationsEnabled', 'whatsappEnabled', 'createdAt', 'updatedAt'],
    filters: ['id', 'name', 'code', 'isActive'],
    populate: { currency: true, defaultCurrency: true },
  },
  currencies: {
    uid: 'api::currency.currency',
    category: 'currencies',
    fields: ['id', 'documentId', 'name', 'code', 'symbol', 'exchangeRate', 'isActive', 'createdAt', 'updatedAt'],
    filters: ['id', 'name', 'code', 'isActive'],
    populate: {},
  },
  rides: {
    uid: 'api::ride.ride',
    category: 'rides',
    fields: ['id', 'documentId', 'rideCode', 'rideStatus', 'rideType', 'createdAt', 'updatedAt', 'pickupLocation', 'dropoffLocation', 'totalFare', 'paymentMethod', 'paymentStatus', 'rider', 'driver', 'vehicle', 'rideClass', 'taxiType', 'promoCode', 'driverEarnings', 'notes'],
    filters: ['id', 'rideCode', 'rideStatus', 'rideType', 'createdAt'],
    populate: { rider: { fields: ['id', 'firstName', 'lastName', 'phoneNumber', 'username'] }, driver: { fields: ['id', 'firstName', 'lastName', 'phoneNumber', 'username'] }, vehicle: true, rideClass: true, taxiType: true, promoCode: true },
  },
  deliveries: {
    uid: 'api::delivery.delivery',
    category: 'deliveries',
    fields: ['id', 'documentId', 'rideCode', 'rideStatus', 'rideType', 'createdAt', 'updatedAt', 'pickupLocation', 'dropoffLocation', 'totalFare', 'paymentMethod', 'paymentStatus', 'sender', 'deliverer', 'vehicle', 'rideClass', 'taxiType', 'notes'],
    filters: ['id', 'rideCode', 'rideStatus', 'rideType', 'createdAt'],
    populate: { sender: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] }, deliverer: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] }, vehicle: true, rideClass: true, taxiType: true },
  },
  vehicles: {
    uid: 'api::vehicle.vehicle',
    category: 'vehicles',
    fields: ['id', 'documentId', 'vehicleType', 'numberPlate', 'make', 'model', 'year', 'color', 'seatingCapacity', 'verificationStatus', 'isActive', 'insuranceExpiryDate', 'roadTaxExpiryDate', 'fitnessExpiryDate', 'owner', 'assignedDriver', 'taxiType', 'rideClasses', 'deliveryClasses', 'createdAt', 'updatedAt'],
    filters: ['id', 'vehicleType', 'numberPlate', 'make', 'model', 'verificationStatus', 'isActive'],
    populate: { owner: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] }, assignedDriver: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] }, taxiType: true, rideClasses: true, deliveryClasses: true },
  },
  transactions: {
    uid: 'api::transaction.transaction',
    category: 'finance',
    fields: ['id', 'documentId', 'transactionId', 'type', 'transactionStatus', 'amount', 'currency', 'paymentMethod', 'gatewayReference', 'notes', 'processedAt', 'createdAt', 'updatedAt', 'user', 'ride', 'subscription'],
    filters: ['id', 'transactionId', 'type', 'transactionStatus', 'createdAt', 'gatewayReference'],
    populate: {
      currency: true,
      user: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'], populate: { country: { populate: { currency: true } } } },
      ride: true,
      subscription: true,
    },
  },
  affiliates: {
    uid: 'plugin::users-permissions.user',
    category: 'affiliates',
    fields: ['id', 'documentId', 'username', 'email', 'phoneNumber', 'firstName', 'lastName', 'blocked', 'createdAt', 'updatedAt'],
    filters: ['id', 'firstName', 'lastName', 'phoneNumber', 'username', 'blocked', 'affiliateProfile'],
    populate: { affiliateProfile: { populate: { qrCode: true } }, country: { fields: ['id', 'name', 'code'] } },
  },
  'admn-setting': {
    uid: 'api::admn-setting.admn-setting',
    category: 'settings',
    single: true,
    fields: [],
    filters: [],
    populate: { defaultCurrency: true, driverOrderRequestRingtone: true },
  },
  'geofence-zones': {
    uid: 'api::geofence-zone.geofence-zone',
    category: 'countries',
    fields: ['id', 'documentId', 'name', 'isActive', 'country', 'coordinates', 'surgeMultiplier', 'createdAt', 'updatedAt'],
    filters: ['id', 'name', 'isActive', 'country'],
    populate: { country: { fields: ['id', 'name', 'code'] } },
  },
  'subscription-plans': {
    uid: 'api::subscription-plan.subscription-plan',
    category: 'subscriptions',
    fields: ['id', 'documentId', 'planId', 'name', 'description', 'price', 'durationType', 'durationValue', 'features', 'maxRidesPerDay', 'maxRidesPerPeriod', 'hasFreeTrial', 'freeTrialDays', 'isActive', 'isPopular', 'displayOrder', 'currency', 'createdAt', 'updatedAt'],
    filters: ['id', 'name', 'isActive'],
    populate: { currency: true },
  },
  'affiliate-points-conversions': {
    uid: 'api::affiliate-points-conversion.affiliate-points-conversion',
    category: 'affiliates',
    fields: ['id', 'documentId', 'affiliatePoints', 'currencyAmount', 'currency', 'country', 'createdAt', 'updatedAt'],
    filters: ['id', 'country'],
    populate: { currency: true, country: { fields: ['id', 'name', 'code'] } },
  },
  'affiliate-points-allocation-rules': {
    uid: 'api::affiliate-points-allocation-rule.affiliate-points-allocation-rule',
    category: 'affiliates',
    fields: ['id', 'documentId', 'name', 'type', 'appliesTo', 'actionAmountsPerUser', 'pointsAllocatedFromAction', 'active', 'isRuleVolumeType', 'volume', 'countries', 'affiliatePromotions', 'createdAt', 'updatedAt'],
    filters: ['id', 'name', 'type', 'active'],
    populate: { countries: { fields: ['id', 'name', 'code'] } },
  },
  'affiliate-promotions': {
    uid: 'api::affiliate-promotion.affiliate-promotion',
    category: 'affiliates',
    fields: ['id', 'documentId', 'name', 'description', 'action', 'for', 'amountType', 'amount', 'percentageAmount', 'usageLimit', 'isActive', 'isDefault', 'expiresAt', 'countries', 'referralPointsAllocationRules', 'createdAt', 'updatedAt'],
    filters: ['id', 'name', 'action', 'isActive', 'isDefault'],
    populate: { countries: { fields: ['id', 'name', 'code'] }, referralPointsAllocationRules: true },
  },
  'affiliate-coupons': { uid: 'api::affiliate-coupon.affiliate-coupon', category: 'affiliates', fields: [], filters: [], populate: { affiliateOwner: { fields: ['id', 'firstName', 'lastName'] }, promotion: { fields: ['id', 'name'] } } },
  'ride-classes': {
    uid: 'api::ride-class.ride-class',
    category: 'rides',
    fields: [],
    filters: [],
    populate: { taxiType: true, icon: true, countries: { populate: { country: true } } },
  },
  'bus-routes': { uid: 'api::bus-route.bus-route', category: 'rides', fields: [], filters: [], populate: {} },
  'bus-stations': { uid: 'api::bus-station.bus-station', category: 'rides', fields: [], filters: [], populate: {} },
  'taxi-types': { uid: 'api::taxi-type.taxi-type', category: 'rides', fields: [], filters: [], populate: {} },
  'delivery-classes': { uid: 'api::delivery-class.delivery-class', category: 'deliveries', fields: [], filters: [], populate: {} },
  'commission-tiers': { uid: 'api::commission-tier.commission-tier', category: 'finance', fields: [], filters: [], populate: {} },
  'cancellation-reasons': { uid: 'api::cancellation-reason.cancellation-reason', category: 'rides', fields: [], filters: [], populate: {} },
  'surge-pricings': { uid: 'api::surge-pricing.surge-pricing', category: 'rides', fields: [], filters: [], populate: {} },
  translations: { uid: 'api::translation.translation', category: 'settings', fields: [], filters: [], populate: {} },
  'promo-codes': { uid: 'api::promo-code.promo-code', category: 'finance', fields: [], filters: [], populate: {} },
  'driver-subscriptions': {
    uid: 'api::driver-subscription.driver-subscription',
    category: 'subscriptions',
    fields: [],
    filters: [],
    populate: {
      driver: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
      subscriptionPlan: { fields: ['id', 'name', 'price', 'durationType'] },
    },
  },
  'float-topups': {
    uid: 'api::float-topup.float-topup',
    category: 'finance',
    fields: [],
    filters: [],
    populate: {
      driver: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'], populate: { country: { populate: { currency: true } } } },
      currency: true,
      processedBy: { fields: ['id', 'firstName', 'lastName'] },
    },
  },
  withdrawals: { uid: 'api::withdrawal.withdrawal', category: 'finance', fields: [], filters: [], populate: {} },
  'ledger-entries': {
    uid: 'api::ledger-entry.ledger-entry',
    category: 'finance',
    fields: [],
    filters: [],
    populate: {
      driver: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'], populate: { country: { populate: { currency: true } } } },
      ride: { fields: ['id', 'rideCode'] },
    },
  },
  packages: { uid: 'api::package.package', category: 'deliveries', fields: [], filters: [], populate: {} },
  'support-tickets': {
    uid: 'api::support-ticket.support-ticket',
    category: 'support',
    fields: [],
    filters: [],
    populate: {
      user: { fields: ['id', 'firstName', 'lastName', 'phoneNumber', 'username'] },
      assignedTo: { fields: ['id', 'firstName', 'lastName', 'email'] },
      ride: { fields: ['id', 'rideCode'] },
      subscription: { fields: ['id', 'subscriptionId'] },
      attachments: true,
      responses: { populate: { respondedBy: { fields: ['id', 'firstName', 'lastName'] } } },
    },
  },
  ratings: { uid: 'api::rating.rating', category: 'rides', fields: [], filters: [], populate: {} },
  okrapays: { uid: 'api::okrapay.okrapay', category: 'finance', fields: [], filters: [], populate: {} },
  'payment-methods': { uid: 'api::payment-method.payment-method', category: 'finance', fields: [], filters: [], populate: {} },
  'affiliate-points-types': { uid: 'api::affiliate-points-type.affiliate-points-type', category: 'affiliates', fields: [], filters: [], populate: {} },
  'affiliate-transactions': {
    uid: 'api::affiliate-transaction.affiliate-transaction',
    category: 'affiliates',
    fields: [],
    filters: [],
    populate: {
      affiliate: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'], populate: { country: { populate: { currency: true } } } },
      referredUser: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
      ride: { fields: ['id', 'rideCode'] },
      delivery: { fields: ['id', 'rideCode'] },
      rule: { fields: ['id', 'name', 'type'] },
    },
  },
  'audit-logs': { uid: 'api::audit-log.audit-log', category: 'users', fields: [], filters: [], populate: {} },
  'admin-notifications': { uid: 'api::notification.notification', category: 'settings', fields: [], filters: [], populate: {} },
};

export const permissionCategories = [
  'me', 'admin-users', 'dashboard', 'users', 'partners', 'drivers', 'riders', 'rides', 'deliveries',
  'vehicles', 'countries', 'currencies', 'finance', 'affiliates', 'settings',
  'subscriptions', 'support',
] as const;

export const permissionActions = permissionCategories.flatMap((category) => [
  {
    section: 'plugins',
    displayName: `View ${category}`,
    uid: `${category}.view`,
    subCategory: category,
    pluginName: 'admn',
  },
  {
    section: 'plugins',
    displayName: `Manage ${category}`,
    uid: `${category}.manage`,
    subCategory: category,
    pluginName: 'admn',
  },
]);
