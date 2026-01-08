import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAdmnSettingAdmnSetting extends Struct.SingleTypeSchema {
  collectionName: 'admn_settings';
  info: {
    displayName: 'Admin Settings';
    name: 'admn-setting';
    pluralName: 'admn-settings';
    singularName: 'admn-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    affiliateSystemEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    allowManualCompletion: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    allowMultipleTrials: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    allowNegativeFloat: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    autoRenewByDefault: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    blockCashRidesOnInsufficientFloat: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    cashEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    commissionTiers: Schema.Attribute.JSON;
    commissionType: Schema.Attribute.Enumeration<
      ['percentage', 'flat_rate', 'tiered']
    > &
      Schema.Attribute.DefaultTo<'percentage'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    defaultCommissionPercentage: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<15>;
    defaultCurrency: Schema.Attribute.Relation<
      'oneToOne',
      'api::currency.currency'
    >;
    defaultFlatCommission: Schema.Attribute.Decimal;
    defaultFreeTrialDays: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<7>;
    driverCancellationCooldownMinutes: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<15>;
    driverOrderRequestRingtone: Schema.Attribute.Media<'audios'>;
    driverOrderRequestVibration: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    emailEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    floatSystemEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    freeTrialEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::admn-setting.admn-setting'
    > &
      Schema.Attribute.Private;
    maximumCommission: Schema.Attribute.Decimal;
    maximumFloatTopup: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<1000>;
    maxSimultaneousDriverRequests: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<1>;
    minimumCommission: Schema.Attribute.Decimal;
    minimumFloatTopup: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<10>;
    minimumPointsForRedemption: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<100>;
    moneyPerPoint: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0.1>;
    negativeFloatLimit: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    okrapayEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    paymentSystemType: Schema.Attribute.Enumeration<
      ['float_based', 'subscription_based', 'hybrid']
    > &
      Schema.Attribute.DefaultTo<'float_based'>;
    platformName: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Okra Rides'>;
    pointsPerDriverReferral: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<50>;
    pointsPerRiderFirstRide: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<20>;
    pointsPerRiderReferral: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<10>;
    publishedAt: Schema.Attribute.DateTime;
    pushNotificationsEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    referralBonusEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireArrivalConfirmation: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireDriverLicense: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireFitnessDocument: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireInsurance: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireNationalId: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireProofOfAddress: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireRoadTax: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    requireVehicleRegistration: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    rideCompletionProximity: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<100>;
    rideRequestTimeoutSeconds: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<30>;
    smsEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    subscriptionGracePeriodDays: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<3>;
    subscriptionSystemEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    supportEmail: Schema.Attribute.Email;
    supportPhone: Schema.Attribute.String;
    targetRidesForUnlock: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<1000>;
    tieredCommissionEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    whatsappEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
  };
}

export interface ApiAdmnUserPermissionAdmnUserPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'admn_user_permissions';
  info: {
    displayName: 'Admin User Permission';
    name: 'admnUserPermission';
    pluralName: 'admn-user-permissions';
    singularName: 'admn-user-permission';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'users',
        'drivers',
        'riders',
        'rides',
        'vehicles',
        'subscriptions',
        'finance',
        'settings',
        'reports',
        'support',
      ]
    > &
      Schema.Attribute.Required;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::admn-user-permission.admn-user-permission'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAffiliateTransactionAffiliateTransaction
  extends Struct.CollectionTypeSchema {
  collectionName: 'affiliate_transactions';
  info: {
    displayName: 'Affiliate Transaction';
    name: 'affiliateTransaction';
    pluralName: 'affiliate-transactions';
    singularName: 'affiliate-transaction';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    affiliate: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    affiliate_transaction_status: Schema.Attribute.Enumeration<
      ['pending', 'completed', 'failed', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    amount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::affiliate-transaction.affiliate-transaction'
    > &
      Schema.Attribute.Private;
    points: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    processedAt: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    referredUser: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    ride: Schema.Attribute.Relation<'manyToOne', 'api::ride.ride'>;
    transactionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    type: Schema.Attribute.Enumeration<
      [
        'referral_signup',
        'referral_first_ride_as_rider',
        'referral_first_ride_as_driver',
        'points_redemption',
        'bonus',
        'adjustment',
      ]
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAffiliateAffiliate extends Struct.CollectionTypeSchema {
  collectionName: 'affiliates';
  info: {
    displayName: 'Affiliate';
    pluralName: 'affiliates';
    singularName: 'affiliate';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    aboutRoute: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::affiliate.affiliate'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAllowedVehicleYearAllowedVehicleYear
  extends Struct.SingleTypeSchema {
  collectionName: 'allowed_vehicle_years';
  info: {
    displayName: 'allowedVehicleYears';
    pluralName: 'allowed-vehicle-years';
    singularName: 'allowed-vehicle-year';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::allowed-vehicle-year.allowed-vehicle-year'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    years: Schema.Attribute.JSON;
  };
}

export interface ApiAnalyticsSnapshotAnalyticsSnapshot
  extends Struct.CollectionTypeSchema {
  collectionName: 'analytics_snapshots';
  info: {
    displayName: 'Analytics Snapshot';
    name: 'analyticsSnapshot';
    pluralName: 'analytics-snapshots';
    singularName: 'analytics-snapshot';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    activeDrivers: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    activeRiders: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    activeSubscriptions: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    averageRating: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    averageRideValue: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    cancelledRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    completedRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::analytics-snapshot.analytics-snapshot'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    newSignups: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    peakHours: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    publishedAt: Schema.Attribute.DateTime;
    snapshotDate: Schema.Attribute.Date &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    snapshotType: Schema.Attribute.Enumeration<
      ['daily', 'weekly', 'monthly', 'yearly']
    > &
      Schema.Attribute.Required;
    subscriptionRevenue: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    topRoutes: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    totalCommission: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalRevenue: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalRides: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    trialSubscriptions: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAppVersionAppVersion extends Struct.CollectionTypeSchema {
  collectionName: 'app_versions';
  info: {
    displayName: 'App Version';
    name: 'appVersion';
    pluralName: 'app-versions';
    singularName: 'app-version';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    appType: Schema.Attribute.Enumeration<
      ['rider', 'driver', 'conductor', 'delivery', 'admin']
    > &
      Schema.Attribute.Required;
    changelog: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    downloadUrl: Schema.Attribute.String;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isForceUpdate: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::app-version.app-version'
    > &
      Schema.Attribute.Private;
    minimumSupportedVersion: Schema.Attribute.String;
    platform: Schema.Attribute.Enumeration<['android', 'ios', 'web']> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releaseDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    releaseNotes: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    versionCode: Schema.Attribute.Integer & Schema.Attribute.Required;
    versionNumber: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiAuditLogAuditLog extends Struct.CollectionTypeSchema {
  collectionName: 'audit_logs';
  info: {
    displayName: 'Audit Log';
    name: 'auditLog';
    pluralName: 'audit-logs';
    singularName: 'audit-log';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    actor: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    actorType: Schema.Attribute.Enumeration<['user', 'admin', 'system']> &
      Schema.Attribute.DefaultTo<'user'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ipAddress: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::audit-log.audit-log'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    severity: Schema.Attribute.Enumeration<
      ['low', 'medium', 'high', 'critical']
    > &
      Schema.Attribute.DefaultTo<'low'>;
    targetEntity: Schema.Attribute.String;
    targetId: Schema.Attribute.String;
    timestamp: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userAgent: Schema.Attribute.Text;
  };
}

export interface ApiBusRouteBusRoute extends Struct.CollectionTypeSchema {
  collectionName: 'bus_routes';
  info: {
    displayName: 'Bus Route';
    name: 'busRoute';
    pluralName: 'bus-routes';
    singularName: 'bus-route';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    baseFare: Schema.Attribute.Decimal & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    endStation: Schema.Attribute.Relation<
      'manyToOne',
      'api::bus-station.bus-station'
    > &
      Schema.Attribute.Required;
    estimatedDuration: Schema.Attribute.Integer;
    intermediateStations: Schema.Attribute.Relation<
      'manyToMany',
      'api::bus-station.bus-station'
    >;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isIntercity: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::bus-route.bus-route'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    routeCode: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    routePolyline: Schema.Attribute.Text;
    startStation: Schema.Attribute.Relation<
      'manyToOne',
      'api::bus-station.bus-station'
    > &
      Schema.Attribute.Required;
    totalDistance: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBusStationBusStation extends Struct.CollectionTypeSchema {
  collectionName: 'bus_stations';
  info: {
    displayName: 'Bus Station';
    name: 'busStation';
    pluralName: 'bus-stations';
    singularName: 'bus-station';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    address: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    geofenceZone: Schema.Attribute.Relation<
      'manyToOne',
      'api::geofence-zone.geofence-zone'
    >;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::bus-station.bus-station'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.JSON & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    stationCode: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCancellationReasonCancellationReason
  extends Struct.CollectionTypeSchema {
  collectionName: 'cancellation_reasons';
  info: {
    displayName: 'Cancellation Reason';
    name: 'cancellationReason';
    pluralName: 'cancellation-reasons';
    singularName: 'cancellation-reason';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    applicableFor: Schema.Attribute.Enumeration<['rider', 'driver', 'both']> &
      Schema.Attribute.Required;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    feeAmount: Schema.Attribute.Decimal;
    feePercentage: Schema.Attribute.Decimal;
    hasFee: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cancellation-reason.cancellation-reason'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    reason: Schema.Attribute.String & Schema.Attribute.Required;
    requiresExplanation: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCommissionTierCommissionTier
  extends Struct.CollectionTypeSchema {
  collectionName: 'commission_tiers';
  info: {
    displayName: 'Commission Tier';
    name: 'commissionTier';
    pluralName: 'commission-tiers';
    singularName: 'commission-tier';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    commissionFlat: Schema.Attribute.Decimal;
    commissionPercentage: Schema.Attribute.Decimal & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::commission-tier.commission-tier'
    > &
      Schema.Attribute.Private;
    maxFare: Schema.Attribute.Decimal;
    minFare: Schema.Attribute.Decimal & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    rideClass: Schema.Attribute.Relation<
      'manyToOne',
      'api::ride-class.ride-class'
    >;
    taxiType: Schema.Attribute.Relation<
      'manyToOne',
      'api::taxi-type.taxi-type'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCountryCountry extends Struct.CollectionTypeSchema {
  collectionName: 'countries';
  info: {
    displayName: 'Country';
    name: 'country';
    pluralName: 'countries';
    singularName: 'country';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 2;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.Relation<'manyToOne', 'api::currency.currency'>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::country.country'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    phoneCode: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCurrencyCurrency extends Struct.CollectionTypeSchema {
  collectionName: 'currencies';
  info: {
    displayName: 'Currency';
    name: 'currency';
    pluralName: 'currencies';
    singularName: 'currency';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 3;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    exchangeRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::currency.currency'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    symbol: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDeviceTrackingDeviceTracking
  extends Struct.CollectionTypeSchema {
  collectionName: 'device_trackings';
  info: {
    displayName: 'Device Tracking';
    name: 'deviceTracking';
    pluralName: 'device-trackings';
    singularName: 'device-tracking';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    assignedDate: Schema.Attribute.Date & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceIMEI: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    deviceManufacturer: Schema.Attribute.String;
    deviceModel: Schema.Attribute.String;
    driver: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastSeen: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::device-tracking.device-tracking'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    purchaseDate: Schema.Attribute.Date;
    purchasePrice: Schema.Attribute.Decimal;
    ridesCompleted: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    suspendedAt: Schema.Attribute.DateTime;
    suspensionReason: Schema.Attribute.Text;
    targetRides: Schema.Attribute.Integer & Schema.Attribute.Required;
    unlockedAt: Schema.Attribute.DateTime;
    unlockStatus: Schema.Attribute.Enumeration<
      ['locked', 'unlocked', 'suspended']
    > &
      Schema.Attribute.DefaultTo<'locked'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDocDoc extends Struct.CollectionTypeSchema {
  collectionName: 'docs';
  info: {
    displayName: 'doc';
    pluralName: 'docs';
    singularName: 'doc';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    aboutRoute: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::doc.doc'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDriverSubscriptionDriverSubscription
  extends Struct.CollectionTypeSchema {
  collectionName: 'driver_subscriptions';
  info: {
    displayName: 'Driver Subscription';
    name: 'driverSubscription';
    pluralName: 'driver-subscriptions';
    singularName: 'driver-subscription';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    autoRenew: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    cancelledAt: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    driver: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    expiresAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    isFreeTrial: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lastPaymentAmount: Schema.Attribute.Decimal;
    lastPaymentDate: Schema.Attribute.DateTime;
    lastPaymentTransactionId: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::driver-subscription.driver-subscription'
    > &
      Schema.Attribute.Private;
    nextPaymentDue: Schema.Attribute.DateTime;
    previousSubscriptions: Schema.Attribute.Relation<
      'manyToMany',
      'api::driver-subscription.driver-subscription'
    >;
    publishedAt: Schema.Attribute.DateTime;
    renewalCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    ridesThisPeriod: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    ridesToday: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    startedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['trial', 'active', 'expired', 'cancelled', 'suspended']
    > &
      Schema.Attribute.Required;
    subscriptionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    subscriptionPlan: Schema.Attribute.Relation<
      'manyToOne',
      'api::subscription-plan.subscription-plan'
    > &
      Schema.Attribute.Required;
    suspendedAt: Schema.Attribute.DateTime;
    trialEndsAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDriverDriver extends Struct.CollectionTypeSchema {
  collectionName: 'drivers';
  info: {
    displayName: 'driver';
    pluralName: 'drivers';
    singularName: 'driver';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    aboutRoute: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::driver.driver'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEmailAddressesListEmailAddressesList
  extends Struct.SingleTypeSchema {
  collectionName: 'email_addresses_lists';
  info: {
    displayName: 'emailAddressesList';
    pluralName: 'email-addresses-lists';
    singularName: 'email-addresses-list';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    adminEmailAddresses: Schema.Attribute.JSON;
    clientEmailAddresses: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-addresses-list.email-addresses-list'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEmailLogEmailLog extends Struct.CollectionTypeSchema {
  collectionName: 'email_logs';
  info: {
    displayName: 'Email Log';
    name: 'emailLog';
    pluralName: 'email-logs';
    singularName: 'email-log';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    attachments: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deliveredAt: Schema.Attribute.DateTime;
    emailAddress: Schema.Attribute.Email & Schema.Attribute.Required;
    failureReason: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-log.email-log'
    > &
      Schema.Attribute.Private;
    messageId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    openedAt: Schema.Attribute.DateTime;
    provider: Schema.Attribute.String;
    providerMessageId: Schema.Attribute.String;
    providerResponse: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    recipient: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    sentAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    subject: Schema.Attribute.String & Schema.Attribute.Required;
    template: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEmergencyContactEmergencyContact
  extends Struct.CollectionTypeSchema {
  collectionName: 'emergency_contacts';
  info: {
    displayName: 'Emergency Contact';
    name: 'emergencyContact';
    pluralName: 'emergency-contacts';
    singularName: 'emergency-contact';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isPrimary: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::emergency-contact.emergency-contact'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    phoneNumber: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    relationship: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiFavoriteLocationFavoriteLocation
  extends Struct.CollectionTypeSchema {
  collectionName: 'favorite_locations';
  info: {
    displayName: 'Favorite Location';
    name: 'favoriteLocation';
    pluralName: 'favorite-locations';
    singularName: 'favorite-location';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    address: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    icon: Schema.Attribute.Enumeration<
      ['home', 'work', 'school', 'gym', 'other']
    > &
      Schema.Attribute.DefaultTo<'other'>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::favorite-location.favorite-location'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.JSON & Schema.Attribute.Required;
    placeId: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiFinanceFinance extends Struct.CollectionTypeSchema {
  collectionName: 'finances';
  info: {
    displayName: 'finance';
    pluralName: 'finances';
    singularName: 'finance';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    aboutRoute: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::finance.finance'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiFloatTopupFloatTopup extends Struct.CollectionTypeSchema {
  collectionName: 'float_topups';
  info: {
    displayName: 'Float Topup';
    name: 'floatTopup';
    pluralName: 'float-topups';
    singularName: 'float-topup';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    completedAt: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.Relation<'manyToOne', 'api::currency.currency'>;
    driver: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    floatBalanceAfter: Schema.Attribute.Decimal;
    floatBalanceBefore: Schema.Attribute.Decimal;
    gatewayReference: Schema.Attribute.String;
    gatewayResponse: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::float-topup.float-topup'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    paymentMethod: Schema.Attribute.Enumeration<
      ['okrapay', 'mobile_money', 'bank_transfer', 'cash']
    > &
      Schema.Attribute.Required;
    processedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    requestedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      ['pending', 'completed', 'failed', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    topupId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGeofenceZoneGeofenceZone
  extends Struct.CollectionTypeSchema {
  collectionName: 'geofence_zones';
  info: {
    displayName: 'Geofence Zone';
    name: 'geofenceZone';
    pluralName: 'geofence-zones';
    singularName: 'geofence-zone';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    coordinates: Schema.Attribute.JSON & Schema.Attribute.Required;
    country: Schema.Attribute.Relation<'manyToOne', 'api::country.country'> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::geofence-zone.geofence-zone'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    surgeMultiplier: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLanguageLanguage extends Struct.CollectionTypeSchema {
  collectionName: 'languages';
  info: {
    displayName: 'Language';
    name: 'language';
    pluralName: 'languages';
    singularName: 'language';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 5;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isDefault: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isRTL: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::language.language'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLedgerEntryLedgerEntry extends Struct.CollectionTypeSchema {
  collectionName: 'ledger_entries';
  info: {
    displayName: 'Ledger Entry';
    name: 'ledgerEntry';
    pluralName: 'ledger-entries';
    singularName: 'ledger-entry';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    balanceAfter: Schema.Attribute.Decimal;
    balanceBefore: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    driver: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    entryId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ledger-entry.ledger-entry'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    ride: Schema.Attribute.Relation<'manyToOne', 'api::ride.ride'>;
    source: Schema.Attribute.Enumeration<
      ['cash', 'okrapay', 'mobile_money', 'bank_transfer', 'system']
    > &
      Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      ['pending', 'settled', 'failed', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    type: Schema.Attribute.Enumeration<
      [
        'fare',
        'commission',
        'payout',
        'float_topup',
        'float_deduction',
        'withdrawal',
        'adjustment',
        'refund',
      ]
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNotificationNotification
  extends Struct.CollectionTypeSchema {
  collectionName: 'notifications';
  info: {
    displayName: 'Notification';
    name: 'notification';
    pluralName: 'notifications';
    singularName: 'notification';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    channel: Schema.Attribute.Enumeration<['push', 'sms', 'email', 'in_app']> &
      Schema.Attribute.DefaultTo<'in_app'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    data: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::notification.notification'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    read: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    readAt: Schema.Attribute.DateTime;
    ride: Schema.Attribute.Relation<'manyToOne', 'api::ride.ride'>;
    sent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    sentAt: Schema.Attribute.DateTime;
    subscription: Schema.Attribute.Relation<
      'manyToOne',
      'api::driver-subscription.driver-subscription'
    >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      [
        'ride_request',
        'ride_accepted',
        'ride_started',
        'ride_completed',
        'ride_cancelled',
        'payment_received',
        'subscription_expiring',
        'subscription_expired',
        'subscription_renewed',
        'promo_code',
        'system_announcement',
        'account_update',
      ]
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiOtpVerificationOtpVerification
  extends Struct.CollectionTypeSchema {
  collectionName: 'otp_verifications';
  info: {
    displayName: 'OTP Verification';
    name: 'otpVerification';
    pluralName: 'otp-verifications';
    singularName: 'otp-verification';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    attempts: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Unique;
    expiresAt: Schema.Attribute.DateTime;
    ipAddress: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::otp-verification.otp-verification'
    > &
      Schema.Attribute.Private;
    maxAttempts: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    otp: Schema.Attribute.String & Schema.Attribute.Private;
    phoneNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    purpose: Schema.Attribute.Enumeration<
      ['registration', 'phone_verification', 'password_reset', 'login']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    verifiedAt: Schema.Attribute.DateTime;
  };
}

export interface ApiPackagePackage extends Struct.CollectionTypeSchema {
  collectionName: 'packages';
  info: {
    displayName: 'Package';
    name: 'package';
    pluralName: 'packages';
    singularName: 'package';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deliveredAt: Schema.Attribute.DateTime;
    deliveryFee: Schema.Attribute.Decimal & Schema.Attribute.Required;
    deliveryVerificationCode: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    dimensions: Schema.Attribute.JSON;
    fragile: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::package.package'
    > &
      Schema.Attribute.Private;
    packageCode: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    packagePhotos: Schema.Attribute.Media<'images', true>;
    packageType: Schema.Attribute.Enumeration<
      ['document', 'parcel', 'food', 'groceries', 'other']
    > &
      Schema.Attribute.Required;
    pickedUpAt: Schema.Attribute.DateTime;
    pickupVerificationCode: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    recipient: Schema.Attribute.Component<'packages.recipient-details', false> &
      Schema.Attribute.Required;
    recipientSignature: Schema.Attribute.Media<'images'>;
    sender: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    specialInstructions: Schema.Attribute.Text;
    status: Schema.Attribute.Enumeration<
      ['pending_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'pending_pickup'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    weight: Schema.Attribute.Decimal;
  };
}

export interface ApiPaymentMethodPaymentMethod
  extends Struct.CollectionTypeSchema {
  collectionName: 'payment_methods';
  info: {
    displayName: 'Payment Method';
    name: 'paymentMethod';
    pluralName: 'payment-methods';
    singularName: 'payment-method';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    accountName: Schema.Attribute.String;
    accountNumber: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isDefault: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isVerified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::payment-method.payment-method'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<
      ['okrapay', 'mobile_money', 'bank_card']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiPhoneNumbersListPhoneNumbersList
  extends Struct.SingleTypeSchema {
  collectionName: 'phone_numbers_lists';
  info: {
    displayName: 'phoneNumbersList';
    pluralName: 'phone-numbers-lists';
    singularName: 'phone-numbers-list';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    adminNumbers: Schema.Attribute.JSON;
    clientNumbers: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::phone-numbers-list.phone-numbers-list'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPromoCodePromoCode extends Struct.CollectionTypeSchema {
  collectionName: 'promo_codes';
  info: {
    displayName: 'Promo Code';
    name: 'promoCode';
    pluralName: 'promo-codes';
    singularName: 'promo-code';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    applicableFor: Schema.Attribute.Enumeration<
      ['all_users', 'new_users', 'specific_users']
    > &
      Schema.Attribute.DefaultTo<'all_users'>;
    applicableRideTypes: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<['taxi', 'bus', 'delivery']>;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currentUsageCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    description: Schema.Attribute.Text;
    discountType: Schema.Attribute.Enumeration<['percentage', 'fixed_amount']> &
      Schema.Attribute.Required;
    discountValue: Schema.Attribute.Decimal & Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::promo-code.promo-code'
    > &
      Schema.Attribute.Private;
    maxDiscountAmount: Schema.Attribute.Decimal;
    maxUsageCount: Schema.Attribute.Integer;
    maxUsagePerUser: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    minimumOrderValue: Schema.Attribute.Decimal;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    specificUsers: Schema.Attribute.Relation<
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    validFrom: Schema.Attribute.DateTime & Schema.Attribute.Required;
    validUntil: Schema.Attribute.DateTime & Schema.Attribute.Required;
  };
}

export interface ApiPushNotificationLogPushNotificationLog
  extends Struct.CollectionTypeSchema {
  collectionName: 'push_notification_logs';
  info: {
    displayName: 'Push Notification Log';
    name: 'pushNotificationLog';
    pluralName: 'push-notification-logs';
    singularName: 'push-notification-log';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    data: Schema.Attribute.JSON;
    deliveredAt: Schema.Attribute.DateTime;
    deviceToken: Schema.Attribute.String & Schema.Attribute.Required;
    failureReason: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::push-notification-log.push-notification-log'
    > &
      Schema.Attribute.Private;
    notificationId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    openedAt: Schema.Attribute.DateTime;
    platform: Schema.Attribute.Enumeration<['android', 'ios', 'web']> &
      Schema.Attribute.Required;
    provider: Schema.Attribute.String & Schema.Attribute.DefaultTo<'fcm'>;
    providerMessageId: Schema.Attribute.String;
    providerResponse: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    recipient: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    sentAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['pending', 'sent', 'delivered', 'opened', 'failed']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiRatingRating extends Struct.CollectionTypeSchema {
  collectionName: 'ratings';
  info: {
    displayName: 'Rating';
    name: 'rating';
    pluralName: 'ratings';
    singularName: 'rating';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::rating.rating'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    ratedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    ratedUser: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    review: Schema.Attribute.Text;
    ride: Schema.Attribute.Relation<'manyToOne', 'api::ride.ride'> &
      Schema.Attribute.Required;
    tags: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiResendotpResendotp extends Struct.CollectionTypeSchema {
  collectionName: 'resendotps';
  info: {
    displayName: 'resendotp';
    pluralName: 'resendotps';
    singularName: 'resendotp';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    identifier: Schema.Attribute.String;
    identifierType: Schema.Attribute.Enumeration<['phoneNumber', 'email']>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::resendotp.resendotp'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiRideClassRideClass extends Struct.CollectionTypeSchema {
  collectionName: 'ride_classes';
  info: {
    displayName: 'Ride Class';
    name: 'rideClass';
    pluralName: 'ride-classes';
    singularName: 'ride-class';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    baseFare: Schema.Attribute.Decimal & Schema.Attribute.Required;
    commissionPercentage: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    icon: Schema.Attribute.Media<'images'>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ride-class.ride-class'
    > &
      Schema.Attribute.Private;
    minimumFare: Schema.Attribute.Decimal & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    perKmRate: Schema.Attribute.Decimal & Schema.Attribute.Required;
    perMinuteRate: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    taxiType: Schema.Attribute.Relation<
      'manyToOne',
      'api::taxi-type.taxi-type'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    vehicles: Schema.Attribute.Relation<'manyToMany', 'api::vehicle.vehicle'>;
  };
}

export interface ApiRideRide extends Struct.CollectionTypeSchema {
  collectionName: 'rides';
  info: {
    displayName: 'Ride';
    name: 'ride';
    pluralName: 'rides';
    singularName: 'ride';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    acceptedAt: Schema.Attribute.DateTime;
    actualDistance: Schema.Attribute.Decimal;
    actualDuration: Schema.Attribute.Integer;
    arrivedAt: Schema.Attribute.DateTime;
    baseFare: Schema.Attribute.Decimal;
    behindBusDistance: Schema.Attribute.Decimal;
    behindBusSurcharge: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    busRoute: Schema.Attribute.Relation<
      'manyToOne',
      'api::bus-route.bus-route'
    >;
    cancellationFee: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    cancellationReason: Schema.Attribute.Text;
    cancelledAt: Schema.Attribute.DateTime;
    cancelledBy: Schema.Attribute.Enumeration<['rider', 'driver', 'system']>;
    commission: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    commissionDeducted: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    distanceFare: Schema.Attribute.Decimal;
    driver: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    driverEarnings: Schema.Attribute.Decimal;
    driverRating: Schema.Attribute.Relation<'oneToOne', 'api::rating.rating'>;
    dropoffLocation: Schema.Attribute.JSON & Schema.Attribute.Required;
    dropoffStation: Schema.Attribute.Relation<
      'manyToOne',
      'api::bus-station.bus-station'
    >;
    estimatedDistance: Schema.Attribute.Decimal;
    estimatedDuration: Schema.Attribute.Integer;
    isDelivery: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isPassengerBehindBus: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::ride.ride'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    package: Schema.Attribute.Relation<'oneToOne', 'api::package.package'>;
    passengerCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    paymentMethod: Schema.Attribute.Enumeration<['cash', 'okrapay']> &
      Schema.Attribute.Required;
    paymentStatus: Schema.Attribute.Enumeration<
      ['pending', 'completed', 'failed']
    >;
    pickupLocation: Schema.Attribute.JSON & Schema.Attribute.Required;
    pickupStation: Schema.Attribute.Relation<
      'manyToOne',
      'api::bus-station.bus-station'
    >;
    promoCode: Schema.Attribute.Relation<
      'manyToOne',
      'api::promo-code.promo-code'
    >;
    promoDiscount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    requestedAt: Schema.Attribute.DateTime;
    requestedDrivers: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    rideClass: Schema.Attribute.Relation<
      'manyToOne',
      'api::ride-class.ride-class'
    >;
    rideCode: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    rider: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    riderRating: Schema.Attribute.Relation<'oneToOne', 'api::rating.rating'>;
    rideType: Schema.Attribute.Enumeration<['taxi', 'bus', 'delivery']> &
      Schema.Attribute.Required;
    scheduledFor: Schema.Attribute.DateTime;
    specialRequests: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    status: Schema.Attribute.Enumeration<
      [
        'pending',
        'accepted',
        'arrived',
        'passenger_onboard',
        'completed',
        'cancelled',
        'no_drivers_available',
      ]
    > &
      Schema.Attribute.Required;
    subscriptionId: Schema.Attribute.String;
    subtotal: Schema.Attribute.Decimal;
    surgeFare: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    taxiType: Schema.Attribute.Relation<
      'manyToOne',
      'api::taxi-type.taxi-type'
    >;
    timeFare: Schema.Attribute.Decimal;
    totalFare: Schema.Attribute.Decimal & Schema.Attribute.Required;
    transaction: Schema.Attribute.Relation<
      'manyToOne',
      'api::transaction.transaction'
    >;
    tripCompletedAt: Schema.Attribute.DateTime;
    tripStartedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    vehicle: Schema.Attribute.Relation<'manyToOne', 'api::vehicle.vehicle'>;
    wasSubscriptionRide: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
  };
}

export interface ApiRoutePricingRoutePricing
  extends Struct.CollectionTypeSchema {
  collectionName: 'route_pricings';
  info: {
    displayName: 'Route Pricing';
    name: 'routePricing';
    pluralName: 'route-pricings';
    singularName: 'route-pricing';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    busRoute: Schema.Attribute.Relation<
      'manyToOne',
      'api::bus-route.bus-route'
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.Relation<'manyToOne', 'api::currency.currency'>;
    distance: Schema.Attribute.Decimal;
    endStation: Schema.Attribute.Relation<
      'manyToOne',
      'api::bus-station.bus-station'
    > &
      Schema.Attribute.Required;
    estimatedDuration: Schema.Attribute.Integer;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::route-pricing.route-pricing'
    > &
      Schema.Attribute.Private;
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    startStation: Schema.Attribute.Relation<
      'manyToOne',
      'api::bus-station.bus-station'
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSmsLogSmsLog extends Struct.CollectionTypeSchema {
  collectionName: 'sms_logs';
  info: {
    displayName: 'SMS Log';
    name: 'smsLog';
    pluralName: 'sms-logs';
    singularName: 'sms-log';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    cost: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deliveredAt: Schema.Attribute.DateTime;
    failureReason: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::sms-log.sms-log'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    messageId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    phoneNumber: Schema.Attribute.String & Schema.Attribute.Required;
    provider: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'africas_talking'>;
    providerMessageId: Schema.Attribute.String;
    providerResponse: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    recipient: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    retryCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sentAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['pending', 'sent', 'delivered', 'failed', 'rejected']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    template: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSosAlertSosAlert extends Struct.CollectionTypeSchema {
  collectionName: 'sos_alerts';
  info: {
    displayName: 'SOS Alert';
    name: 'sosAlert';
    pluralName: 'sos-alerts';
    singularName: 'sos-alert';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    acknowledgedAt: Schema.Attribute.DateTime;
    alertId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    audioRecording: Schema.Attribute.Media<'audios'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    emergencyContactsNotified: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::sos-alert.sos-alert'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.JSON & Schema.Attribute.Required;
    photos: Schema.Attribute.Media<'images', true>;
    policeNotified: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    priority: Schema.Attribute.Enumeration<
      ['low', 'medium', 'high', 'critical']
    > &
      Schema.Attribute.DefaultTo<'high'>;
    publishedAt: Schema.Attribute.DateTime;
    resolutionNotes: Schema.Attribute.Text;
    resolvedAt: Schema.Attribute.DateTime;
    respondedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    ride: Schema.Attribute.Relation<'manyToOne', 'api::ride.ride'>;
    status: Schema.Attribute.Enumeration<
      ['open', 'acknowledged', 'in_progress', 'resolved', 'false_alarm']
    > &
      Schema.Attribute.DefaultTo<'open'>;
    type: Schema.Attribute.Enumeration<
      ['emergency', 'safety_concern', 'accident', 'harassment', 'other']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiSubscriptionPlanSubscriptionPlan
  extends Struct.CollectionTypeSchema {
  collectionName: 'subscription_plans';
  info: {
    displayName: 'Subscription Plan';
    name: 'subscriptionPlan';
    pluralName: 'subscription-plans';
    singularName: 'subscription-plan';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.Relation<'manyToOne', 'api::currency.currency'>;
    description: Schema.Attribute.Text;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    durationType: Schema.Attribute.Enumeration<
      ['daily', 'weekly', 'monthly', 'yearly']
    > &
      Schema.Attribute.Required;
    durationValue: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    features: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    freeTrialDays: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    hasFreeTrial: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isPopular: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::subscription-plan.subscription-plan'
    > &
      Schema.Attribute.Private;
    maxRidesPerDay: Schema.Attribute.Integer;
    maxRidesPerPeriod: Schema.Attribute.Integer;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    planId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSubscriptionSubscription
  extends Struct.CollectionTypeSchema {
  collectionName: 'subscriptions';
  info: {
    displayName: 'subscription';
    pluralName: 'subscriptions';
    singularName: 'subscription';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    aboutRoute: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::subscription.subscription'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSupportTicketSupportTicket
  extends Struct.CollectionTypeSchema {
  collectionName: 'support_tickets';
  info: {
    displayName: 'Support Ticket';
    name: 'supportTicket';
    pluralName: 'support-tickets';
    singularName: 'support-ticket';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    assignedTo: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    attachments: Schema.Attribute.Media<'images' | 'files' | 'videos', true>;
    category: Schema.Attribute.Enumeration<
      [
        'ride_issue',
        'payment_issue',
        'subscription_issue',
        'account_issue',
        'technical_issue',
        'feature_request',
        'complaint',
        'other',
      ]
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::support-ticket.support-ticket'
    > &
      Schema.Attribute.Private;
    priority: Schema.Attribute.Enumeration<
      ['low', 'medium', 'high', 'urgent']
    > &
      Schema.Attribute.DefaultTo<'medium'>;
    publishedAt: Schema.Attribute.DateTime;
    resolutionTime: Schema.Attribute.Integer;
    resolvedAt: Schema.Attribute.DateTime;
    responses: Schema.Attribute.Component<'support.ticket-response', true>;
    ride: Schema.Attribute.Relation<'manyToOne', 'api::ride.ride'>;
    satisfactionRating: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    status: Schema.Attribute.Enumeration<
      ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed']
    > &
      Schema.Attribute.DefaultTo<'open'>;
    subject: Schema.Attribute.String & Schema.Attribute.Required;
    subscription: Schema.Attribute.Relation<
      'manyToOne',
      'api::driver-subscription.driver-subscription'
    >;
    tags: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    ticketId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiSurgePricingSurgePricing
  extends Struct.CollectionTypeSchema {
  collectionName: 'surge_pricings';
  info: {
    displayName: 'Surge Pricing';
    name: 'surgePricing';
    pluralName: 'surge-pricings';
    singularName: 'surge-pricing';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    applicableRideTypes: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<['taxi', 'bus']>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    daysOfWeek: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<[0, 1, 2, 3, 4, 5, 6]>;
    endTime: Schema.Attribute.DateTime & Schema.Attribute.Required;
    geofenceZone: Schema.Attribute.Relation<
      'manyToOne',
      'api::geofence-zone.geofence-zone'
    > &
      Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isRecurring: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::surge-pricing.surge-pricing'
    > &
      Schema.Attribute.Private;
    multiplier: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    reason: Schema.Attribute.Text;
    startTime: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSystemAnnouncementSystemAnnouncement
  extends Struct.CollectionTypeSchema {
  collectionName: 'system_announcements';
  info: {
    displayName: 'System Announcement';
    name: 'systemAnnouncement';
    pluralName: 'system-announcements';
    singularName: 'system-announcement';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    icon: Schema.Attribute.Media<'images'>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    isDismissible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    linkText: Schema.Attribute.String;
    linkUrl: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::system-announcement.system-announcement'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    priority: Schema.Attribute.Enumeration<['low', 'medium', 'high']> &
      Schema.Attribute.DefaultTo<'medium'>;
    publishedAt: Schema.Attribute.DateTime;
    showFrom: Schema.Attribute.DateTime & Schema.Attribute.Required;
    showUntil: Schema.Attribute.DateTime & Schema.Attribute.Required;
    targetAudience: Schema.Attribute.Enumeration<
      ['all', 'riders', 'drivers', 'delivery', 'conductors']
    > &
      Schema.Attribute.DefaultTo<'all'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['info', 'warning', 'maintenance', 'feature', 'promotion']
    > &
      Schema.Attribute.DefaultTo<'info'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTaxiTypeTaxiType extends Struct.CollectionTypeSchema {
  collectionName: 'taxi_types';
  info: {
    displayName: 'Taxi Type';
    name: 'taxiType';
    pluralName: 'taxi-types';
    singularName: 'taxi-type';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    displayOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    icon: Schema.Attribute.Media<'images'>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::taxi-type.taxi-type'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTransactionTransaction extends Struct.CollectionTypeSchema {
  collectionName: 'transactions';
  info: {
    displayName: 'Transaction';
    name: 'transaction';
    pluralName: 'transactions';
    singularName: 'transaction';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.Relation<'manyToOne', 'api::currency.currency'>;
    gatewayReference: Schema.Attribute.String;
    gatewayResponse: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::transaction.transaction'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    notes: Schema.Attribute.Text;
    paymentMethod: Schema.Attribute.Enumeration<
      ['cash', 'okrapay', 'mobile_money', 'bank_transfer']
    >;
    processedAt: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    ride: Schema.Attribute.Relation<'manyToOne', 'api::ride.ride'>;
    status: Schema.Attribute.Enumeration<
      ['pending', 'completed', 'failed', 'cancelled', 'refunded']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pending'>;
    subscription: Schema.Attribute.Relation<
      'manyToOne',
      'api::driver-subscription.driver-subscription'
    >;
    transactionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    type: Schema.Attribute.Enumeration<
      [
        'ride_payment',
        'float_topup',
        'withdrawal',
        'subscription_payment',
        'commission',
        'refund',
        'affiliate_payout',
      ]
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiTranslationTranslation extends Struct.CollectionTypeSchema {
  collectionName: 'translations';
  info: {
    displayName: 'Translation';
    name: 'translation';
    pluralName: 'translations';
    singularName: 'translation';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'general',
        'rides',
        'payments',
        'notifications',
        'errors',
        'subscriptions',
      ]
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::translation.translation'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    translations: Schema.Attribute.Component<
      'translations.translation-item',
      true
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiVehicleMakesAndModelVehicleMakesAndModel
  extends Struct.SingleTypeSchema {
  collectionName: 'vehicle_makes_and_models';
  info: {
    displayName: 'vehicleMakesAndModels';
    pluralName: 'vehicle-makes-and-models';
    singularName: 'vehicle-makes-and-model';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    list: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::vehicle-makes-and-model.vehicle-makes-and-model'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiVehicleVehicle extends Struct.CollectionTypeSchema {
  collectionName: 'vehicles';
  info: {
    displayName: 'Vehicle';
    name: 'vehicle';
    pluralName: 'vehicles';
    singularName: 'vehicle';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    assignedDriver: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    fitnessDocument: Schema.Attribute.Media<'images' | 'files'>;
    fitnessExpiryDate: Schema.Attribute.Date;
    insuranceCertificate: Schema.Attribute.Media<'images' | 'files'>;
    insuranceExpiryDate: Schema.Attribute.Date;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::vehicle.vehicle'
    > &
      Schema.Attribute.Private;
    make: Schema.Attribute.String & Schema.Attribute.Required;
    model: Schema.Attribute.String & Schema.Attribute.Required;
    numberPlate: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    owner: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    registrationDocument: Schema.Attribute.Media<'images' | 'files'>;
    rideClasses: Schema.Attribute.Relation<
      'manyToMany',
      'api::ride-class.ride-class'
    >;
    roadTaxCertificate: Schema.Attribute.Media<'images' | 'files'>;
    roadTaxExpiryDate: Schema.Attribute.Date;
    seatingCapacity: Schema.Attribute.Integer;
    taxiType: Schema.Attribute.Relation<
      'manyToOne',
      'api::taxi-type.taxi-type'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    vehiclePhotos: Schema.Attribute.Media<'images', true>;
    vehicleType: Schema.Attribute.Enumeration<
      ['taxi', 'bus', 'motorcycle', 'truck']
    > &
      Schema.Attribute.Required;
    verificationStatus: Schema.Attribute.Enumeration<
      ['not_started', 'pending', 'approved', 'rejected']
    > &
      Schema.Attribute.DefaultTo<'not_started'>;
    year: Schema.Attribute.Integer;
  };
}

export interface ApiVerifyotpVerifyotp extends Struct.CollectionTypeSchema {
  collectionName: 'verifyotps';
  info: {
    displayName: 'verifyotp';
    pluralName: 'verifyotps';
    singularName: 'verifyotp';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    identifier: Schema.Attribute.String;
    identifierType: Schema.Attribute.Enumeration<['phoneNumber', 'email']>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::verifyotp.verifyotp'
    > &
      Schema.Attribute.Private;
    otp: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiWithdrawalWithdrawal extends Struct.CollectionTypeSchema {
  collectionName: 'withdrawals';
  info: {
    displayName: 'Withdrawal';
    name: 'withdrawal';
    pluralName: 'withdrawals';
    singularName: 'withdrawal';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    accountDetails: Schema.Attribute.JSON & Schema.Attribute.Required;
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.Relation<'manyToOne', 'api::currency.currency'>;
    failureReason: Schema.Attribute.Text;
    gatewayReference: Schema.Attribute.String;
    gatewayResponse: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::withdrawal.withdrawal'
    > &
      Schema.Attribute.Private;
    method: Schema.Attribute.Enumeration<
      ['okrapay', 'mobile_money', 'bank_transfer']
    > &
      Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    processedAt: Schema.Attribute.DateTime;
    processedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    requestedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      ['pending', 'processing', 'completed', 'failed', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
    withdrawalId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.String;
    caption: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.String;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: 'Extended user with multi-profile system';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    activeProfile: Schema.Attribute.Enumeration<
      ['none', 'rider', 'driver', 'delivery', 'conductor']
    > &
      Schema.Attribute.DefaultTo<'none'>;
    address: Schema.Attribute.Text;
    adminType: Schema.Attribute.Enumeration<
      ['noRole', 'super_admin', 'manager', 'fleet_owner', 'support', 'finance']
    > &
      Schema.Attribute.DefaultTo<'noRole'>;
    affiliateProfile: Schema.Attribute.Component<
      'affiliate.affiliate-profile',
      false
    > &
      Schema.Attribute.Required;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    conductorProfile: Schema.Attribute.Component<
      'conductor-profiles.conductor-profile',
      false
    >;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    country: Schema.Attribute.Relation<'oneToOne', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currentLocation: Schema.Attribute.JSON;
    dateOfBirth: Schema.Attribute.Date;
    deletedAt: Schema.Attribute.DateTime;
    deliveryProfile: Schema.Attribute.Component<
      'delivery-profiles.delivery-profile',
      false
    >;
    deviceInfo: Schema.Attribute.JSON;
    deviceToken: Schema.Attribute.String;
    driverProfile: Schema.Attribute.Component<
      'driver-profiles.driver-profile',
      false
    >;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    emergencyContacts: Schema.Attribute.Relation<
      'oneToMany',
      'api::emergency-contact.emergency-contact'
    >;
    favoriteLocations: Schema.Attribute.Relation<
      'oneToMany',
      'api::favorite-location.favorite-location'
    >;
    firstName: Schema.Attribute.String;
    gender: Schema.Attribute.Enumeration<
      ['male', 'female', 'other', 'prefer_not_to_say']
    >;
    isOnline: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lastName: Schema.Attribute.String;
    lastSeen: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    phoneNumber: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    phoneVerified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    profileActivityStatus: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<{
        conductor: false;
        delivery: false;
        driver: false;
        rider: false;
      }>;
    profileIds: Schema.Attribute.JSON;
    profilePicture: Schema.Attribute.Media<'images'>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    referredBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    refreshToken: Schema.Attribute.String & Schema.Attribute.Private;
    refreshTokenExpiry: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    riderProfile: Schema.Attribute.Component<
      'rider-profiles.rider-profile',
      false
    >;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    sessionExpiry: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::admn-setting.admn-setting': ApiAdmnSettingAdmnSetting;
      'api::admn-user-permission.admn-user-permission': ApiAdmnUserPermissionAdmnUserPermission;
      'api::affiliate-transaction.affiliate-transaction': ApiAffiliateTransactionAffiliateTransaction;
      'api::affiliate.affiliate': ApiAffiliateAffiliate;
      'api::allowed-vehicle-year.allowed-vehicle-year': ApiAllowedVehicleYearAllowedVehicleYear;
      'api::analytics-snapshot.analytics-snapshot': ApiAnalyticsSnapshotAnalyticsSnapshot;
      'api::app-version.app-version': ApiAppVersionAppVersion;
      'api::audit-log.audit-log': ApiAuditLogAuditLog;
      'api::bus-route.bus-route': ApiBusRouteBusRoute;
      'api::bus-station.bus-station': ApiBusStationBusStation;
      'api::cancellation-reason.cancellation-reason': ApiCancellationReasonCancellationReason;
      'api::commission-tier.commission-tier': ApiCommissionTierCommissionTier;
      'api::country.country': ApiCountryCountry;
      'api::currency.currency': ApiCurrencyCurrency;
      'api::device-tracking.device-tracking': ApiDeviceTrackingDeviceTracking;
      'api::doc.doc': ApiDocDoc;
      'api::driver-subscription.driver-subscription': ApiDriverSubscriptionDriverSubscription;
      'api::driver.driver': ApiDriverDriver;
      'api::email-addresses-list.email-addresses-list': ApiEmailAddressesListEmailAddressesList;
      'api::email-log.email-log': ApiEmailLogEmailLog;
      'api::emergency-contact.emergency-contact': ApiEmergencyContactEmergencyContact;
      'api::favorite-location.favorite-location': ApiFavoriteLocationFavoriteLocation;
      'api::finance.finance': ApiFinanceFinance;
      'api::float-topup.float-topup': ApiFloatTopupFloatTopup;
      'api::geofence-zone.geofence-zone': ApiGeofenceZoneGeofenceZone;
      'api::language.language': ApiLanguageLanguage;
      'api::ledger-entry.ledger-entry': ApiLedgerEntryLedgerEntry;
      'api::notification.notification': ApiNotificationNotification;
      'api::otp-verification.otp-verification': ApiOtpVerificationOtpVerification;
      'api::package.package': ApiPackagePackage;
      'api::payment-method.payment-method': ApiPaymentMethodPaymentMethod;
      'api::phone-numbers-list.phone-numbers-list': ApiPhoneNumbersListPhoneNumbersList;
      'api::promo-code.promo-code': ApiPromoCodePromoCode;
      'api::push-notification-log.push-notification-log': ApiPushNotificationLogPushNotificationLog;
      'api::rating.rating': ApiRatingRating;
      'api::resendotp.resendotp': ApiResendotpResendotp;
      'api::ride-class.ride-class': ApiRideClassRideClass;
      'api::ride.ride': ApiRideRide;
      'api::route-pricing.route-pricing': ApiRoutePricingRoutePricing;
      'api::sms-log.sms-log': ApiSmsLogSmsLog;
      'api::sos-alert.sos-alert': ApiSosAlertSosAlert;
      'api::subscription-plan.subscription-plan': ApiSubscriptionPlanSubscriptionPlan;
      'api::subscription.subscription': ApiSubscriptionSubscription;
      'api::support-ticket.support-ticket': ApiSupportTicketSupportTicket;
      'api::surge-pricing.surge-pricing': ApiSurgePricingSurgePricing;
      'api::system-announcement.system-announcement': ApiSystemAnnouncementSystemAnnouncement;
      'api::taxi-type.taxi-type': ApiTaxiTypeTaxiType;
      'api::transaction.transaction': ApiTransactionTransaction;
      'api::translation.translation': ApiTranslationTranslation;
      'api::vehicle-makes-and-model.vehicle-makes-and-model': ApiVehicleMakesAndModelVehicleMakesAndModel;
      'api::vehicle.vehicle': ApiVehicleVehicle;
      'api::verifyotp.verifyotp': ApiVerifyotpVerifyotp;
      'api::withdrawal.withdrawal': ApiWithdrawalWithdrawal;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
