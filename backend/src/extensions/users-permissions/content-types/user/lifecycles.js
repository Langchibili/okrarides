const crypto = require('crypto');

function generateUniqueAffiliateCode() {
  return 'OKRA' + crypto.randomBytes(2).toString('hex').toUpperCase();
}

async function generateQRCode(data) {
  try {
    const QRCode = require('qrcode');
    return await QRCode.toDataURL(data);
  } catch (error) {
    strapi.log.error('QR Code generation failed:', error);
    return null;
  }
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

module.exports = {
  async afterCreate(event) {
    const { result: user } = event;
    
    try {
      let emailGenerated = false;

      if (!user.email || user.email.startsWith('unset_')) {
        const cleanPhone = user.phoneNumber.replace(/^\+/, '').replace(/\D/g, '');
        user.email = `unset_${cleanPhone}@email.com`;
        emailGenerated = true;
      }

      const affiliateCode = generateUniqueAffiliateCode();
      const qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?afcode=${affiliateCode}`;
      const qrCodeImage = await generateQRCode(qrCodeData);

      const sessionExpiry = addMonths(new Date(), 6);

      const updatedUser = await strapi.entityService.update(
        'plugin::users-permissions.user',
        user.id,
        {
          data: {
            affiliateProfile: {
              affiliateCode: affiliateCode,
              qrCode: qrCodeImage,
              totalReferrals: 0,
              activeReferrals: 0,
              totalPoints: 0,
              totalEarnings: 0,
              pointsBalance: 0
            },
            riderProfile: {
              totalRides: 0,
              totalSpent: 0,
              averageRating: 0,
              isActive: false,
              completedRides: 0,
              cancelledRides: 0,
              totalRatings: 0
            },
            driverProfile: {
              verificationStatus: 'not_started',
              isActive: false,
              taxiDriver: null,
              busDriver: null,
              motorbikeRider: null,
              subscriptionStatus: 'inactive',
              subscriptionPlan: null,
              currentSubscription: null,
              floatBalance: 0,
              blocked: false
            },
            deliveryProfile: {
              verificationStatus: 'not_started',
              isActive: false,
              taxi: null,
              motorbike: null,
              motorcycle: null,
              truck: null,
              blocked: false
            },
            conductorProfile: {
              verificationStatus: 'not_started',
              isActive: false,
              assignedDriver: null,
              blocked: false
            },
            sessionExpiry: sessionExpiry,
            ...(emailGenerated && { email: user.email })
          }
        }
      );

      if (user.referredBy) {
        try {
          const referrer = await strapi.entityService.findOne(
            'plugin::users-permissions.user',
            user.referredBy,
            { populate: ['affiliateProfile'] }
          );

          const adminSettings = await strapi.entityService.findOne(
            'api::admin-setting.admin-setting',
            1
          );

          const points = adminSettings?.pointsPerRiderReferral || 10;

          const referrerUpdated = await strapi.entityService.update(
            'plugin::users-permissions.user',
            user.referredBy,
            {
              data: {
                affiliateProfile: {
                  ...referrer.affiliateProfile,
                  totalReferrals: (referrer.affiliateProfile?.totalReferrals || 0) + 1,
                  activeReferrals: (referrer.affiliateProfile?.activeReferrals || 0) + 1,
                  pointsBalance: (referrer.affiliateProfile?.pointsBalance || 0) + points,
                  totalPoints: (referrer.affiliateProfile?.totalPoints || 0) + points
                }
              }
            }
          );

          await strapi.entityService.create('api::affiliate-transaction.affiliate-transaction', {
            data: {
              transactionId: `AFF-${Date.now()}`,
              affiliate: user.referredBy,
              referredUser: user.id,
              type: 'referral_signup',
              points: points,
              status: 'completed'
            }
          });

          if (adminSettings?.smsEnabled) {
            strapi.log.info(
              `SMS notification would be sent to ${referrer.phoneNumber} for referral`
            );
          }
        } catch (error) {
          strapi.log.error('Error processing referrer bonus:', error);
        }
      }

      await strapi.entityService.create('api::audit-log.audit-log', {
        data: {
          action: 'user_registration',
          actor: user.id,
          actorType: 'user',
          metadata: {
            phoneNumber: user.phoneNumber,
            referredBy: user.referredBy || null
          }
        }
      });

    } catch (error) {
      strapi.log.error('Error in user afterCreate lifecycle:', error);
    }
  },

  async afterUpdate(event) {
    const { result: user, params } = event;

    try {
      const userBefore = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        params.where.id || params.id || user.id
      );

      if (userBefore.phoneNumber !== user.phoneNumber) {
        await strapi.entityService.update(
          'plugin::users-permissions.user',
          user.id,
          {
            data: {
              phoneVerified: false
            }
          }
        );
        strapi.log.info(`Phone number changed for user ${user.id}, OTP would be sent`);
      }

      if (userBefore.activeProfile !== user.activeProfile) {
        const updatedProfileStatus = {
          rider: user.activeProfile === 'rider',
          driver: user.activeProfile === 'driver',
          delivery: user.activeProfile === 'delivery',
          conductor: user.activeProfile === 'conductor'
        };

        await strapi.entityService.update(
          'plugin::users-permissions.user',
          user.id,
          {
            data: {
              profileActivityStatus: updatedProfileStatus
            }
          }
        );

        strapi.log.info(
          `Active profile changed for user ${user.id} to ${user.activeProfile}`
        );
      }
    } catch (error) {
      strapi.log.error('Error in user afterUpdate lifecycle:', error);
    }
  }
};
