import { permissionActions, resources, type ResourceDefinition } from '../resources';
import { isClassVisibleForCountry } from '../../../../utils/country-pricing';

const USER_UID = 'plugin::users-permissions.user';
const COUNTRY_UID = 'api::country.country';
const PHONE_FIELDS = ['driverLicenseFront', 'driverLicenseBack', 'nationalIdFront', 'nationalIdBack', 'proofOfAddress'];
const DRIVER_PROFILE_FIELDS = [
  'driverLicenseNumber', 'licenseExpiryDate', 'nationalIdNumber', 'verificationStatus',
  'isActive', 'floatBalance', 'allowedNegativeBalance', 'negativeBalanceLimit',
];
const COUNTRY_EXCLUDED = new Set([
  'id', 'documentId', 'name', 'code', 'phoneCode', 'currency', 'defaultCurrency',
  'settingsOverrides', 'overideOtpCode', 'createdAt', 'updatedAt', 'publishedAt',
]);
const PLATFORM_STAT_FIELDS = [
  'id', 'lastCalculatedAt', 'platformStatCalculationCycleInMins',
  'partnerCommisionPercentage', 'partnerCommissionShare', 'estimatedProfit',
  'totalDriverEarnings', 'totalPlatformCommission', 'totalSubscriptionRevenue',
  'totalFloatSold', 'totalDriverFloatIssued', 'totalPartnerFloatPurchased',
  'totalActiveFloat', 'totalNegativeFloat', 'driversWithNegativeFloat',
  'totalWithdrawalsProcessed', 'totalPendingWithdrawals',
  'totalRidesCompleted', 'totalRideCount', 'totalRidesCancelled', 'totalSubscriptionRides', 'totalFloatRides',
  'totalCashRides', 'totalDigitalRides', 'activeDriverCount', 'activeSubscriberCount',
  'totalDriverCount', 'totalDelivererCount', 'totalRiderCount',
  'trialSubscriberCount', 'totalDeliveriesCompleted', 'totalDeliveryCount', 'totalDeliveriesCancelled',
  'totalDeliveryDriverEarnings', 'totalDeliveryPlatformCommission', 'totalCashDeliveries',
  'totalDigitalDeliveries', 'activeDeliveryDriverCount', 'totalAffiliatePoints',
  'totalAffiliatePayouts', 'totalPendingAffiliateBalance', 'activeAffiliateCount',
  'totalAffiliateReferrals', 'totalAffiliateTransactions',
];
const PLATFORM_STAT_UID = 'api::platform-stat.platform-stat';

function fail(ctx: any, status: number, message: string): never {
  ctx.throw(status, message);
  throw new Error(message);
}

function integer(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function getData(ctx: any): any {
  const body = ctx.request.body ?? {};
  return body.data && typeof body.data === 'object' ? body.data : body;
}

function response(ctx: any, data: unknown, meta?: unknown): void {
  ctx.body = meta === undefined ? { data } : { data, meta };
}

function safeUser(user: any): any {
  if (!user) return user;
  const {
    password, resetPasswordToken, confirmationToken, refreshToken,
    refreshTokenExpiry, sessionExpiry, ...visible
  } = user;
  return visible;
}

function nativeUserId(ctx: any): number | null {
  return integer(ctx.state?.user?.id);
}

async function currentAdmin(ctx: any, strapi: any): Promise<any> {
  const id = nativeUserId(ctx);
  if (!id) fail(ctx, 401, 'Authenticated Strapi Admin user is required');
  const admin = await strapi.db.query('admin::user').findOne({
    where: { id },
    select: ['id', 'firstname', 'lastname', 'email', 'isActive'],
    populate: { roles: { select: ['id', 'code', 'name'], populate: { permissions: { select: ['action'] } } } },
  });
  if (!admin) fail(ctx, 401, 'Authenticated Strapi Admin user was not found');
  return admin;
}

function hasSuperAdminRole(admin: any): boolean {
  return (admin.roles ?? []).some((role: any) => role.code === 'strapi-super-admin');
}

function hasAbility(ctx: any, action: string): boolean {
  const ability = ctx.state?.userAbility;
  return Boolean(ability?.can?.(action));
}

async function assertPermission(ctx: any, strapi: any, category: string, mode: 'view' | 'manage'): Promise<any> {
  const admin = await currentAdmin(ctx, strapi);
  const action = `plugin::admn.${category}.${mode}`;
  if (!hasSuperAdminRole(admin) && !hasAbility(ctx, action)) {
    fail(ctx, 403, `Missing permission: admn.${category}.${mode}`);
  }
  return admin;
}

async function assertSuperAdmin(ctx: any, strapi: any): Promise<any> {
  const admin = await currentAdmin(ctx, strapi);
  if (!hasSuperAdminRole(admin)) fail(ctx, 403, 'Only a native Strapi Super Admin may manage admin users');
  return admin;
}

function normalizePermissions(admin: any): string[] {
  if (hasSuperAdminRole(admin)) {
    return permissionActions.map((action: any) => `admn.${action.uid}`);
  }
  const result = new Set<string>();
  for (const role of admin.roles ?? []) {
    for (const permission of role.permissions ?? []) {
      const action = String(permission.action ?? '');
      if (action.startsWith('plugin::admn.')) result.add(action.replace('plugin::', ''));
    }
  }
  return [...result].sort();
}

function pagination(ctx: any): { page: number; pageSize: number; start: number } {
  const options = ctx.query?.pagination ?? {};
  const page = Math.max(1, integer(options.page ?? ctx.query?.page) ?? 1);
  const pageSize = Math.min(100, Math.max(1, integer(options.pageSize ?? ctx.query?.pageSize) ?? 25));
  return { page, pageSize, start: (page - 1) * pageSize };
}

function unwrapQuery(value: any): any {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'filters' in value) return value.filters;
  return value;
}

function coerceFilterValue(value: any): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

const PROFILE_FILTERS: Record<string, string[]> = {
  driverProfile: ['id', 'verificationStatus', 'subscriptionStatus', 'blocked', 'isActive', 'assignedVehicle'],
  assignedVehicle: ['id'],
  deliveryProfile: ['id', 'verificationStatus', 'activeVehicleType', 'isActive', 'blocked'],
  country: ['id'],
  riderProfile: ['id', 'blocked', 'isActive'],
  affiliateProfile: ['id', 'affiliateCode', 'blocked'],
  partnerProfile: ['id', 'verificationStatus', 'businessName'],
};

function sanitizeFilterNode(node: any, allowedFields: string[], depth = 0): any {
  if (depth > 4 || !node || typeof node !== 'object') return undefined;
  const result: any = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === '$or' || key === '$and') {
      if (Array.isArray(value)) {
        const children = value.map((item) => sanitizeFilterNode(item, allowedFields, depth + 1)).filter(Boolean);
        if (children.length) result[key] = children;
      }
      continue;
    }
    if (PROFILE_FILTERS[key] && allowedFields.includes(key)) {
      const nested = sanitizeFilterNode(value, PROFILE_FILTERS[key], depth + 1);
      if (nested) result[key] = nested;
      continue;
    }
    if (!allowedFields.includes(key)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const operators: any = {};
      for (const [operator, raw] of Object.entries(value)) {
        if (['$eq', '$ne', '$notNull', '$containsi', '$in', '$gte', '$lte'].includes(operator)) {
          operators[operator] = Array.isArray(raw) ? raw.slice(0, 100).map(coerceFilterValue) : coerceFilterValue(raw);
        }
      }
      if (Object.keys(operators).length) result[key] = operators;
    } else {
      result[key] = coerceFilterValue(value);
    }
  }
  return Object.keys(result).length ? result : undefined;
}

function safeSort(ctx: any, definition: ResourceDefinition, strapi: any): any[] {
  const raw = ctx.query?.sort;
  const sorts = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return sorts.slice(0, 3).flatMap((item: unknown) => {
    if (typeof item !== 'string') return [];
    const [field, direction] = item.split(':');
    if (!getSelectableFields(definition, strapi).includes(field) || !['asc', 'desc'].includes(direction ?? '')) return [];
    return [{ [field]: direction }];
  });
}

function getWritableFields(definition: ResourceDefinition, strapi: any): string[] {
  const systemFields = new Set(['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt']);
  if (definition.uid === COUNTRY_UID) {
    const attributes = strapi.contentTypes[COUNTRY_UID]?.attributes ?? {};
    const scalars = Object.entries(attributes).flatMap(([key, attribute]: [string, any]) => {
      if (attribute.private || ['settingsOverrides', 'overideOtpCode'].includes(key)) return [];
      return ['string', 'text', 'email', 'integer', 'decimal', 'float', 'boolean', 'enumeration', 'json'].includes(attribute.type) ? [key] : [];
    });
    return [...scalars, 'currency', 'defaultCurrency'];
  }
  const attributes = strapi.contentTypes[definition.uid]?.attributes ?? {};
  if (!definition.single) {
    if (definition.fields.length) return definition.fields.filter((field) => !systemFields.has(field));
    return Object.entries(attributes).flatMap(([key, attribute]: [string, any]) => (
      systemFields.has(key) || attribute.private
        || !['string', 'text', 'email', 'integer', 'decimal', 'float', 'boolean', 'enumeration', 'json', 'date', 'datetime'].includes(attribute.type)
        ? []
        : [key]
    ));
  }
  return Object.entries(attributes).flatMap(([key, attribute]: [string, any]) => {
    if (systemFields.has(key) || attribute.private || key === 'overideOtpCode' || ['component', 'dynamiczone', 'password'].includes(attribute.type)) return [];
    if (['relation', 'media'].includes(attribute.type) && !['defaultCurrency', 'driverOrderRequestRingtone'].includes(key)) return [];
    return ['string', 'text', 'email', 'integer', 'decimal', 'float', 'boolean', 'enumeration', 'json', 'relation', 'media'].includes(attribute.type) ? [key] : [];
  });
}

function getSelectableFields(definition: ResourceDefinition, strapi: any): string[] {
  const attributes = strapi.contentTypes[definition.uid]?.attributes ?? {};
  const systemFields = ['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt'];
  if (definition.uid === COUNTRY_UID || definition.single) {
    const safeFields = Object.entries(attributes).flatMap(([key, attribute]: [string, any]) => {
      if (attribute.private || ['settingsOverrides', 'overideOtpCode'].includes(key)) return [];
      if (['relation', 'media', 'component', 'dynamiczone', 'password'].includes(attribute.type)) return [];
      return [key];
    });
    return [...systemFields, ...safeFields];
  }
  const configuredFields = definition.fields.length ? definition.fields : Object.keys(attributes);
  return configuredFields.filter((field) => {
    if (systemFields.includes(field)) return true;
    const attribute = attributes[field];
    return Boolean(attribute && !attribute.private && !['relation', 'media', 'component', 'dynamiczone', 'password'].includes(attribute.type));
  });
}

function allowedResourceData(data: any, definition: ResourceDefinition, strapi: any): any {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const result: any = {};
  for (const field of getWritableFields(definition, strapi)) {
    if (Object.prototype.hasOwnProperty.call(data, field)) result[field] = data[field];
  }
  return result;
}

function assertDefinedResourceFields(ctx: any, data: any, definition: ResourceDefinition, strapi: any): void {
  const allowed = new Set(getWritableFields(definition, strapi));
  const rejected = Object.keys(data).filter((field) => !allowed.has(field));
  if (rejected.length) fail(ctx, 400, `Unsupported field(s): ${rejected.join(', ')}`);
}

function normalizedPhone(ctx: any, value: unknown): string {
  if (typeof value !== 'string') fail(ctx, 400, 'phoneNumber is required');
  const digits = value.replace(/[\s\-().+]/g, '');
  if (!/^\d{7,15}$/.test(digits)) fail(ctx, 400, 'phoneNumber must contain 7 to 15 digits');
  return `+${digits}`;
}

async function findCountry(strapi: any, id: unknown): Promise<any> {
  const countryId = integer(id);
  if (!countryId) return null;
  return strapi.db.query(COUNTRY_UID).findOne({ where: { id: countryId, isActive: true } });
}

async function getAuthenticatedRole(strapi: any): Promise<any> {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
  if (!role) throw new Error('The authenticated users-permissions role is not configured');
  return role;
}

function publicCountry(country: any): any {
  return {
    id: country.id,
    documentId: country.documentId,
    name: country.name,
    code: country.code,
    phoneCode: country.phoneCode,
    phoneNumberDigitLenth: country.phoneNumberDigitLenth,
    phoneNumberRegex: country.phoneNumberRegex,
    currency: country.currency ? { id: country.currency.id, code: country.currency.code, symbol: country.currency.symbol } : undefined,
  };
}

async function countryList(strapi: any): Promise<any[]> {
  const countries = await strapi.db.query(COUNTRY_UID).findMany({
    where: { isActive: true },
    select: ['id', 'documentId', 'name', 'code', 'phoneCode', 'phoneNumberDigitLenth', 'phoneNumberRegex'],
    populate: { currency: { select: ['id', 'code', 'symbol'] } },
    orderBy: { name: 'asc' },
  });
  return countries.map(publicCountry);
}

function getCountryAttributeFields(strapi: any): Array<{ key: string; label: string; description: string; type: string; value: unknown; options?: string[] }> {
  const attributes = strapi.contentTypes[COUNTRY_UID]?.attributes ?? {};
  return Object.entries(attributes).flatMap(([key, attribute]: [string, any]) => {
    if (COUNTRY_EXCLUDED.has(key) || attribute.private || ['relation', 'media', 'component', 'dynamiczone', 'password'].includes(attribute.type)) return [];
    if (!['string', 'text', 'email', 'integer', 'decimal', 'float', 'boolean', 'enumeration', 'json'].includes(attribute.type)) return [];
    return [{
      key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()),
      description: String(attribute.description ?? ''),
      type: attribute.type,
      value: attribute.default ?? null,
      ...(attribute.enum ? { options: attribute.enum } : {}),
    }];
  });
}

function validateCountryValue(ctx: any, attribute: any, value: any): any {
  const type = attribute.type;
  if (value === null && !attribute.required) return null;
  if (type === 'boolean' && typeof value !== 'boolean') fail(ctx, 400, 'Value must be a boolean');
  if (['integer', 'decimal', 'float'].includes(type) && (typeof value !== 'number' || !Number.isFinite(value))) fail(ctx, 400, 'Value must be a finite number');
  if (type === 'integer' && !Number.isInteger(value)) fail(ctx, 400, 'Value must be an integer');
  if (type === 'enumeration' && !attribute.enum?.includes(value)) fail(ctx, 400, 'Value is not an allowed option');
  if (['string', 'text', 'email'].includes(type) && (
    typeof value !== 'string' ||
    value.length > Math.min(Number(attribute.maxLength) || 10000, 10000)
  )) fail(ctx, 400, 'Value must be a string within the field length limit');
  if (type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(ctx, 400, 'Value must be a valid email address');
  if (type === 'json' && (value === undefined || typeof value === 'function')) fail(ctx, 400, 'Value must be JSON-compatible');
  return value;
}

async function userRows(strapi: any, query: any): Promise<any[]> {
  return strapi.db.query(USER_UID).findMany(query);
}

async function serviceCreateUser(strapi: any, data: any): Promise<any> {
  return strapi.plugin('users-permissions').service('user').add(data);
}

async function updateUserProfiles(strapi: any, user: any, data: any): Promise<any> {
  if (user.documentId && strapi.documents) {
    return strapi.documents(USER_UID).update({ documentId: user.documentId, data, populate: ['driverProfile', 'riderProfile', 'country', 'vehicles'] });
  }
  return strapi.db.query(USER_UID).update({ where: { id: user.id }, data, populate: ['driverProfile', 'riderProfile', 'country', 'vehicles'] });
}

function safeResource(resource: string, definition: ResourceDefinition, record: any): any {
  if (resource !== 'users' && resource !== 'affiliates') return record;
  return safeUser(record);
}

function resourceFor(ctx: any): { name: string; definition: ResourceDefinition } {
  const segments = String(ctx.path ?? '').split('/').filter(Boolean);
  const name = String(ctx.params.resource ?? segments.find((segment) => Object.prototype.hasOwnProperty.call(resources, segment)) ?? '');
  const definition = resources[name];
  if (!definition) fail(ctx, 404, 'Unknown admin resource');
  return { name, definition };
}

function filteredUsersData(ctx: any, data: any): { category: string; data: any } {
  const category = data.driverProfile ? 'drivers' : data.riderProfile ? 'riders' : data.affiliateProfile ? 'affiliates' : data.partnerProfile ? 'partners' : 'users';
  const allowedUserFields = new Set(['blocked', 'firstName', 'lastName', 'email', 'address']);
  const result: any = {};
  for (const field of allowedUserFields) if (Object.prototype.hasOwnProperty.call(data, field)) result[field] = data[field];
  for (const field of ['driverProfile', 'riderProfile', 'affiliateProfile']) {
    if (!data[field]) continue;
    const permitted = field === 'driverProfile'
      ? ['verificationStatus', 'blocked', 'isOnline', 'isAvailable', 'isActive']
      : field === 'riderProfile' || field === 'affiliateProfile' ? ['blocked'] : [];
    const nested: any = {};
    for (const allowed of permitted) if (Object.prototype.hasOwnProperty.call(data[field], allowed)) nested[allowed] = data[field][allowed];
    if (Object.keys(nested).length) result[field] = nested;
  }
  if (data.partnerProfile) fail(ctx, 400, 'Partner status must be changed using the partner status endpoint');
  return { category, data: result };
}

const controller = ({ strapi }: { strapi: any }) => ({
  async me(ctx: any) {
    const admin = await currentAdmin(ctx, strapi);
    const permissions = normalizePermissions(admin);
    response(ctx, {
      id: admin.id,
      firstname: admin.firstname,
      lastname: admin.lastname,
      email: admin.email,
      roles: (admin.roles ?? []).map((role: any) => ({ id: role.id, code: role.code, name: role.name })),
      permissions,
      isSuperAdmin: hasSuperAdminRole(admin),
    });
  },

  async resourceFields(ctx: any) {
    const name = String(ctx.params.resource ?? '');
    const definition = resources[name];
    if (!definition) fail(ctx, 404, 'Unknown admin resource');
    await assertPermission(ctx, strapi, definition.category, 'manage');
    if (definition.single || ['users', 'affiliates', 'partners'].includes(name)) {
      fail(ctx, 405, 'This resource does not support generic editing');
    }
    const attributes = strapi.contentTypes[definition.uid]?.attributes ?? {};
    const fields = getWritableFields(definition, strapi).flatMap((key) => {
      const attribute = attributes[key];
      if (!attribute || ['relation', 'media', 'component', 'dynamiczone', 'password'].includes(attribute.type)) return [];
      return [{
        key,
        type: attribute.type,
        required: Boolean(attribute.required),
        default: attribute.default ?? null,
        enum: Array.isArray(attribute.enum) ? attribute.enum : undefined,
      }];
    });
    response(ctx, { resource: name, fields });
  },

  async platformStats(ctx: any) {
    await assertPermission(ctx, strapi, 'dashboard', 'view');
    const countryId = ctx.query.countryId ? integer(ctx.query.countryId) : null;
    if (ctx.query.countryId && !countryId) fail(ctx, 400, 'countryId must be a positive integer');
    const stats = await strapi.db.query(PLATFORM_STAT_UID).findMany({
      where: countryId
        ? { country: { id: countryId, isActive: true } }
        : { country: { isActive: true } },
      select: PLATFORM_STAT_FIELDS,
      populate: {
        country: {
          select: ['id', 'name', 'code'],
          populate: { currency: { select: ['id', 'code', 'symbol', 'name'] } },
        },
      },
    });
    response(ctx, countryId ? stats[0] ?? null : stats);
  },

  async updateSingleSetting(ctx: any) {
    await assertPermission(ctx, strapi, 'settings', 'manage');
    const definition = resources['admn-setting'];
    const data = getData(ctx);
    assertDefinedResourceFields(ctx, data, definition, strapi);
    const payload = allowedResourceData(data, definition, strapi);
    if (!payload || Object.keys(payload).length === 0) fail(ctx, 400, 'A settings payload is required');
    const current = await strapi.db.query(definition.uid).findOne({});
    if (!current) fail(ctx, 404, 'Settings record not found');
    const updated = await strapi.db.query(definition.uid).update({
      where: { id: current.id }, data: payload, populate: definition.populate,
    });
    response(ctx, updated);
  },

  async listAdminUsers(ctx: any) {
    await assertSuperAdmin(ctx, strapi);
    const { page, pageSize, start } = pagination(ctx);
    const [rows, total] = await Promise.all([
      strapi.db.query('admin::user').findMany({
        select: ['id', 'firstname', 'lastname', 'email', 'isActive', 'createdAt', 'updatedAt'],
        populate: { roles: { select: ['id', 'code', 'name'] } },
        orderBy: { id: 'asc' },
        limit: pageSize,
        offset: start,
      }),
      strapi.db.query('admin::user').count({}),
    ]);
    response(ctx, rows.map((row: any) => ({
      id: row.id, firstname: row.firstname, lastname: row.lastname, email: row.email,
      isActive: row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt,
      roles: (row.roles ?? []).map((role: any) => ({ id: role.id, code: role.code, name: role.name })),
    })), { pagination: { page, pageSize, pageCount: Math.ceil(total / pageSize), total } });
  },

  async createAdminUser(ctx: any) {
    await assertSuperAdmin(ctx, strapi);
    const data = getData(ctx);
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const firstname = typeof data.firstname === 'string' ? data.firstname.trim() : '';
    const lastname = typeof data.lastname === 'string' ? data.lastname.trim() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(ctx, 400, 'A valid email is required');
    if (!firstname || !lastname) fail(ctx, 400, 'firstname and lastname are required');
    if (typeof data.password !== 'string' || data.password.length < 8) fail(ctx, 400, 'Password must be at least 8 characters');
    if (typeof data.isActive !== 'boolean') fail(ctx, 400, 'isActive must be a boolean');
    if (!Array.isArray(data.roles) || data.roles.length === 0) fail(ctx, 400, 'At least one native admin role is required');
    const roleIds = [...new Set(data.roles.map(integer))];
    if (roleIds.some((id: number | null) => id === null)) fail(ctx, 400, 'roles must contain valid native role IDs');
    const roles = await strapi.db.query('admin::role').findMany({ where: { id: { $in: roleIds } }, select: ['id'] });
    if (roles.length !== roleIds.length) fail(ctx, 400, 'One or more native admin roles do not exist');
    const userService = strapi.admin?.services?.user ?? strapi.service('admin::user');
    const created = await userService.create({ email, firstname, lastname, password: data.password, roles: roleIds, isActive: data.isActive });
    const cleared = await userService.updateById(created.id, { registrationToken: null, isActive: data.isActive });
    response(ctx, {
      id: cleared.id, email: cleared.email, firstname: cleared.firstname, lastname: cleared.lastname,
      isActive: cleared.isActive,
      roles: (cleared.roles ?? roles).map((role: any) => ({ id: role.id })),
    });
  },

  async updateAdminUser(ctx: any) {
    await assertSuperAdmin(ctx, strapi);
    const id = integer(ctx.params.id);
    if (!id) fail(ctx, 400, 'A valid admin user ID is required');
    const data = getData(ctx);
    if (Object.keys(data).some((key) => key !== 'isActive') || typeof data.isActive !== 'boolean') {
      fail(ctx, 400, 'Only isActive may be changed and it must be a boolean');
    }
    const target = await strapi.db.query('admin::user').findOne({
      where: { id }, select: ['id', 'isActive'], populate: { roles: { select: ['code'] } },
    });
    if (!target) fail(ctx, 404, 'Admin user not found');
    const isSuperAdmin = (target.roles ?? []).some((role: any) => role.code === 'strapi-super-admin');
    if (!data.isActive && target.isActive && isSuperAdmin) {
      const activeSuperAdmins = await strapi.db.query('admin::user').count({
        where: { isActive: true, roles: { code: 'strapi-super-admin' } },
      });
      if (activeSuperAdmins <= 1) fail(ctx, 409, 'Cannot deactivate the last active native Super Admin');
    }
    const userService = strapi.admin?.services?.user ?? strapi.service('admin::user');
    const updated = await userService.updateById(id, { isActive: data.isActive });
    response(ctx, { id: updated.id, isActive: updated.isActive });
  },

  async driverCountries(ctx: any) {
    await assertPermission(ctx, strapi, 'drivers', 'manage');
    response(ctx, await countryList(strapi));
  },

  async driverRequirements(ctx: any) {
    await assertPermission(ctx, strapi, 'drivers', 'manage');
    const country = await findCountry(strapi, ctx.query?.countryId);
    if (!country) fail(ctx, 404, 'Active country not found');
    response(ctx, {
      countryId: country.id,
      requirements: {
        driverLicense: Boolean(country.requireDriverLicense),
        nationalId: Boolean(country.requireNationalId),
        proofOfAddress: Boolean(country.requireProofOfAddress),
        insurance: Boolean(country.requireInsurance),
        roadTax: Boolean(country.requireRoadTax),
        fitnessDocument: Boolean(country.requireFitnessDocument),
        vehicleRegistration: Boolean(country.requireVehicleRegistration),
      },
    });
  },

  async riderCountries(ctx: any) {
    await assertPermission(ctx, strapi, 'riders', 'manage');
    response(ctx, await countryList(strapi));
  },

  async countryOptions(ctx: any) {
    await currentAdmin(ctx, strapi);
    const countries = await strapi.db.query(COUNTRY_UID).findMany({
      select: ['id', 'name', 'code'],
      populate: { currency: { select: ['id', 'name', 'code', 'symbol'] } },
      orderBy: { name: 'asc' },
      limit: 500,
    });
    response(ctx, countries);
  },

  async otpVerifications(ctx: any) {
    const admin = await currentAdmin(ctx, strapi);
    if (!hasSuperAdminRole(admin)) fail(ctx, 403, 'Only a Strapi Super Admin can view OTP verification records');

    const { page, pageSize, start } = pagination(ctx);
    const query = strapi.db.query('api::otp-verification.otp-verification');
    const [rows, total] = await Promise.all([
      query.findMany({
        select: ['id', 'email', 'phoneNumber', 'purpose', 'expiresAt', 'verified', 'verifiedAt', 'attempts', 'maxAttempts', 'ipAddress', 'createdAt'],
        orderBy: { createdAt: 'desc' },
        limit: pageSize,
        offset: start,
      }),
      query.count(),
    ]);
    response(ctx, rows, {
      pagination: { page, pageSize, pageCount: Math.ceil(total / pageSize), total },
    });
  },

  async driverPartners(ctx: any) {
    await assertPermission(ctx, strapi, 'drivers', 'manage');
    const partners = await strapi.db.query(USER_UID).findMany({
      where: { partnerProfile: { id: { $notNull: true } }, blocked: false },
      select: ['id', 'firstName', 'lastName', 'phoneNumber'],
      populate: { partnerProfile: { select: ['businessName'] }, country: { select: ['id', 'name'] } },
      orderBy: { firstName: 'asc' },
      limit: 500,
    });
    response(ctx, partners.map((partner: any) => ({
      id: partner.id,
      name: partner.partnerProfile?.businessName || [partner.firstName, partner.lastName].filter(Boolean).join(' ') || partner.phoneNumber,
      country: partner.country,
    })));
  },

  async driverVehicles(ctx: any) {
    await assertPermission(ctx, strapi, 'drivers', 'manage');
    const partnerId = ctx.query?.partnerId ? integer(ctx.query.partnerId) : null;
    const countryId = ctx.query?.countryId ? integer(ctx.query.countryId) : null;
    if (ctx.query?.partnerId && !partnerId) fail(ctx, 400, 'partnerId must be a positive integer');
    if (ctx.query?.countryId && !countryId) fail(ctx, 400, 'countryId must be a positive integer');
    const vehicles = await strapi.db.query('api::vehicle.vehicle').findMany({
      where: { assignedDriver: { id: { $null: true } } },
      select: ['id', 'vehicleType', 'numberPlate', 'make', 'model', 'year', 'color', 'seatingCapacity', 'verificationStatus'],
      populate: {
        owner: { select: ['id'], populate: { country: { select: ['id'] } } },
        taxiType: { select: ['id', 'name'] },
      },
      orderBy: { createdAt: 'desc' },
      limit: 500,
    });
    const available = vehicles.filter((vehicle: any) => {
      const ownerId = vehicle.owner?.id == null ? null : Number(vehicle.owner.id);
      if (partnerId ? ownerId !== null && ownerId !== partnerId : ownerId !== null) return false;
      return !countryId || !vehicle.owner?.country?.id || Number(vehicle.owner.country.id) === countryId;
    });
    response(ctx, available);
  },

  async registerDriver(ctx: any) {
    await assertPermission(ctx, strapi, 'drivers', 'manage');
    const data = getData(ctx);
    const phoneNumber = normalizedPhone(ctx, data.phoneNumber);
    const country = await findCountry(strapi, data.countryId);
    if (!country) fail(ctx, 400, 'Select an active country');
    if (!['driver', 'courier'].includes(data.driverType ?? 'driver')) fail(ctx, 400, 'driverType must be driver or courier');
    const driverType = data.driverType ?? 'driver';
    const partnerId = data.partnerId ? integer(data.partnerId) : null;
    let partner: any = null;
    if (partnerId) {
      partner = await strapi.db.query(USER_UID).findOne({
        where: { id: partnerId },
        populate: { partnerProfile: true, country: { select: ['id'] } },
      });
      if (!partner?.partnerProfile || partner.blocked) fail(ctx, 400, 'Select an active partner account');
      if (partner.country?.id && Number(partner.country.id) !== Number(country.id)) {
        fail(ctx, 400, 'The selected partner belongs to a different country');
      }
    }
    const existing = await strapi.db.query(USER_UID).findOne({ where: { phoneNumber }, select: ['id'] });
    if (existing) fail(ctx, 409, 'An account with this phone number already exists');
    const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
    const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : '';
    if (!firstName || !lastName) fail(ctx, 400, 'firstName and lastName are required');
    if (data.password !== undefined && (typeof data.password !== 'string' || data.password.length < 6)) fail(ctx, 400, 'password must be at least 6 characters');
    const existingVehicleId = data.vehicleId === undefined || data.vehicleId === null || data.vehicleId === ''
      ? null
      : integer(data.vehicleId);
    if (data.vehicleId && !existingVehicleId) fail(ctx, 400, 'vehicleId must be a positive integer');
    const existingVehicle = existingVehicleId
      ? await strapi.db.query('api::vehicle.vehicle').findOne({
        where: { id: existingVehicleId },
        populate: {
          owner: { select: ['id'], populate: { country: { select: ['id'] } } },
          assignedDriver: { select: ['id'] },
        },
      })
      : null;
    if (existingVehicleId && !existingVehicle) fail(ctx, 404, 'The selected vehicle was not found');
    if (existingVehicle?.assignedDriver) fail(ctx, 409, 'The selected vehicle is already assigned to a driver');
    const existingVehicleOwnerId = existingVehicle?.owner?.id == null ? null : Number(existingVehicle.owner.id);
    if (existingVehicle && (partnerId ? existingVehicleOwnerId !== null && existingVehicleOwnerId !== partnerId : existingVehicleOwnerId !== null)) {
      fail(ctx, 400, 'The selected vehicle is not available to the selected partner option');
    }
    if (existingVehicle?.owner?.country?.id && Number(existingVehicle.owner.country.id) !== Number(country.id)) {
      fail(ctx, 400, 'The selected vehicle belongs to a different country');
    }
    const vehicleInput = data.vehicle && typeof data.vehicle === 'object' ? data.vehicle : data;
    const requestedVehicleType = existingVehicle?.vehicleType ?? vehicleInput.vehicleType ?? data.vehicleType ?? 'taxi';
    const vehicleData: any = existingVehicle ? {
      vehicleType: existingVehicle.vehicleType === 'motorbike' ? 'motorcycle' : existingVehicle.vehicleType,
      numberPlate: existingVehicle.numberPlate,
      make: existingVehicle.make,
      model: existingVehicle.model,
      year: existingVehicle.year,
      color: existingVehicle.color,
      seatingCapacity: existingVehicle.seatingCapacity,
      insuranceExpiryDate: existingVehicle.insuranceExpiryDate,
    } : {
      vehicleType: requestedVehicleType === 'motorbike' ? 'motorcycle' : requestedVehicleType,
      numberPlate: typeof vehicleInput.numberPlate === 'string' ? vehicleInput.numberPlate.trim().toUpperCase() : '',
      make: typeof vehicleInput.make === 'string' ? vehicleInput.make.trim() : '',
      model: typeof vehicleInput.model === 'string' ? vehicleInput.model.trim() : '',
      ...(Number.isInteger(Number(vehicleInput.year)) ? { year: Number(vehicleInput.year) } : {}),
      ...(typeof vehicleInput.color === 'string' ? { color: vehicleInput.color.trim() } : {}),
      ...(Number.isInteger(Number(vehicleInput.seatingCapacity)) ? { seatingCapacity: Number(vehicleInput.seatingCapacity) } : {}),
      verificationStatus: country.autoApproveDrivers ? 'approved' : 'pending',
      isActive: Boolean(country.autoApproveDrivers),
      ...(vehicleInput.insuranceExpiryDate ? { insuranceExpiryDate: vehicleInput.insuranceExpiryDate } : {}),
    };
    const vehicleTypeOptions = ['taxi', 'bus', 'motorcycle', 'truck'];
    if (!existingVehicle && (!vehicleData.numberPlate || !vehicleData.make || !vehicleData.model)) fail(ctx, 400, 'Vehicle numberPlate, make, and model are required');
    if (!vehicleTypeOptions.includes(vehicleData.vehicleType)) fail(ctx, 400, 'Unsupported vehicleType');
    if (driverType === 'driver' && !['taxi', 'bus', 'motorcycle'].includes(vehicleData.vehicleType)) fail(ctx, 400, 'Normal drivers may use taxi, bus, or motorcycle vehicles');
    if (driverType === 'courier' && !['taxi', 'motorcycle', 'truck'].includes(vehicleData.vehicleType)) fail(ctx, 400, 'Couriers may use taxi, motorcycle, or truck vehicles');
    if (country.requireDriverLicense && (!data.licenseNumber || !data.licenseExpiryDate)) fail(ctx, 400, 'This country requires a driver license number and expiry date');
    if (country.requireNationalId && !data.nationalIdNumber) fail(ctx, 400, 'This country requires a national ID number');
    const plateDuplicate = existingVehicle ? null : await strapi.db.query('api::vehicle.vehicle').findOne({ where: { numberPlate: vehicleData.numberPlate }, select: ['id'] });
    if (plateDuplicate) fail(ctx, 409, 'A vehicle with this number plate already exists');
    const licenseDuplicate = data.licenseNumber ? await strapi.db.query('driver-profiles.driver-profile').findOne({ where: { driverLicenseNumber: data.licenseNumber.trim() }, select: ['id'] }) : null;
    if (licenseDuplicate) fail(ctx, 409, 'A driver with this license number already exists');
    const nationalIdDuplicate = data.nationalIdNumber ? await strapi.db.query('driver-profiles.driver-profile').findOne({ where: { nationalIdNumber: data.nationalIdNumber.trim() }, select: ['id'] }) : null;
    if (nationalIdDuplicate) fail(ctx, 409, 'A driver with this national ID already exists');
    const role = await getAuthenticatedRole(strapi);
    const email = `unset_${phoneNumber.replace(/\D/g, '')}@email.com`;
    const created = await serviceCreateUser(strapi, {
      username: phoneNumber,
      email,
      phoneNumber,
      firstName,
      lastName,
      ...(data.password ? { password: data.password } : {}),
      role: role.id,
      country: country.id,
      ...(partner ? { partner: partner.id } : {}),
      confirmed: true,
      blocked: false,
      phoneVerified: false,
      activeProfile: driverType === 'courier' ? 'delivery' : 'driver',
      profileActivityStatus: { rider: false, driver: driverType === 'driver', delivery: driverType === 'courier', conductor: false },
    });
    const existingProfile = await strapi.db.query(USER_UID).findOne({
      where: { id: created.id }, populate: ['driverProfile'],
    });
    if (!existingProfile?.driverProfile) fail(ctx, 500, 'Driver profile initialization failed');
    const vehicle = existingVehicle
      ? await strapi.db.query('api::vehicle.vehicle').update({
        where: { id: existingVehicle.id },
        data: {
          ...(partner && !existingVehicleOwnerId ? { owner: partner.id } : {}),
          assignedDriver: created.id,
        },
      })
      : await strapi.db.query('api::vehicle.vehicle').create({
        data: { ...vehicleData, owner: created.id, assignedDriver: created.id },
      });
    const requiredDocuments = {
      driverLicense: Boolean(country.requireDriverLicense),
      nationalId: Boolean(country.requireNationalId),
      proofOfAddress: Boolean(country.requireProofOfAddress),
      insurance: Boolean(country.requireInsurance),
      roadTax: Boolean(country.requireRoadTax),
      fitnessDocument: Boolean(country.requireFitnessDocument),
      vehicleRegistration: Boolean(country.requireVehicleRegistration),
    };
    const approved = Boolean(country.autoApproveDrivers);
    const profileData: any = {
      verificationStatus: approved ? 'approved' : 'pending',
      isActive: approved,
      allowedCountries: [country.id],
      floatBalance: Number(country.initialDriverFloat) || 0,
      ...(partner ? { partnerId: partner.partnerProfile.id } : {}),
      driverLicenseNumber: typeof data.licenseNumber === 'string' ? data.licenseNumber.trim() : undefined,
      licenseExpiryDate: data.licenseExpiryDate || undefined,
      nationalIdNumber: typeof data.nationalIdNumber === 'string' ? data.nationalIdNumber.trim() : undefined,
      allowedNegativeBalance: Boolean(country.allowNegativeFloat),
      negativeBalanceLimit: Number(country.negativeFloatLimit) || 0,
      targetRidesForUnlock: Number(country.targetRidesForUnlock) || undefined,
    };
    for (const field of DRIVER_PROFILE_FIELDS) {
      if (field === 'driverLicenseNumber' || field === 'licenseExpiryDate' || field === 'nationalIdNumber') continue;
      if (Object.prototype.hasOwnProperty.call(data, field)) profileData[field] = data[field];
    }
    const driverSubProfile = vehicleData.vehicleType === 'bus'
      ? { key: 'busDriver', field: 'vehicle' }
      : ['motorcycle', 'motorbike'].includes(vehicleData.vehicleType)
        ? { key: 'motorbikeRider', field: 'motorbike' }
        : { key: 'taxiDriver', field: 'vehicle' };
    const rideClasses = (await strapi.db.query('api::ride-class.ride-class').findMany({
      select: ['id', 'isActive'],
      populate: { countries: { populate: { country: { select: ['id'] } } } },
    })).filter((rideClass: any) => isClassVisibleForCountry(rideClass, Number(country.id)));
    const driverProfileUpdate: any = { ...profileData };
    if (driverType === 'driver') {
      driverProfileUpdate.assignedVehicle = vehicle.id;
      driverProfileUpdate.vehicles = { connect: [vehicle.id] };
      driverProfileUpdate.activeSubProfile = vehicleData.vehicleType === 'motorcycle'
        ? 'motorbike' : vehicleData.vehicleType === 'bus' ? 'bus' : 'taxi';
      driverProfileUpdate.acceptedRideClasses = { connect: rideClasses.map((item: any) => item.id) };
      driverProfileUpdate[driverSubProfile.key] = { [driverSubProfile.field]: vehicle.id, isActive: true };
    }
    const profileUpdate: any = {
      driverProfile: driverProfileUpdate,
      initialFloatToppedUp: Number(country.initialDriverFloat) > 0,
      address: typeof data.address === 'string' ? data.address.trim() : undefined,
    };
    if (driverType === 'courier') {
      const current = await strapi.db.query(USER_UID).findOne({
        where: { id: created.id }, populate: ['deliveryProfile'],
      });
      const deliveryVehicleType = vehicleData.vehicleType === 'motorcycle' ? 'motorbike' : vehicleData.vehicleType;
      if (!['taxi', 'motorbike', 'truck'].includes(deliveryVehicleType)) fail(ctx, 400, 'Courier vehicle type must be taxi, motorbike, or truck');
      profileUpdate.deliveryProfile = {
        ...(current?.deliveryProfile ?? {}),
        verificationStatus: country.autoApproveDeliverers ? 'approved' : 'pending',
        isActive: Boolean(country.autoApproveDeliverers),
        activeVehicleType: deliveryVehicleType,
        [deliveryVehicleType]: { vehicle: vehicle.id, isActive: true },
      };
      profileUpdate.initialDelivererFloatToppedUp = Number(country.initialDelivererFloat) > 0;
    }
    const updated = await updateUserProfiles(strapi, existingProfile, profileUpdate);
    if (partner) {
      await strapi.db.query('partner-profile.partner-profile').update({
        where: { id: partner.partnerProfile.id },
        data: { totalDrivers: (Number(partner.partnerProfile.totalDrivers) || 0) + 1 },
      });
    }
    const result = await strapi.db.query(USER_UID).findOne({
      where: { id: updated.id }, populate: ['country', 'partner', 'driverProfile', 'deliveryProfile', 'vehicles'],
    });
    response(ctx, { user: safeUser(result), requiredDocuments });
  },

  async addDriverFloat(ctx: any) {
    await assertPermission(ctx, strapi, 'drivers', 'manage');
    const driverId = integer(ctx.params.id);
    if (!driverId) fail(ctx, 400, 'A valid driver ID is required');
    const data = getData(ctx);
    if (Object.keys(data).some((key) => !['amount', 'debitPartner'].includes(key))) {
      fail(ctx, 400, 'Only amount and debitPartner are accepted');
    }
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      fail(ctx, 400, 'Float amount must be greater than zero and no more than 1,000,000');
    }
    if (data.debitPartner !== undefined && typeof data.debitPartner !== 'boolean') {
      fail(ctx, 400, 'debitPartner must be a boolean');
    }
    const driver = await strapi.db.query(USER_UID).findOne({
      where: { id: driverId, driverProfile: { id: { $notNull: true } } },
      select: ['id', 'firstName', 'lastName'],
      populate: {
        driverProfile: { select: ['id', 'floatBalance', 'withdrawableFloatBalance'] },
        partner: { select: ['id'], populate: { partnerProfile: { select: ['id', 'floatBalance', 'businessName'] } } },
      },
    });
    if (!driver?.driverProfile) fail(ctx, 404, 'Driver profile not found');
    const debitPartner = data.debitPartner === true;
    const partnerProfile = driver.partner?.partnerProfile;
    if (debitPartner && !partnerProfile) fail(ctx, 400, 'This driver has no partner account to debit');

    const driverBalance = Number(driver.driverProfile.floatBalance) || 0;
    const nextDriverBalance = driverBalance + amount;
    const withdrawableBalance = Number(driver.driverProfile.withdrawableFloatBalance) || 0;
    const partnerBalance = Number(partnerProfile?.floatBalance) || 0;
    if (debitPartner && partnerBalance < amount) {
      fail(ctx, 400, `Insufficient partner float balance. Available: K${partnerBalance.toFixed(2)}`);
    }
    const nextPartnerBalance = partnerBalance - amount;
    let partnerUpdated = false;
    let driverUpdated = false;
    try {
      if (debitPartner) {
        await strapi.db.query('partner-profile.partner-profile').update({
          where: { id: partnerProfile.id },
          data: { floatBalance: nextPartnerBalance },
        });
        partnerUpdated = true;
      }
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: driver.driverProfile.id },
        data: {
          floatBalance: nextDriverBalance,
          withdrawableFloatBalance: withdrawableBalance + amount,
        },
      });
      driverUpdated = true;
      const actor = await currentAdmin(ctx, strapi);
      await strapi.db.query('api::ledger-entry.ledger-entry').create({
        data: {
          entryId: `LE-ADMIN-${Date.now()}-${driverId}`,
          driver: driverId,
          type: debitPartner ? 'float_topup-partner' : 'adjustment',
          amount,
          source: debitPartner ? 'partner' : 'system',
          ledgerStatus: 'settled',
          balanceBefore: driverBalance,
          balanceAfter: nextDriverBalance,
          description: debitPartner
            ? `Admin credited driver float; debited partner ${partnerProfile.businessName || driver.partner.id}`
            : `Admin float adjustment by ${actor.email}`,
        },
      });
    } catch (error) {
      if (driverUpdated) {
        try {
          await strapi.db.query('driver-profiles.driver-profile').update({
            where: { id: driver.driverProfile.id },
            data: { floatBalance: driverBalance, withdrawableFloatBalance: withdrawableBalance },
          });
        } catch (rollbackError) {
          strapi.log.error('[admn:addDriverFloat] Driver balance rollback failed', rollbackError);
        }
      }
      if (partnerUpdated) {
        try {
          await strapi.db.query('partner-profile.partner-profile').update({
            where: { id: partnerProfile.id },
            data: { floatBalance: partnerBalance },
          });
        } catch (rollbackError) {
          strapi.log.error('[admn:addDriverFloat] Partner balance rollback failed', rollbackError);
        }
      }
      throw error;
    }
    response(ctx, {
      driverId,
      floatBalance: nextDriverBalance,
      withdrawableFloatBalance: withdrawableBalance + amount,
      partnerFloatBalance: debitPartner ? nextPartnerBalance : undefined,
    });
  },

  async updateDriver(ctx: any) {
    await assertPermission(ctx, strapi, 'drivers', 'manage');
    const driverId = integer(ctx.params.id);
    if (!driverId) fail(ctx, 400, 'A valid driver ID is required');
    const data = getData(ctx);
    const allowed = ['firstName', 'lastName', 'address', 'partnerId', 'vehicle'];
    const invalid = Object.keys(data).filter((key) => !allowed.includes(key));
    if (invalid.length) fail(ctx, 400, `Unsupported field(s): ${invalid.join(', ')}`);
    const current = await strapi.db.query(USER_UID).findOne({
      where: { id: driverId, driverProfile: { id: { $notNull: true } } },
      select: ['id', 'firstName', 'lastName', 'address'],
      populate: {
        partner: { select: ['id'], populate: { partnerProfile: { select: ['id', 'totalDrivers'] } } },
        driverProfile: { select: ['id', 'partnerId'] },
        country: { select: ['id'] },
      },
    });
    if (!current?.driverProfile) fail(ctx, 404, 'Driver profile not found');
    const nextPartnerId = data.partnerId === null || data.partnerId === '' ? null : integer(data.partnerId);
    if (data.partnerId !== undefined && data.partnerId !== null && data.partnerId !== '' && !nextPartnerId) {
      fail(ctx, 400, 'partnerId must be a valid partner user ID or null');
    }
    const nextPartner = nextPartnerId ? await strapi.db.query(USER_UID).findOne({
      where: { id: nextPartnerId, blocked: false },
      select: ['id'],
      populate: { partnerProfile: { select: ['id', 'totalDrivers'] }, country: { select: ['id'] } },
    }) : null;
    if (nextPartnerId && !nextPartner?.partnerProfile) fail(ctx, 400, 'Select an active partner account');
    if (nextPartnerId && nextPartner?.country?.id && current.country?.id && Number(nextPartner.country.id) !== Number(current.country.id)) {
      fail(ctx, 400, 'The selected partner belongs to a different country');
    }
    const vehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
      where: { assignedDriver: driverId },
      select: ['id', 'numberPlate', 'make', 'model', 'year', 'color', 'insuranceExpiryDate'],
    });
    const vehicleInput = data.vehicle;
    if (vehicleInput !== undefined) {
      if (!vehicleInput || typeof vehicleInput !== 'object' || Array.isArray(vehicleInput)) fail(ctx, 400, 'vehicle must be an object');
      const vehicleFields = ['numberPlate', 'make', 'model', 'year', 'color', 'insuranceExpiryDate'];
      if (Object.keys(vehicleInput).some((key) => !vehicleFields.includes(key))) fail(ctx, 400, 'Unsupported vehicle field');
      const vehicleData: any = {};
      if (vehicleInput.numberPlate !== undefined) {
        if (typeof vehicleInput.numberPlate !== 'string' || !vehicleInput.numberPlate.trim()) fail(ctx, 400, 'Vehicle numberPlate is required');
        vehicleData.numberPlate = vehicleInput.numberPlate.trim().toUpperCase();
      }
      for (const key of ['make', 'model', 'color', 'insuranceExpiryDate']) {
        if (vehicleInput[key] !== undefined) vehicleData[key] = vehicleInput[key];
      }
      if (vehicleInput.year !== undefined) {
        const year = Number(vehicleInput.year);
        if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) fail(ctx, 400, 'Vehicle year is invalid');
        vehicleData.year = year;
      }
      if (!vehicle) fail(ctx, 404, 'Assigned vehicle not found');
      await strapi.db.query('api::vehicle.vehicle').update({ where: { id: vehicle.id }, data: vehicleData });
    }
    const userData: any = {};
    for (const field of ['firstName', 'lastName', 'address']) {
      if (data[field] !== undefined) userData[field] = data[field];
    }
    if (data.partnerId !== undefined) userData.partner = nextPartnerId;
    const profileData: any = {
      ...current.driverProfile,
      ...(data.partnerId !== undefined ? { partnerId: nextPartner?.partnerProfile?.id ?? null } : {}),
    };
    if (Object.keys(userData).length || data.partnerId !== undefined) {
      await updateUserProfiles(strapi, current, { ...userData, driverProfile: profileData });
    }
    const oldPartner = current.partner;
    if (data.partnerId !== undefined && Number(oldPartner?.id ?? 0) !== Number(nextPartner?.id ?? 0)) {
      if (oldPartner?.partnerProfile?.id) {
        await strapi.db.query('partner-profile.partner-profile').update({
          where: { id: oldPartner.partnerProfile.id },
          data: { totalDrivers: Math.max(0, (Number(oldPartner.partnerProfile.totalDrivers) || 0) - 1) },
        });
      }
      if (nextPartner?.partnerProfile?.id) {
        await strapi.db.query('partner-profile.partner-profile').update({
          where: { id: nextPartner.partnerProfile.id },
          data: { totalDrivers: (Number(nextPartner.partnerProfile.totalDrivers) || 0) + 1 },
        });
      }
    }
    const updated = await strapi.db.query(USER_UID).findOne({
      where: { id: driverId }, populate: ['country', 'partner', 'driverProfile', 'vehicles'],
    });
    response(ctx, safeUser(updated));
  },

  async uploadDriverDocument(ctx: any) {
    await assertPermission(ctx, strapi, 'drivers', 'manage');
    const userId = integer(ctx.params.id);
    if (!userId) fail(ctx, 400, 'A valid driver user ID is required');
    const field = ctx.request.body?.field;
    const allowedVehicleFields = ['registrationDocument', 'insuranceCertificate', 'roadTaxCertificate', 'fitnessDocument'];
    if (!PHONE_FIELDS.includes(field) && !allowedVehicleFields.includes(field) && field !== 'profilePicture') fail(ctx, 400, 'Unsupported driver document field');
    const file = ctx.request.files?.file ?? ctx.request.file;
    if (!file) fail(ctx, 400, 'A multipart file named file is required');
    const size = Number(file.size ?? 0);
    const mime = String(file.type ?? file.mimetype ?? '');
    if (!size || size > 10 * 1024 * 1024) fail(ctx, 400, 'Document must be no larger than 10 MB');
    const allowedMimes = field === 'profilePicture'
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(mime)) fail(ctx, 400, 'Document file type is not allowed');
    const user = await strapi.db.query(USER_UID).findOne({ where: { id: userId }, select: ['id'], populate: ['driverProfile'] });
    if (!user || !user.driverProfile) fail(ctx, 404, 'Driver profile not found');
    const assignedVehicle = allowedVehicleFields.includes(field)
      ? await strapi.db.query('api::vehicle.vehicle').findOne({
        where: { assignedDriver: { id: userId } },
        select: ['id'],
      })
      : null;
    if (allowedVehicleFields.includes(field) && !assignedVehicle) fail(ctx, 403, 'The driver does not own the assigned vehicle');
    const uploadResult = await strapi.plugin('upload').service('upload').upload({ data: {}, files: file });
    const uploaded = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
    if (!uploaded?.id) fail(ctx, 500, 'Document upload failed');
    if (field === 'profilePicture') {
      await strapi.db.query(USER_UID).update({ where: { id: userId }, data: { profilePicture: uploaded.id } });
    } else if (PHONE_FIELDS.includes(field)) {
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id }, data: { [field]: uploaded.id },
      });
    } else {
      await strapi.db.query('api::vehicle.vehicle').update({ where: { id: assignedVehicle.id }, data: { [field]: uploaded.id } });
    }
    response(ctx, { id: uploaded.id, name: uploaded.name, mime: uploaded.mime, size: uploaded.size, url: uploaded.url });
  },

  async registerRider(ctx: any) {
    await assertPermission(ctx, strapi, 'riders', 'manage');
    const data = getData(ctx);
    if (Object.keys(data).some((key) => !['phoneNumber', 'countryId'].includes(key))) fail(ctx, 400, 'Only phoneNumber and countryId are accepted');
    const phoneNumber = normalizedPhone(ctx, data.phoneNumber);
    const country = await findCountry(strapi, data.countryId);
    if (!country) fail(ctx, 400, 'Select an active country');
    const duplicate = await strapi.db.query(USER_UID).findOne({ where: { phoneNumber }, select: ['id'] });
    if (duplicate) fail(ctx, 409, 'An account with this phone number already exists');
    const role = await getAuthenticatedRole(strapi);
    const created = await serviceCreateUser(strapi, {
      username: phoneNumber,
      email: `unset_${phoneNumber.replace(/\D/g, '')}@email.com`,
      phoneNumber,
      role: role.id,
      country: country.id,
      confirmed: true,
      blocked: false,
      phoneVerified: false,
      activeProfile: 'rider',
      profileActivityStatus: { rider: true, driver: false, delivery: false, conductor: false },
    });
    const current = await strapi.db.query(USER_UID).findOne({ where: { id: created.id }, populate: ['riderProfile'] });
    if (!current?.riderProfile) fail(ctx, 500, 'Rider profile initialization failed');
    const updated = await updateUserProfiles(strapi, current, { riderProfile: { ...current.riderProfile, isActive: true } });
    const result = await strapi.db.query(USER_UID).findOne({ where: { id: updated.id }, populate: ['country', 'riderProfile'] });
    response(ctx, safeUser(result));
  },

  async getCountrySettings(ctx: any) {
    await assertPermission(ctx, strapi, 'countries', 'view');
    const id = integer(ctx.params.id);
    if (!id) fail(ctx, 400, 'A valid country ID is required');
    const country = await strapi.db.query(COUNTRY_UID).findOne({ where: { id } });
    if (!country) fail(ctx, 404, 'Country not found');
    const fields = getCountryAttributeFields(strapi).map((field) => ({ ...field, value: country[field.key] ?? field.value }));
    response(ctx, { fields });
  },

  async updateCountrySettings(ctx: any) {
    await assertPermission(ctx, strapi, 'countries', 'manage');
    const id = integer(ctx.params.id);
    if (!id) fail(ctx, 400, 'A valid country ID is required');
    const country = await strapi.db.query(COUNTRY_UID).findOne({ where: { id }, select: ['id'] });
    if (!country) fail(ctx, 404, 'Country not found');
    const data = getData(ctx);
    const fields = getCountryAttributeFields(strapi);
    const keys = Object.keys(data);
    if (!keys.length) fail(ctx, 400, 'At least one country setting is required');
    const safeData: any = {};
    for (const key of keys) {
      const field = fields.find((item) => item.key === key);
      const attribute = strapi.contentTypes[COUNTRY_UID]?.attributes?.[key];
      if (!field || !attribute) fail(ctx, 400, `Country field "${key}" cannot be edited here`);
      safeData[key] = validateCountryValue(ctx, attribute, data[key]);
    }
    await strapi.db.query(COUNTRY_UID).update({ where: { id }, data: safeData });
    const updated = await strapi.db.query(COUNTRY_UID).findOne({ where: { id } });
    response(ctx, Object.fromEntries(keys.map((key) => [key, updated[key]])));
  },

  async listPartners(ctx: any) {
    await assertPermission(ctx, strapi, 'partners', 'view');
    const { page, pageSize, start } = pagination(ctx);
    const countryFilter = integer(ctx.query?.filters?.countryId?.$eq ?? ctx.query?.countryId);
    const query: any = { partnerProfile: { id: { $notNull: true } } };
    if (countryFilter) query.country = { id: countryFilter };
    const [rows, total] = await Promise.all([
      strapi.db.query(USER_UID).findMany({
        where: query,
        select: ['id', 'documentId', 'username', 'email', 'phoneNumber', 'firstName', 'lastName', 'blocked', 'createdAt', 'updatedAt'],
        populate: { partnerProfile: true, country: { select: ['id', 'name', 'code'] } },
        orderBy: { createdAt: 'desc' }, limit: pageSize, offset: start,
      }),
      strapi.db.query(USER_UID).count({ where: query }),
    ]);
    response(ctx, rows.map(safeUser), { pagination: { page, pageSize, pageCount: Math.ceil(total / pageSize), total } });
  },

  async updatePartnerStatus(ctx: any) {
    await assertPermission(ctx, strapi, 'partners', 'manage');
    const id = integer(ctx.params.id);
    if (!id) fail(ctx, 400, 'A valid partner user ID is required');
    const data = getData(ctx);
    if (!['approved', 'rejected'].includes(data.status)) fail(ctx, 400, 'status must be approved or rejected');
    const user = await strapi.db.query(USER_UID).findOne({ where: { id }, populate: ['partnerProfile'] });
    if (!user?.partnerProfile) fail(ctx, 404, 'Partner profile not found');
    const statusData: any = { verificationStatus: data.status };
    if (data.status === 'approved') statusData.approvedAt = new Date();
    if (typeof data.notes === 'string') statusData.verificationNotes = data.notes.slice(0, 5000);
    const updated = await updateUserProfiles(strapi, user, { partnerProfile: { ...user.partnerProfile, ...statusData } });
    response(ctx, safeUser(updated));
  },

  async listResource(ctx: any) {
    const { name, definition } = resourceFor(ctx);
    let category = definition.category;
    const rawFilters = unwrapQuery(ctx.query?.filters);
    if (name === 'users') {
      if (rawFilters?.driverProfile) category = 'drivers';
      else if (rawFilters?.deliveryProfile) category = 'drivers';
      else if (rawFilters?.riderProfile) category = 'riders';
      else if (rawFilters?.affiliateProfile) category = 'affiliates';
    }
    await assertPermission(ctx, strapi, category, 'view');
    if (definition.single) {
      const record = await strapi.db.query(definition.uid).findOne({
        select: getSelectableFields(definition, strapi),
        populate: definition.populate,
      });
      response(ctx, record);
      return;
    }
    const { page, pageSize, start } = pagination(ctx);
    const countryFilter = integer(
      rawFilters?.countryId && typeof rawFilters.countryId === 'object'
        ? rawFilters.countryId.$eq
        : rawFilters?.countryId,
    );
    const filters = sanitizeFilterNode(rawFilters, definition.filters.length ? definition.filters : getSelectableFields(definition, strapi));
    const where = filters ?? {};
    delete where.countryId;
    if (name === 'affiliate-promotions') where.isDefault = false;
    if (countryFilter && name === 'rides') {
      where.$or = [
        { rider: { country: { id: countryFilter } } },
        { driver: { country: { id: countryFilter } } },
      ];
    } else if (countryFilter && name === 'deliveries') {
      where.$or = [
        { sender: { country: { id: countryFilter } } },
        { deliverer: { country: { id: countryFilter } } },
      ];
    } else if (countryFilter && name === 'driver-subscriptions') {
      where.driver = { country: { id: countryFilter } };
    } else if (countryFilter && name === 'transactions') {
      where.user = { country: { id: countryFilter } };
    } else if (countryFilter && name === 'ledger-entries') {
      where.driver = { country: { id: countryFilter } };
    } else if (countryFilter && name === 'ride-classes') {
      where.countries = { country: { id: countryFilter } };
    } else if (countryFilter && name === 'affiliate-points-allocation-rules') {
      where.countries = { id: countryFilter };
    } else if (countryFilter && name === 'float-topups') {
      where.$or = [
        { driver: { country: { id: countryFilter } } },
        { partner: { country: { id: countryFilter } } },
      ];
    } else if (countryFilter && name === 'packages') {
      where.sender = { country: { id: countryFilter } };
    } else if (countryFilter && name === 'support-tickets') {
      where.user = { country: { id: countryFilter } };
    } else if (countryFilter && name === 'vehicles') {
      where.owner = { country: { id: countryFilter } };
    } else if (countryFilter && name === 'affiliate-coupons') {
      where.affiliateOwner = { country: { id: countryFilter } };
    } else if (countryFilter && name === 'affiliate-promotions') {
      where.countries = { id: countryFilter };
    } else if (countryFilter && name === 'affiliate-transactions') {
      where.affiliate = { country: { id: countryFilter } };
    } else if (countryFilter && name === 'affiliate-points-conversions') {
      where.country = { id: countryFilter };
    }
    const populate = definition.populate;
    const orderBy = name === 'users' && category === 'affiliates'
      ? { affiliateProfile: { totalPoints: 'desc' } }
      : safeSort(ctx, definition, strapi).length ? safeSort(ctx, definition, strapi) : { createdAt: 'desc' };
    const [rows, total] = await Promise.all([
      strapi.db.query(definition.uid).findMany({
        select: getSelectableFields(definition, strapi),
        where,
        populate,
        orderBy,
        limit: pageSize, offset: start,
      }),
      strapi.db.query(definition.uid).count({ where }),
    ]);
    response(ctx, rows.map((record: any) => safeResource(name, definition, record)), {
      pagination: { page, pageSize, pageCount: Math.ceil(total / pageSize), total },
    });
  },

  async getResource(ctx: any) {
    const { name, definition } = resourceFor(ctx);
    let category = definition.category;
    if (name === 'users') {
      const query = ctx.query?.populate;
      if (query?.driverProfile || String(query ?? '').includes('driverProfile')) category = 'drivers';
      else if (query?.riderProfile || String(query ?? '').includes('riderProfile')) category = 'riders';
    }
    await assertPermission(ctx, strapi, category, 'view');
    const id = integer(ctx.params.id);
    if (!id) fail(ctx, 400, 'A valid resource ID is required');
    const record = await strapi.db.query(definition.uid).findOne({
      where: { id },
      select: getSelectableFields(definition, strapi),
      populate: definition.populate,
    });
    if (!record) fail(ctx, 404, 'Resource not found');
    response(ctx, safeResource(name, definition, record));
  },

  async createResource(ctx: any) {
    const { name, definition } = resourceFor(ctx);
    await assertPermission(ctx, strapi, definition.category, 'manage');
    const data = getData(ctx);
    if (name === 'affiliates') fail(ctx, 405, 'Affiliate accounts are created through rider or driver registration');
    if (definition.single) {
      fail(ctx, 405, 'Single-type settings may be updated but not created');
    }
    if (name === 'users') {
      const phoneNumber = normalizedPhone(ctx, data.phoneNumber);
      const duplicate = await strapi.db.query(USER_UID).findOne({ where: { phoneNumber }, select: ['id'] });
      if (duplicate) fail(ctx, 409, 'An account with this phone number already exists');
      const role = await getAuthenticatedRole(strapi);
      const created = await serviceCreateUser(strapi, {
        username: phoneNumber,
        email: typeof data.email === 'string' ? data.email : `unset_${phoneNumber.replace(/\D/g, '')}@email.com`,
        phoneNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        role: role.id,
        confirmed: true,
        blocked: Boolean(data.blocked),
        ...(data.password ? { password: data.password } : {}),
      });
      const user = await strapi.db.query(USER_UID).findOne({ where: { id: created.id }, populate: ['country', 'riderProfile'] });
      response(ctx, safeUser(user));
      return;
    }
    assertDefinedResourceFields(ctx, data, definition, strapi);
    const payload = allowedResourceData(data, definition, strapi);
    if (!payload || Object.keys(payload).length === 0) fail(ctx, 400, 'A resource payload is required');
    const created = await strapi.db.query(definition.uid).create({ data: payload, populate: definition.populate });
    response(ctx, safeResource(name, definition, created));
  },

  async updateResource(ctx: any) {
    const { name, definition } = resourceFor(ctx);
    const data = getData(ctx);
    let category = definition.category;
    let payload: any;
    if (name === 'users' || name === 'affiliates') {
      const filtered = filteredUsersData(ctx, data);
      category = name === 'affiliates' ? 'affiliates' : filtered.category;
      payload = filtered.data;
    } else {
      assertDefinedResourceFields(ctx, data, definition, strapi);
      payload = allowedResourceData(data, definition, strapi);
    }
    await assertPermission(ctx, strapi, category, 'manage');
    const id = integer(ctx.params.id);
    if (!id) fail(ctx, 400, 'A valid resource ID is required');
    if (definition.single) {
      const current = await strapi.db.query(definition.uid).findOne({});
      if (!current) fail(ctx, 404, 'Settings record not found');
      const updated = await strapi.db.query(definition.uid).update({ where: { id: current.id }, data: payload, populate: definition.populate });
      response(ctx, updated);
      return;
    }
    if (name === 'users' || name === 'affiliates') {
      const user = await strapi.db.query(USER_UID).findOne({ where: { id }, populate: ['driverProfile', 'riderProfile', 'affiliateProfile'] });
      if (!user) fail(ctx, 404, 'User not found');
      for (const profileName of ['driverProfile', 'riderProfile', 'affiliateProfile']) {
        if (payload[profileName] && user[profileName]) payload[profileName] = { ...user[profileName], ...payload[profileName] };
      }
      const updated = await updateUserProfiles(strapi, user, payload);
      response(ctx, safeUser(updated));
      return;
    }
    const exists = await strapi.db.query(definition.uid).findOne({ where: { id }, select: ['id'] });
    if (!exists) fail(ctx, 404, 'Resource not found');
    const updated = await strapi.db.query(definition.uid).update({ where: { id }, data: payload, populate: definition.populate });
    response(ctx, safeResource(name, definition, updated));
  },

  async deleteResource(ctx: any) {
    fail(ctx, 405, 'Deleting records is not available through the admin application');
  },
});

export default controller;
