import { factories } from '@strapi/strapi';
import { resolveSettingsForUser } from '../../../services/settingsResolver';
import { getPartnerCommissionBalance } from '../../../services/partner-commission';

export default factories.createCoreController('api::float-topup.float-topup', ({ strapi }) => ({
  async create(ctx) {
    const userId = ctx.state.user?.id;
    if (!userId) return ctx.unauthorized();

    const settings = await resolveSettingsForUser(strapi, Number(userId));
    const data = ctx.request.body?.data ?? ctx.request.body ?? {};
    if (data.partner != null) {
      if (Number(data.partner) !== Number(userId)) {
        return ctx.forbidden('You can only request float for your own partner account.');
      }
      const balance = await getPartnerCommissionBalance(strapi, Number(userId));
      if (balance.amountOwedToOkra > 0) {
        return ctx.forbidden(
          `Pay the outstanding commission of ${balance.currency?.symbol || balance.currency?.code || ''}` +
          `${balance.amountOwedToOkra.toFixed(2)} before requesting more float.`,
        );
      }
    }
    if (data.partner == null && settings?.allowOrdersWithoutPartner !== true) {
      return ctx.forbidden('To top up your float balance, contact your partner company.');
    }

    return super.create(ctx);
  },
}));
