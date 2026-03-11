// //============================================
// // src/api/subscription/controllers/subscription.ts
// //============================================
// import { factories } from '@strapi/strapi';

// export default factories.createCoreController('api::driver-subscription.driver-subscription', ({ strapi }) => ({

//   // Get subscription plans
//   async getPlans(ctx) {
//     try {
//       const plans = await strapi.db.query('api::subscription-plan.subscription-plan').findMany({
//         where: { isActive: true },
//         orderBy: { displayOrder: 'asc' }
//       });

//       return ctx.send(plans);
//     } catch (error) {
//       strapi.log.error('Get plans error:', error);
//       return ctx.internalServerError('Failed to get subscription plans');
//     }
//   },

//   // Start free trial
//   async startTrial(ctx) {
//     try {
//       const userId = ctx.state.user.id;
//       const { planId } = ctx.request.body;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: {
//           driverProfile: {
//             select: ['id', 'subscriptionStatus']
//           }
//         }
//       });

//       if (!user?.driverProfile) {
//         return ctx.badRequest('Driver profile not found');
//       }

//       // Prevent starting trial if already on active/trial subscription
//       const existingActive = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
//         where: {
//           driver: userId,
//           subscriptionStatus: { $in: ['active', 'trial'] }
//         }
//       });

//       if (existingActive) {
//         return ctx.badRequest('You already have an active subscription or trial');
//       }

//       // Prevent re-using free trial
//       const existingTrial = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
//         where: { driver: userId, isFreeTrial: true }
//       });

//       if (existingTrial) {
//         return ctx.badRequest('Free trial has already been used');
//       }

//       const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
//         where: { id: planId, isActive: true }
//       });

//       if (!plan) {
//         return ctx.notFound('Plan not found');
//       }

//       if (!plan.hasFreeTrial) {
//         return ctx.badRequest('This plan does not offer a free trial');
//       }

//       const now = new Date();
//       const trialEndsAt = new Date(now);
//       trialEndsAt.setDate(trialEndsAt.getDate() + (plan.freeTrialDays || 7));

//       // Create the subscription record
//       const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').create({
//         data: {
//           subscriptionId: `SUB-TRIAL-${Date.now()}`,
//           driver: userId,
//           subscriptionPlan: planId,
//           subscriptionStatus: 'trial',     // ← correct field name
//           startedAt: now,
//           expiresAt: trialEndsAt,
//           isFreeTrial: true,
//           trialEndsAt,
//           autoRenew: false,
//           renewalCount: 0,
//         }
//       });

//       // Sync driver profile — this is the source of truth for eligibility checks
//       await strapi.db.query('driver-profiles.driver-profile').update({
//         where: { id: user.driverProfile.id },
//         data: {
//           subscriptionStatus: 'trial',
//           currentSubscription: subscription.id,
//         }
//       });

//       strapi.log.info(`Driver ${userId} started free trial (sub ${subscription.id}), expires ${trialEndsAt}`);

//       return ctx.send({ success: true, data: subscription });
//     } catch (error) {
//       strapi.log.error('Start trial error:', error);
//       return ctx.internalServerError('Failed to start trial');
//     }
//   },

//   // Subscribe to plan
//   async subscribe(ctx) {
//     try {
//       const userId = ctx.state.user.id;
//       const { planId, paymentMethod, transactionId } = ctx.request.body;

//       const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
//         where: { id: planId, isActive: true }
//       });

//       if (!plan) {
//         return ctx.notFound('Plan not found');
//       }

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: {
//           driverProfile: {
//             select: ['id', 'subscriptionStatus']
//           }
//         }
//       });

//       if (!user?.driverProfile) {
//         return ctx.badRequest('Driver profile not found');
//       }

//       // Expire any currently active subscription before creating the new one
//       const existingActive = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
//         where: {
//           driver: userId,
//           subscriptionStatus: { $in: ['active', 'trial'] }
//         }
//       });

//       if (existingActive) {
//         await strapi.db.query('api::driver-subscription.driver-subscription').update({
//           where: { id: existingActive.id },
//           data: {
//             subscriptionStatus: 'expired',
//             autoRenew: false,
//           }
//         });
//         strapi.log.info(`Expired previous subscription ${existingActive.id} for driver ${userId}`);
//       }

//       const now = new Date();
//       const expiresAt = calculateExpiryDate(now, plan.durationType, plan.durationValue || 1);

//       // Create new subscription
//       const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').create({
//         data: {
//           subscriptionId: `SUB-${Date.now()}`,
//           driver: userId,
//           subscriptionPlan: planId,
//           subscriptionStatus: 'active',    // ← correct field name
//           startedAt: now,
//           expiresAt,
//           isFreeTrial: false,
//           lastPaymentDate: now,
//           lastPaymentAmount: plan.price,
//           lastPaymentTransactionId: transactionId || `TXN-${Date.now()}`,
//           nextPaymentDue: expiresAt,
//           autoRenew: true,
//           renewalCount: 0,
//         }
//       });

//       // Create transaction record
//       await strapi.db.query('api::transaction.transaction').create({
//         data: {
//           transactionId: transactionId || `TXN-${Date.now()}`,
//           user: userId,
//           subscription: subscription.id,
//           type: 'subscription_payment',
//           amount: plan.price,
//           status: 'completed',
//           paymentMethod,
//           processedAt: now,
//         }
//       });

//       // Sync driver profile
//       await strapi.db.query('driver-profiles.driver-profile').update({
//         where: { id: user.driverProfile.id },
//         data: {
//           subscriptionStatus: 'active',
//           subscriptionPlan: planId,
//           currentSubscription: subscription.id,
//         }
//       });

//       strapi.log.info(`Driver ${userId} subscribed to plan ${planId} (sub ${subscription.id}), expires ${expiresAt}`);

//       return ctx.send({ success: true, data: subscription });
//     } catch (error) {
//       strapi.log.error('Subscribe error:', error);
//       return ctx.internalServerError('Failed to subscribe');
//     }
//   },

//   // Get my subscription (active or trial only)
//   async getMySubscription(ctx) {
//     try {
//       const userId = ctx.state.user.id;

//       const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
//         where: {
//           driver: userId,
//           subscriptionStatus: { $in: ['trial', 'active'] }   // ← correct field name
//         },
//         populate: { subscriptionPlan: true },
//         orderBy: { createdAt: 'desc' }
//       });

//       if (!subscription) {
//         // Also return any recently expired subscription so the frontend can nudge to renew
//         const lastSub = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
//           where: { driver: userId },
//           populate: { subscriptionPlan: true },
//           orderBy: { createdAt: 'desc' }
//         });

//         return ctx.send({
//           subscription: null,
//           lastSubscription: lastSub || null,
//           message: 'No active subscription'
//         });
//       }

//       // Compute days remaining for frontend convenience
//       const now = new Date();
//       const expiresAt = new Date(subscription.expiresAt);
//       const daysRemaining = Math.max(
//         0,
//         Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
//       );

//       return ctx.send({
//         subscription: {
//           ...subscription,
//           daysRemaining,
//           plan: subscription.subscriptionPlan,
//         }
//       });
//     } catch (error) {
//       strapi.log.error('Get subscription error:', error);
//       return ctx.internalServerError('Failed to get subscription');
//     }
//   },

//   // Renew subscription
//   async renew(ctx) {
//     try {
//       const userId = ctx.state.user.id;
//       const { paymentMethod, transactionId } = ctx.request.body;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: {
//           driverProfile: {
//             select: ['id']
//           }
//         }
//       });

//       if (!user?.driverProfile) {
//         return ctx.badRequest('Driver profile not found');
//       }

//       // Find most recent subscription regardless of status (for renewal)
//       const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
//         where: {
//           driver: userId,
//           subscriptionStatus: { $in: ['active', 'trial', 'expired', 'cancelled'] }
//         },
//         populate: { subscriptionPlan: true },
//         orderBy: { createdAt: 'desc' }
//       });

//       if (!subscription) {
//         return ctx.notFound('No subscription found to renew');
//       }

//       const plan = subscription.subscriptionPlan;

//       if (!plan) {
//         return ctx.badRequest('Subscription plan not found');
//       }

//       const now = new Date();

//       // If still active/trial, extend from current expiry; otherwise from now
//       const baseDate =
//         ['active', 'trial'].includes(subscription.subscriptionStatus) &&
//         new Date(subscription.expiresAt) > now
//           ? new Date(subscription.expiresAt)
//           : now;

//       const newExpiresAt = calculateExpiryDate(baseDate, plan.durationType, plan.durationValue || 1);

//       const updated = await strapi.db.query('api::driver-subscription.driver-subscription').update({
//         where: { id: subscription.id },
//         data: {
//           subscriptionStatus: 'active',   // ← correct field name
//           expiresAt: newExpiresAt,
//           lastPaymentDate: now,
//           lastPaymentAmount: plan.price,
//           lastPaymentTransactionId: transactionId || `TXN-RENEW-${Date.now()}`,
//           nextPaymentDue: newExpiresAt,
//           autoRenew: true,
//           renewalCount: (subscription.renewalCount || 0) + 1,
//         }
//       });

//       // Create transaction
//       await strapi.db.query('api::transaction.transaction').create({
//         data: {
//           transactionId: transactionId || `TXN-RENEW-${Date.now()}`,
//           user: userId,
//           subscription: subscription.id,
//           type: 'subscription_payment',
//           amount: plan.price,
//           status: 'completed',
//           paymentMethod,
//           processedAt: now,
//         }
//       });

//       // Sync driver profile
//       await strapi.db.query('driver-profiles.driver-profile').update({
//         where: { id: user.driverProfile.id },
//         data: {
//           subscriptionStatus: 'active',
//           currentSubscription: subscription.id,
//         }
//       });

//       strapi.log.info(`Driver ${userId} renewed subscription ${subscription.id}, new expiry ${newExpiresAt}`);

//       return ctx.send({ success: true, data: updated });
//     } catch (error) {
//       strapi.log.error('Renew subscription error:', error);
//       return ctx.internalServerError('Failed to renew subscription');
//     }
//   },

//   // Cancel subscription
//   async cancel(ctx) {
//     try {
//       const userId = ctx.state.user.id;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: {
//           driverProfile: {
//             select: ['id']
//           }
//         }
//       });

//       if (!user?.driverProfile) {
//         return ctx.badRequest('Driver profile not found');
//       }

//       const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
//         where: {
//           driver: userId,
//           subscriptionStatus: { $in: ['trial', 'active'] }   // ← correct field name
//         }
//       });

//       if (!subscription) {
//         return ctx.notFound('No active subscription found to cancel');
//       }

//       await strapi.db.query('api::driver-subscription.driver-subscription').update({
//         where: { id: subscription.id },
//         data: {
//           subscriptionStatus: 'cancelled',   // ← correct field name
//           cancelledAt: new Date(),
//           autoRenew: false,
//         }
//       });

//       // Sync driver profile — subscription cancelled but access runs until expiresAt
//       // We keep subscriptionStatus as 'active' in the profile until expiry cron runs
//       // so the driver can still use the subscription for the paid period.
//       await strapi.db.query('driver-profiles.driver-profile').update({
//         where: { id: user.driverProfile.id },
//         data: {
//           subscriptionStatus: 'cancelled',
//         }
//       });

//       strapi.log.info(`Driver ${userId} cancelled subscription ${subscription.id}`);

//       return ctx.send({
//         success: true,
//         message: 'Subscription cancelled. You retain access until the current period ends.',
//         expiresAt: subscription.expiresAt,
//       });
//     } catch (error) {
//       strapi.log.error('Cancel subscription error:', error);
//       return ctx.internalServerError('Failed to cancel subscription');
//     }
//   },
// }));

// // ─── Shared helper ──────────────────────────────────────────────────────────

// /**
//  * Calculate subscription expiry date based on plan duration type and value.
//  */
// function calculateExpiryDate(from: Date, durationType: string, durationValue: number): Date {
//   const date = new Date(from);
//   switch (durationType) {
//     case 'daily':
//       date.setDate(date.getDate() + durationValue);
//       break;
//     case 'weekly':
//       date.setDate(date.getDate() + 7 * durationValue);
//       break;
//     case 'monthly':
//       date.setMonth(date.getMonth() + durationValue);
//       break;
//     case 'yearly':
//       date.setFullYear(date.getFullYear() + durationValue);
//       break;
//     default:
//       date.setMonth(date.getMonth() + 1);
//   }
//   return date;
// }
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
        populate: {
          driverProfile: {
            select: ['id', 'subscriptionStatus']
          }
        }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      // Prevent starting trial if already on active/trial subscription
      const existingActive = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: {
          driver: userId,
          subscriptionStatus: { $in: ['active', 'trial'] }
        }
      });

      if (existingActive) {
        return ctx.badRequest('You already have an active subscription or trial');
      }

      // Prevent re-using free trial
      const existingTrial = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: { driver: userId, isFreeTrial: true }
      });

      if (existingTrial) {
        return ctx.badRequest('Free trial has already been used');
      }

      const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
        where: { id: planId, isActive: true }
      });

      if (!plan) {
        return ctx.notFound('Plan not found');
      }

      if (!plan.hasFreeTrial) {
        return ctx.badRequest('This plan does not offer a free trial');
      }

      const now = new Date();
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + (plan.freeTrialDays || 7));

      // Create the subscription record — free trials are activated immediately
      // because no payment is required.
      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').create({
        data: {
          subscriptionId: `SUB-TRIAL-${Date.now()}`,
          driver: userId,
          subscriptionPlan: planId,
          subscriptionStatus: 'trial',
          startedAt: now,
          expiresAt: trialEndsAt,
          isFreeTrial: true,
          trialEndsAt,
          autoRenew: false,
          renewalCount: 0,
        }
      });

      // Sync driver profile
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: {
          subscriptionStatus: 'trial',
          currentSubscription: subscription.id,
        }
      });

      strapi.log.info(`Driver ${userId} started free trial (sub ${subscription.id}), expires ${trialEndsAt}`);

      return ctx.send({ success: true, data: subscription });
    } catch (error) {
      strapi.log.error('Start trial error:', error);
      return ctx.internalServerError('Failed to start trial');
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Subscribe — creates a PENDING subscription record.
  //
  // This endpoint is called BEFORE payment.  It returns { subscriptionId, amount }
  // so the frontend can pass subscriptionId to OkraPayModal as relatedEntityId.
  //
  // The subscription is only activated (status → 'active') by the OkraPay
  // payment handler (handleSubscriptionPaymentSuccess in okrapay.ts) once
  // payment is confirmed by the gateway webhook / poller.
  //
  // DO NOT set subscriptionStatus = 'active' here.
  // DO NOT sync driver profile here.
  // ─────────────────────────────────────────────────────────────────────────────
  async subscribe(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { planId } = ctx.request.body;

      const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
        where: { id: planId, isActive: true }
      });

      if (!plan) {
        return ctx.notFound('Plan not found');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: {
          driverProfile: {
            select: ['id', 'subscriptionStatus']
          }
        }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      // Create a PENDING subscription — not yet active
      const now       = new Date();
      const expiresAt = calculateExpiryDate(now, plan.durationType, plan.durationValue || 1);

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').create({
        data: {
          subscriptionId: `SUB-PENDING-${Date.now()}`,
          driver: userId,
          subscriptionPlan: planId,
          subscriptionStatus: 'pending',   // ← NOT active — payment has not happened yet
          startedAt: null,
          expiresAt,
          isFreeTrial: false,
          autoRenew: true,
          renewalCount: 0,
        }
      });

      strapi.log.info(
        `Driver ${userId} created pending subscription ${subscription.id} for plan ${planId}. ` +
        `Awaiting OkraPay payment.`
      );

      // Return subscriptionId + amount so the frontend can open OkraPayModal
      return ctx.send({
        success:        true,
        subscriptionId: subscription.id,
        amount:         plan.price,
        data:           subscription,
      });
    } catch (error) {
      strapi.log.error('Subscribe (create intent) error:', error);
      return ctx.internalServerError('Failed to create subscription');
    }
  },

  // Get my subscription (active or trial only)
  async getMySubscription(ctx) {
    try {
      const userId = ctx.state.user.id;

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: {
          driver: userId,
          subscriptionStatus: { $in: ['trial', 'active'] }
        },
        populate: { subscriptionPlan: true },
        orderBy: { createdAt: 'desc' }
      });

      if (!subscription) {
        const lastSub = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
          where: { driver: userId },
          populate: { subscriptionPlan: true },
          orderBy: { createdAt: 'desc' }
        });

        return ctx.send({
          subscription: null,
          lastSubscription: lastSub || null,
          message: 'No active subscription'
        });
      }

      const now         = new Date();
      const expiresAt   = new Date(subscription.expiresAt);
      const daysRemaining = Math.max(
        0,
        Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      return ctx.send({
        subscription: {
          ...subscription,
          daysRemaining,
          plan: subscription.subscriptionPlan,
        }
      });
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

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: {
          driverProfile: {
            select: ['id']
          }
        }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: {
          driver: userId,
          subscriptionStatus: { $in: ['active', 'trial', 'expired', 'cancelled'] }
        },
        populate: { subscriptionPlan: true },
        orderBy: { createdAt: 'desc' }
      });

      if (!subscription) {
        return ctx.notFound('No subscription found to renew');
      }

      const plan = subscription.subscriptionPlan;
      if (!plan) {
        return ctx.badRequest('Subscription plan not found');
      }

      const now = new Date();
      const baseDate =
        ['active', 'trial'].includes(subscription.subscriptionStatus) &&
        new Date(subscription.expiresAt) > now
          ? new Date(subscription.expiresAt)
          : now;

      const newExpiresAt = calculateExpiryDate(baseDate, plan.durationType, plan.durationValue || 1);

      const updated = await strapi.db.query('api::driver-subscription.driver-subscription').update({
        where: { id: subscription.id },
        data: {
          subscriptionStatus: 'active',
          expiresAt: newExpiresAt,
          lastPaymentDate: now,
          lastPaymentAmount: plan.price,
          lastPaymentTransactionId: transactionId || `TXN-RENEW-${Date.now()}`,
          nextPaymentDue: newExpiresAt,
          autoRenew: true,
          renewalCount: (subscription.renewalCount || 0) + 1,
        }
      });

      await strapi.db.query('api::transaction.transaction').create({
        data: {
          transactionId: transactionId || `TXN-RENEW-${Date.now()}`,
          user: userId,
          subscription: subscription.id,
          type: 'subscription_payment',
          amount: plan.price,
          status: 'completed',
          paymentMethod,
          processedAt: now,
        }
      });

      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: {
          subscriptionStatus: 'active',
          currentSubscription: subscription.id,
        }
      });

      strapi.log.info(`Driver ${userId} renewed subscription ${subscription.id}, new expiry ${newExpiresAt}`);

      return ctx.send({ success: true, data: updated });
    } catch (error) {
      strapi.log.error('Renew subscription error:', error);
      return ctx.internalServerError('Failed to renew subscription');
    }
  },

  // Cancel subscription
  async cancel(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: {
          driverProfile: {
            select: ['id']
          }
        }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: {
          driver: userId,
          subscriptionStatus: { $in: ['trial', 'active'] }
        }
      });

      if (!subscription) {
        return ctx.notFound('No active subscription found to cancel');
      }

      await strapi.db.query('api::driver-subscription.driver-subscription').update({
        where: { id: subscription.id },
        data: {
          subscriptionStatus: 'cancelled',
          cancelledAt: new Date(),
          autoRenew: false,
        }
      });

      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: {
          subscriptionStatus: 'cancelled',
        }
      });

      strapi.log.info(`Driver ${userId} cancelled subscription ${subscription.id}`);

      return ctx.send({
        success: true,
        message: 'Subscription cancelled. You retain access until the current period ends.',
        expiresAt: subscription.expiresAt,
      });
    } catch (error) {
      strapi.log.error('Cancel subscription error:', error);
      return ctx.internalServerError('Failed to cancel subscription');
    }
  },
}));

// ─── Shared helper ──────────────────────────────────────────────────────────

function calculateExpiryDate(from: Date, durationType: string, durationValue: number): Date {
  const date = new Date(from);
  switch (durationType) {
    case 'daily':
      date.setDate(date.getDate() + durationValue);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7 * durationValue);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + durationValue);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + durationValue);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date;
}