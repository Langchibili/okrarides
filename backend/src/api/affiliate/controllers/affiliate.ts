import { factories } from '@strapi/strapi';

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  async getByCode(ctx) {
    const { code } = ctx.params;

    if (!code) {
      return ctx.badRequest('Affiliate code is required');
    }

    try {
      // Find the user where the nested component attribute matches
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: {
          affiliateProfile: {
            affiliateCode: code,
          },
        },
        // Populate the specific component and the QR code media
        populate: {
          affiliateProfile: {
            populate: ['qrCode']
          }
        },
        // Select only the public info you want to expose
        select: ['id', 'username', 'firstName', 'lastName'],
      });

      if (!user) {
        return ctx.notFound('Affiliate user not found');
      }

      // Return the user with their affiliate data
      return ctx.send({
        data: user
      });
    } catch (err) {
      ctx.body = err;
    }
  },
}));