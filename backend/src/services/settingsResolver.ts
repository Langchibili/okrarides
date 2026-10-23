import legacyCountrySettingDefaults from './countrySettingDefaults.json';

const ADMIN_SETTINGS_UID = 'api::admn-setting.admn-setting';
const COUNTRY_UID = 'api::country.country';

function matchesSettingDefault(value: any, defaultValue: any): boolean {
  if (
    (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
    (typeof defaultValue === 'number' || (typeof defaultValue === 'string' && defaultValue.trim() !== '')) &&
    Number.isFinite(Number(value)) &&
    Number.isFinite(Number(defaultValue))
  ) {
    return Number(value) === Number(defaultValue);
  }
  return value === defaultValue;
}

export async function resolveSettingsForCountry(
  strapi: any,
  countryId?: number | null,
  countryCode?: string | null,
  countryName?: string | null,
): Promise<Record<string, any>> {
  const [adminSettings, country] = await Promise.all([
    strapi.db.query(ADMIN_SETTINGS_UID).findOne({
      populate: {
        defaultCurrency: true,
        driverOrderRequestRingtone: true,
      },
    }),
    countryId || countryCode || countryName
      ? strapi.db.query(COUNTRY_UID).findOne({
          where: countryId ? { id: countryId } : countryCode ? { code: countryCode } : { name: countryName },
          populate: {
            currency: true,
            defaultCurrency: true,
            driverOrderRequestRingtone: true,
            affiliatePointsConversion: { populate: { currency: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  const resolved: Record<string, any> = {};
  const attributes = strapi.contentTypes[ADMIN_SETTINGS_UID]?.attributes ?? {};
  const countryAttributes = strapi.contentTypes[COUNTRY_UID]?.attributes ?? {};
  const countryOverrides = new Set<string>(country?.settingsOverrides ?? []);
  const countryIsActive = country?.isActive === true;

  for (const field of Object.keys(attributes)) {
    const countryValue = country?.[field];
    const legacyDefault = countryAttributes[field]?.default ?? legacyCountrySettingDefaults[field];
    const hasCountryOverride = countryOverrides.has(field) ||
      (countryValue !== null && countryValue !== undefined &&
        !matchesSettingDefault(countryValue, legacyDefault));
    const overrideValue = countryIsActive && hasCountryOverride ? countryValue : null;
    resolved[field] = overrideValue !== null && overrideValue !== undefined
      ? overrideValue
      : adminSettings?.[field] ?? null;
  }

  const conversion = countryIsActive ? country?.affiliatePointsConversion : null;
  const activeConversion = conversion?.publishedAt ? conversion : null;
  const currency = activeConversion?.currency ?? country?.currency ?? adminSettings?.defaultCurrency ?? null;
  resolved.defaultCurrency = countryIsActive
    ? country?.defaultCurrency ?? country?.currency ?? adminSettings?.defaultCurrency ?? null
    : adminSettings?.defaultCurrency ?? null;
  resolved._country = country
    ? { id: country.id, code: country.code, name: country.name, isActive: country.isActive }
    : null;
  resolved._affiliatePointsConversion = activeConversion
    ? {
        affiliatePoints: activeConversion.affiliatePoints,
        currencyAmount: activeConversion.currencyAmount,
        currency: activeConversion.currency,
      }
    : null;
  resolved._userCurrency = currency;
  resolved._userCurrencyCode = currency?.code ?? currency?.currCode ?? null;
  resolved._userCurrencySymbol = currency?.symbol ?? null;
  resolved._settingsSource = countryIsActive ? 'country-with-admin-fallback' : 'admin';
  resolved.floatSystemEnabled = ['float_based', 'hybrid'].includes(resolved.paymentSystemType);
  resolved.subscriptionSystemEnabled = ['subscription_based', 'hybrid'].includes(resolved.paymentSystemType);

  return resolved;
}

export async function resolveSettingsForUser(strapi: any, userId?: number | null): Promise<Record<string, any>> {
  if (!userId) return resolveSettingsForCountry(strapi);
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    select: ['id'],
    populate: { country: true },
  });
  return resolveSettingsForCountry(strapi, user?.country?.id);
}
