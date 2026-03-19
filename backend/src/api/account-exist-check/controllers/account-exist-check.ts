// src/api/account-exist-check/controllers/account-exist-check.ts

'use strict';

export default {
  async checkUser(ctx) {
    try {
      const { username } = ctx.request.body as { username?: string };

      if (!username) {
        return ctx.badRequest('username is required');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { username },
        select: ['id'],
      });

      return ctx.send({
        userExists: !!user,
      });

    } catch (error) {
      strapi.log.error('checkUser error:', error);
      return ctx.internalServerError('Failed to check user');
    }
  },
};