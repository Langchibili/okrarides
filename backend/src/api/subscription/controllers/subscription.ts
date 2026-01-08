//============================================
// src/api/subscription/controllers/subscription.ts
//============================================
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::driver-subscription.driver-subscription', ({ strapi }) => ({
  
  // Get subscription plans
  async getPlans(ctx) {
    try {
      const plans = await strapi.db.query('api::subscription-plan.subscription-plan').findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      });

      return ctx.send(plans);
    } catch (error) {
      strapi.log.error('Get plans error:', error);
      return ctx.internalServerError('Failed to get subscription plans');
    }
  },

  // Start free trial
  async startTrial(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { planId } = ctx.request.body;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      // Check if already has trial
      const existingTrial = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: { driver: userId, isFreeTrial: true }
      });

      if (existingTrial) {
        return ctx.badRequest('Free trial already used');
      }

      const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
        where: { id: planId }
      });

      if (!plan?.hasFreeTrial) {
        return ctx.badRequest('Plan does not offer free trial');
      }

      const now = new Date();
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.freeTrialDays);

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').create({
        data: {
          subscriptionId: `SUB-${Date.now()}`,
          driver: userId,
          subscriptionPlan: planId,
          status: 'trial',
          startedAt: now,
          expiresAt: trialEndsAt,
          isFreeTrial: true,
          trialEndsAt,
          autoRenew: true,
        }
      });

      // Update driver profile - preserving existing data
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          driverProfile: {
            ...user.driverProfile,
            subscriptionStatus: 'trial',
            currentSubscription: subscription.id,
          }
        }
      });

      return ctx.send(subscription);
    } catch (error) {
      strapi.log.error('Start trial error:', error);
      return ctx.internalServerError('Failed to start trial');
    }
  },

  // Subscribe to plan
  async subscribe(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { planId, paymentMethod, transactionId } = ctx.request.body;

      const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
        where: { id: planId }
      });

      if (!plan) {
        return ctx.notFound('Plan not found');
      }

      const now = new Date();
      const expiresAt = new Date(now);
      
      // Calculate expiry based on duration
      switch(plan.durationType) {
        case 'daily':
          expiresAt.setDate(expiresAt.getDate() + plan.durationValue);
          break;
        case 'weekly':
          expiresAt.setDate(expiresAt.getDate() + (7 * plan.durationValue));
          break;
        case 'monthly':
          expiresAt.setMonth(expiresAt.getMonth() + plan.durationValue);
          break;
        case 'yearly':
          expiresAt.setFullYear(expiresAt.getFullYear() + plan.durationValue);
          break;
      }

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').create({
        data: {
          subscriptionId: `SUB-${Date.now()}`,
          driver: userId,
          subscriptionPlan: planId,
          status: 'active',
          startedAt: now,
          expiresAt,
          lastPaymentDate: now,
          lastPaymentAmount: plan.price,
          lastPaymentTransactionId: transactionId,
          nextPaymentDue: expiresAt,
          autoRenew: true,
        }
      });

      // Create transaction
      await strapi.db.query('api::transaction.transaction').create({
        data: {
          transactionId: transactionId || `TXN-${Date.now()}`,
          user: userId,
          subscription: subscription.id,
          type: 'subscription_payment',
          amount: plan.price,
          status: 'completed',
          paymentMethod,
          processedAt: now,
        }
      });

      // Update driver profile
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          driverProfile: {
            ...user.driverProfile,
            subscriptionStatus: 'active',
            currentSubscription: subscription.id,
          }
        }
      });

      return ctx.send(subscription);
    } catch (error) {
      strapi.log.error('Subscribe error:', error);
      return ctx.internalServerError('Failed to subscribe');
    }
  },

  // Get my subscription
  async getMySubscription(ctx) {
    try {
      const userId = ctx.state.user.id;

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: { 
          driver: userId,
          status: { $in: ['trial', 'active'] }
        },
        populate: ['subscriptionPlan']
      });

      if (!subscription) {
        return ctx.send({ subscription: null, message: 'No active subscription' });
      }

      return ctx.send(subscription);
    } catch (error) {
      strapi.log.error('Get subscription error:', error);
      return ctx.internalServerError('Failed to get subscription');
    }
  },

  // Renew subscription
  async renew(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { paymentMethod, transactionId } = ctx.request.body;

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: { driver: userId, status: { $in: ['active', 'expired'] } },
        populate: ['subscriptionPlan']
      });

      if (!subscription) {
        return ctx.notFound('Subscription not found');
      }

      const plan = subscription.subscriptionPlan;
      const now = new Date();
      const newExpiresAt = new Date(now);
      
      switch(plan.durationType) {
        case 'daily':
          newExpiresAt.setDate(newExpiresAt.getDate() + plan.durationValue);
          break;
        case 'weekly':
          newExpiresAt.setDate(newExpiresAt.getDate() + (7 * plan.durationValue));
          break;
        case 'monthly':
          newExpiresAt.setMonth(newExpiresAt.getMonth() + plan.durationValue);
          break;
        case 'yearly':
          newExpiresAt.setFullYear(newExpiresAt.getFullYear() + plan.durationValue);
          break;
      }

      const updated = await strapi.db.query('api::driver-subscription.driver-subscription').update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          expiresAt: newExpiresAt,
          lastPaymentDate: now,
          lastPaymentAmount: plan.price,
          lastPaymentTransactionId: transactionId,
          nextPaymentDue: newExpiresAt,
          renewalCount: (subscription.renewalCount || 0) + 1,
        }
      });

      return ctx.send(updated);
    } catch (error) {
      strapi.log.error('Renew subscription error:', error);
      return ctx.internalServerError('Failed to renew subscription');
    }
  },

  // Cancel subscription
  async cancel(ctx) {
    try {
      const userId = ctx.state.user.id;

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: { driver: userId, status: { $in: ['trial', 'active'] } }
      });

      if (!subscription) {
        return ctx.notFound('Active subscription not found');
      }

      await strapi.db.query('api::driver-subscription.driver-subscription').update({
        where: { id: subscription.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          autoRenew: false,
        }
      });

      return ctx.send({ message: 'Subscription cancelled successfully' });
    } catch (error) {
      strapi.log.error('Cancel subscription error:', error);
      return ctx.internalServerError('Failed to cancel subscription');
    }
  },
}));