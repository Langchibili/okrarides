//============================================
// src/api/finance/controllers/finance.ts
//============================================
import { factories } from '@strapi/strapi';

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  
  // Get float balance
  async getFloatBalance(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      return ctx.send({
        floatBalance: user.driverProfile.floatBalance || 0,
        floatLimit: user.driverProfile.floatLimit || 0,
        allowedNegativeBalance: user.driverProfile.allowedNegativeBalance || false,
        negativeBalanceLimit: user.driverProfile.negativeBalanceLimit || 0,
        currentBalance: user.driverProfile.currentBalance || 0,
        pendingWithdrawal: user.driverProfile.pendingWithdrawal || 0,
      });
    } catch (error) {
      strapi.log.error('Get float balance error:', error);
      return ctx.internalServerError('Failed to get float balance');
    }
  },

  // Top up float
  async topupFloat(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { amount, paymentMethod, gatewayReference } = ctx.request.body;

      if (!amount || amount <= 0) {
        return ctx.badRequest('Invalid amount');
      }

      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      
      if (amount < (settings?.minimumFloatTopup || 10)) {
        return ctx.badRequest(`Minimum topup is ${settings?.minimumFloatTopup || 10}`);
      }

      if (amount > (settings?.maximumFloatTopup || 1000)) {
        return ctx.badRequest(`Maximum topup is ${settings?.maximumFloatTopup || 1000}`);
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      const balanceBefore = user.driverProfile.floatBalance || 0;
      const balanceAfter = balanceBefore + amount;

      const topup = await strapi.db.query('api::float-topup.float-topup').create({
        data: {
          topupId: `FT-${Date.now()}`,
          driver: userId,
          amount,
          paymentMethod,
          status: 'completed',
          gatewayReference,
          floatBalanceBefore: balanceBefore,
          floatBalanceAfter: balanceAfter,
          requestedAt: new Date(),
          completedAt: new Date(),
        }
      });

      // Update driver float balance - preserving existing profile data
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          driverProfile: {
            ...user.driverProfile,
            floatBalance: balanceAfter,
          }
        }
      });

      // Create ledger entry
      await strapi.db.query('api::ledger-entry.ledger-entry').create({
        data: {
          entryId: `LE-${Date.now()}`,
          driver: userId,
          type: 'float_topup',
          amount,
          source: paymentMethod,
          status: 'settled',
          balanceBefore,
          balanceAfter,
        }
      });

      return ctx.send(topup);
    } catch (error) {
      strapi.log.error('Topup float error:', error);
      return ctx.internalServerError('Failed to topup float');
    }
  },

  // Request withdrawal
  async requestWithdrawal(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { amount, method, accountDetails } = ctx.request.body;

      if (!amount || amount <= 0) {
        return ctx.badRequest('Invalid amount');
      }

      if (!method || !accountDetails) {
        return ctx.badRequest('Payment method and account details required');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      
      if (amount < (settings?.minimumWithdrawalAmount || 50)) {
        return ctx.badRequest(`Minimum withdrawal is ${settings?.minimumWithdrawalAmount || 50}`);
      }

      const availableBalance = (user.driverProfile.currentBalance || 0) - (user.driverProfile.pendingWithdrawal || 0);
      
      if (amount > availableBalance) {
        return ctx.badRequest(`Insufficient balance. Available: ${availableBalance}`);
      }

      const withdrawal = await strapi.db.query('api::withdrawal.withdrawal').create({
        data: {
          withdrawalId: `WD-${Date.now()}`,
          user: userId,
          amount,
          method,
          accountDetails,
          status: 'pending',
          requestedAt: new Date(),
        }
      });

      // Update pending withdrawal - preserving existing data
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          driverProfile: {
            ...user.driverProfile,
            pendingWithdrawal: (user.driverProfile.pendingWithdrawal || 0) + amount,
          }
        }
      });

      // Create ledger entry
      await strapi.db.query('api::ledger-entry.ledger-entry').create({
        data: {
          entryId: `LE-${Date.now()}`,
          driver: userId,
          type: 'withdrawal',
          amount: -amount,
          source: method,
          status: 'pending',
        }
      });

      return ctx.send(withdrawal);
    } catch (error) {
      strapi.log.error('Request withdrawal error:', error);
      return ctx.internalServerError('Failed to request withdrawal');
    }
  },
}));