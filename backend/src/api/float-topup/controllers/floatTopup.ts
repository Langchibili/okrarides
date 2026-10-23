import { factories } from '@strapi/strapi';
import { resolveSettingsForUser } from '../../../services/settingsResolver';

export default factories.createCoreController('api::float-topup.float-topup', ({ strapi }) => ({
  async create(ctx) {
    const userId = ctx.state.user?.id;
    if (!userId) return ctx.unauthorized();

    const settings = await resolveSettingsForUser(strapi, Number(userId));
    if (settings?.allowOrdersWithoutPartner !== true) {
      return ctx.forbidden('To top up your float balance, contact your partner company.');
    }

    return super.create(ctx);
  },
}));
