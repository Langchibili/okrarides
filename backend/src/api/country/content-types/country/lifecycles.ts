const ADMIN_SETTINGS_UID = 'api::admn-setting.admn-setting';

function getSettingFields(): Set<string> {
  return new Set(Object.keys(strapi.contentTypes[ADMIN_SETTINGS_UID]?.attributes ?? {}));
}

function valuesEqual(left: any, right: any): boolean {
  const isNumeric = (value: any) =>
    typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
  if (isNumeric(left) && isNumeric(right) && Number.isFinite(Number(left)) && Number.isFinite(Number(right))) {
    return Number(left) === Number(right);
  }
  return JSON.stringify(left) === JSON.stringify(right);
}

function updateSettingsOverrides(
  data: Record<string, any>,
  current: string[] = [],
  existing?: Record<string, any>,
): string[] {
  const overrides = new Set(current);
  const settingFields = getSettingFields();

  for (const field of Object.keys(data)) {
    if (!settingFields.has(field)) continue;
    if (existing && valuesEqual(data[field], existing[field])) continue;
    if (data[field] === null || data[field] === undefined) overrides.delete(field);
    else overrides.add(field);
  }

  return [...overrides];
}

export default {
  beforeCreate(event) {
    const { data } = event.params;
    data.settingsOverrides = updateSettingsOverrides(data);
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    const country = await strapi.db.query('api::country.country').findOne({
      where,
    });
    data.settingsOverrides = updateSettingsOverrides(
      data,
      country?.settingsOverrides ?? [],
      country,
    );
  },
};
