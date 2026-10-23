import { factories } from '@strapi/strapi';
import { resolveSettingsForCountry } from '../../../services/settingsResolver';

export default factories.createCoreController('api::admn-setting.admn-setting', () => ({
  async resolve(ctx) {
    try {
      const queryCountryId = Number(ctx.query.countryId) || null;
      const user = ctx.state.user?.id
        ? await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: ctx.state.user.id },
            populate: { country: true },
          })
        : null;
      const countryId = user?.country?.id ?? queryCountryId;
      const countryCode = countryId ? null : String(ctx.query.countryCode ?? '') || null;
      const countryName = countryId || countryCode ? null : String(ctx.query.countryName ?? '') || null;
      const settings = await resolveSettingsForCountry(strapi, countryId, countryCode, countryName);
      const { overideOtpCode, ...clientSettings } = settings;
      return ctx.send({ data: clientSettings });
    } catch (error) {
      strapi.log.error('[AdminSettings:resolve]', error);
      return ctx.internalServerError('Failed to resolve country settings');
    }
  },
}));
