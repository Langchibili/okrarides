// // const crypto = require('crypto');

// // function generateUniqueAffiliateCode() {
// //   return 'OKRA' + crypto.randomBytes(2).toString('hex').toUpperCase();
// // }

// // async function generateQRCode(data) {
// //   try {
// //     const QRCode = require('qrcode');
// //     return await QRCode.toDataURL(data);
// //   } catch (error) {
// //     strapi.log.error('QR Code generation failed:', error);
// //     return null;
// //   }
// // }

// // function addMonths(date, months) {
// //   const d = new Date(date);
// //   d.setMonth(d.getMonth() + months);
// //   return d;
// // }

// // module.exports = {
// //   async afterCreate(event) {
// //     console.log('this is hit')
// //     const { result: user } = event;
// //     console.log('here too',user)
// //     try {
// //       let emailGenerated = false;

// //       if (!user.email || user.email.startsWith('unset_')) {
// //         const cleanPhone = user.phoneNumber.replace(/^\+/, '').replace(/\D/g, '');
// //         user.email = `unset_${cleanPhone}@email.com`;
// //         emailGenerated = true;
// //       }

// //       const affiliateCode = generateUniqueAffiliateCode();
// //       const qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?afcode=${affiliateCode}`;
// //       const qrCodeImage = await generateQRCode(qrCodeData);

// //       const sessionExpiry = addMonths(new Date(), 6);

// //       const updatedUser = await strapi.entityService.update(
// //         'plugin::users-permissions.user',
// //         user.id,
// //         {
// //           data: {
// //             affiliateProfile: {
// //               affiliateCode: affiliateCode,
// //               qrCode: qrCodeImage,
// //               totalReferrals: 0,
// //               activeReferrals: 0,
// //               totalPoints: 0,
// //               totalEarnings: 0,
// //               pointsBalance: 0
// //             },
// //             riderProfile: {
// //               totalRides: 0,
// //               totalSpent: 0,
// //               averageRating: 0,
// //               isActive: false,
// //               completedRides: 0,
// //               cancelledRides: 0,
// //               totalRatings: 0
// //             },
// //             driverProfile: {
// //               verificationStatus: 'not_started',
// //               isActive: false,
// //               taxiDriver: null,
// //               busDriver: null,
// //               motorbikeRider: null,
// //               subscriptionStatus: 'inactive',
// //               subscriptionPlan: null,
// //               currentSubscription: null,
// //               floatBalance: 0,
// //               blocked: false
// //             },
// //             deliveryProfile: {
// //               verificationStatus: 'not_started',
// //               isActive: false,
// //               taxi: null,
// //               motorbike: null,
// //               motorcycle: null,
// //               truck: null,
// //               blocked: false
// //             },
// //             conductorProfile: {
// //               verificationStatus: 'not_started',
// //               isActive: false,
// //               assignedDriver: null,
// //               blocked: false
// //             },
// //             sessionExpiry: sessionExpiry,
// //             ...(emailGenerated && { email: user.email })
// //           }
// //         }
// //       );

// //       if (user.referredBy) {
// //         try {
// //           const referrer = await strapi.entityService.findOne(
// //             'plugin::users-permissions.user',
// //             user.referredBy,
// //             { populate: ['affiliateProfile'] }
// //           );

// //           const adminSettings = await strapi.entityService.findOne(
// //             'api::admin-setting.admin-setting',
// //             1
// //           );

// //           const points = adminSettings?.pointsPerRiderReferral || 10;

// //           const referrerUpdated = await strapi.entityService.update(
// //             'plugin::users-permissions.user',
// //             user.referredBy,
// //             {
// //               data: {
// //                 affiliateProfile: {
// //                   ...referrer.affiliateProfile,
// //                   totalReferrals: (referrer.affiliateProfile?.totalReferrals || 0) + 1,
// //                   activeReferrals: (referrer.affiliateProfile?.activeReferrals || 0) + 1,
// //                   pointsBalance: (referrer.affiliateProfile?.pointsBalance || 0) + points,
// //                   totalPoints: (referrer.affiliateProfile?.totalPoints || 0) + points
// //                 }
// //               }
// //             }
// //           );

// //           await strapi.entityService.create('api::affiliate-transaction.affiliate-transaction', {
// //             data: {
// //               transactionId: `AFF-${Date.now()}`,
// //               affiliate: user.referredBy,
// //               referredUser: user.id,
// //               type: 'referral_signup',
// //               points: points,
// //               status: 'completed'
// //             }
// //           });

// //           if (adminSettings?.smsEnabled) {
// //             strapi.log.info(
// //               `SMS notification would be sent to ${referrer.phoneNumber} for referral`
// //             );
// //           }
// //         } catch (error) {
// //           strapi.log.error('Error processing referrer bonus:', error);
// //         }
// //       }

// //       await strapi.entityService.create('api::audit-log.audit-log', {
// //         data: {
// //           action: 'user_registration',
// //           actor: user.id,
// //           actorType: 'user',
// //           metadata: {
// //             phoneNumber: user.phoneNumber,
// //             referredBy: user.referredBy || null
// //           }
// //         }
// //       });

// //     } catch (error) {
// //       strapi.log.error('Error in user afterCreate lifecycle:', error);
// //     }
// //   },

// //   async afterUpdate(event) {
// //     const { result: user, params } = event;

// //     try {
// //       const userBefore = await strapi.entityService.findOne(
// //         'plugin::users-permissions.user',
// //         params.where.id || params.id || user.id
// //       );

// //       if (userBefore.phoneNumber !== user.phoneNumber) {
// //         await strapi.entityService.update(
// //           'plugin::users-permissions.user',
// //           user.id,
// //           {
// //             data: {
// //               phoneVerified: false
// //             }
// //           }
// //         );
// //         strapi.log.info(`Phone number changed for user ${user.id}, OTP would be sent`);
// //       }

// //       if (userBefore.activeProfile !== user.activeProfile) {
// //         const updatedProfileStatus = {
// //           rider: user.activeProfile === 'rider',
// //           driver: user.activeProfile === 'driver',
// //           delivery: user.activeProfile === 'delivery',
// //           conductor: user.activeProfile === 'conductor'
// //         };

// //         await strapi.entityService.update(
// //           'plugin::users-permissions.user',
// //           user.id,
// //           {
// //             data: {
// //               profileActivityStatus: updatedProfileStatus
// //             }
// //           }
// //         );

// //         strapi.log.info(
// //           `Active profile changed for user ${user.id} to ${user.activeProfile}`
// //         );
// //       }
// //     } catch (error) {
// //       strapi.log.error('Error in user afterUpdate lifecycle:', error);
// //     }
// //   }
// // };
// import crypto from 'crypto';
// import QRCode from 'qrcode';

// interface User {
//   id: number;
//   email: string;
//   phoneNumber: string;
//   referredBy?: number;
//   affiliateProfile?: any;
//   riderProfile?: any;
//   driverProfile?: any;
//   deliveryProfile?: any;
//   conductorProfile?: any;
//   sessionExpiry?: Date;
//   phoneVerified?: boolean;
//   activeProfile?: string;
//   profileActivityStatus?: {
//     rider: boolean;
//     driver: boolean;
//     delivery: boolean;
//     conductor: boolean;
//   };
// }

// interface LifecycleEvent {
//   result: User;
//   params?: {
//     where?: { id: number };
//     id?: number;
//   };
// }

// interface AdminSettings {
//   pointsPerRiderReferral?: number;
//   smsEnabled?: boolean;
// }

// // Helper functions with proper typing
// function generateUniqueAffiliateCode(): string {
//   return 'OKRA' + crypto.randomBytes(2).toString('hex').toUpperCase();
// }

// async function generateQRCode(data: string): Promise<string | null> {
//   try {
//     return await QRCode.toDataURL(data);
//   } catch (error) {
//     strapi.log.error('QR Code generation failed:', error);
//     return null;
//   }
// }

// function addMonths(date: Date, months: number): Date {
//   const d = new Date(date);
//   d.setMonth(d.getMonth() + months);
//   return d;
// }

// // Main lifecycle hooks
// export default {
//   async afterCreate(event: LifecycleEvent) {
//     console.log('this is hit');
//     const { result: user } = event;
//     console.log('here too', user);
    
//     try {
//       let emailGenerated = false;

//       // Generate email if missing or unset
//       if (!user.email || user.email.startsWith('unset_')) {
//         const cleanPhone = user.phoneNumber.replace(/^\+/, '').replace(/\D/g, '');
//         user.email = `unset_${cleanPhone}@email.com`;
//         emailGenerated = true;
//       }

//       // Generate affiliate code and QR code
//       const affiliateCode = generateUniqueAffiliateCode();
//       const qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?afcode=${affiliateCode}`;
//       const qrCodeImage = await generateQRCode(qrCodeData);

//       // Calculate session expiry
//       const sessionExpiry = addMonths(new Date(), 6);

//       // Update user with all profiles
//       const updatedUser = await strapi.entityService.update(
//         'plugin::users-permissions.user',
//         user.id,
//         {
//           data: {
//             affiliateProfile: {
//               affiliateCode: affiliateCode,
//               qrCode: qrCodeImage,
//               totalReferrals: 0,
//               activeReferrals: 0,
//               totalPoints: 0,
//               totalEarnings: 0,
//               pointsBalance: 0
//             },
//             riderProfile: {
//               totalRides: 0,
//               totalSpent: 0,
//               averageRating: 0,
//               isActive: false,
//               completedRides: 0,
//               cancelledRides: 0,
//               totalRatings: 0
//             },
//             driverProfile: {
//               verificationStatus: 'not_started',
//               isActive: false,
//               taxiDriver: null,
//               busDriver: null,
//               motorbikeRider: null,
//               subscriptionStatus: 'inactive',
//               subscriptionPlan: null,
//               currentSubscription: null,
//               floatBalance: 0,
//               blocked: false
//             },
//             deliveryProfile: {
//               verificationStatus: 'not_started',
//               isActive: false,
//               taxi: null,
//               motorbike: null,
//               motorcycle: null,
//               truck: null,
//               blocked: false
//             },
//             conductorProfile: {
//               verificationStatus: 'not_started',
//               isActive: false,
//               assignedDriver: null,
//               blocked: false
//             },
//             sessionExpiry: sessionExpiry,
//             ...(emailGenerated && { email: user.email })
//           }
//         }
//       );

//       // Handle referral bonus if user was referred
//       if (user.referredBy) {
//         try {
//           const referrer = await strapi.entityService.findOne(
//             'plugin::users-permissions.user',
//             user.referredBy,
//             { populate: ['affiliateProfile'] }
//           );

//           const adminSettings = await strapi.entityService.findOne<AdminSettings>(
//             'api::admin-setting.admin-setting',
//             1
//           );

//           const points = adminSettings?.pointsPerRiderReferral || 10;

//           // Update referrer's affiliate profile
//           const referrerUpdated = await strapi.entityService.update(
//             'plugin::users-permissions.user',
//             user.referredBy,
//             {
//               data: {
//                 affiliateProfile: {
//                   ...referrer.affiliateProfile,
//                   totalReferrals: (referrer.affiliateProfile?.totalReferrals || 0) + 1,
//                   activeReferrals: (referrer.affiliateProfile?.activeReferrals || 0) + 1,
//                   pointsBalance: (referrer.affiliateProfile?.pointsBalance || 0) + points,
//                   totalPoints: (referrer.affiliateProfile?.totalPoints || 0) + points
//                 }
//               }
//             }
//           );

//           // Create affiliate transaction record
//           await strapi.entityService.create('api::affiliate-transaction.affiliate-transaction', {
//             data: {
//               transactionId: `AFF-${Date.now()}`,
//               affiliate: user.referredBy,
//               referredUser: user.id,
//               type: 'referral_signup',
//               points: points,
//               status: 'completed'
//             }
//           });

//           // Send SMS notification if enabled
//           if (adminSettings?.smsEnabled) {
//             strapi.log.info(
//               `SMS notification would be sent to ${referrer.phoneNumber} for referral`
//             );
//           }
//         } catch (error) {
//           strapi.log.error('Error processing referrer bonus:', error);
//         }
//       }

//       // Create audit log
//       await strapi.entityService.create('api::audit-log.audit-log', {
//         data: {
//           action: 'user_registration',
//           actor: user.id,
//           actorType: 'user',
//           metadata: {
//             phoneNumber: user.phoneNumber,
//             referredBy: user.referredBy || null
//           }
//         }
//       });

//     } catch (error) {
//       strapi.log.error('Error in user afterCreate lifecycle:', error);
//     }
//   },

//   async afterUpdate(event: LifecycleEvent) {
//     const { result: user, params } = event;

//     try {
//       const userBefore = await strapi.entityService.findOne<User>(
//         'plugin::users-permissions.user',
//         params?.where?.id || params?.id || user.id
//       );

//       // Handle phone number change
//       if (userBefore?.phoneNumber !== user.phoneNumber) {
//         await strapi.entityService.update(
//           'plugin::users-permissions.user',
//           user.id,
//           {
//             data: {
//               phoneVerified: false
//             }
//           }
//         );
//         strapi.log.info(`Phone number changed for user ${user.id}, OTP would be sent`);
//       }

//       // Handle active profile change
//       if (userBefore?.activeProfile !== user.activeProfile) {
//         const updatedProfileStatus = {
//           rider: user.activeProfile === 'rider',
//           driver: user.activeProfile === 'driver',
//           delivery: user.activeProfile === 'delivery',
//           conductor: user.activeProfile === 'conductor'
//         };

//         await strapi.entityService.update(
//           'plugin::users-permissions.user',
//           user.id,
//           {
//             data: {
//               profileActivityStatus: updatedProfileStatus
//             }
//           }
//         );

//         strapi.log.info(
//           `Active profile changed for user ${user.id} to ${user.activeProfile}`
//         );
//       }
//     } catch (error) {
//       strapi.log.error('Error in user afterUpdate lifecycle:', error);
//     }
//   }
// };
import crypto from 'crypto';
import QRCode from 'qrcode';

// Interface definitions - Simplified to avoid type conflicts
interface User {
  id: number;
  email: string;
  phoneNumber: string;
  referredBy?: number;
  affiliateProfile?: any;
  riderProfile?: any;
  driverProfile?: any;
  deliveryProfile?: any;
  conductorProfile?: any;
  sessionExpiry?: Date;
  phoneVerified?: boolean;
  activeProfile?: string;
  profileActivityStatus?: any; // Changed to any to avoid JSONValue conflict
}

interface LifecycleEvent {
  result: User;
  params?: {
    where?: { id: number };
    id?: number;
  };
}

interface ReferrerUser {
  id: number;
  phoneNumber?: string;
  affiliateProfile?: any;
}

// Helper functions
function generateUniqueAffiliateCode(): string {
  return 'OKRA' + crypto.randomBytes(2).toString('hex').toUpperCase();
}

async function generateQRCode(data: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return null;
  }
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Main lifecycle hooks
export default {
  async afterCreate(event: any) {
    console.log('this is hit');
    const { result: user } = event;
    console.log('here too', user);
    
    try {
      let emailGenerated = false;

      // Generate email if missing or unset
      if (!user.email || user.email.startsWith('unset_')) {
        const cleanPhone = user.phoneNumber.replace(/^\+/, '').replace(/\D/g, '');
        user.email = `unset_${cleanPhone}@email.com`;
        emailGenerated = true;
      }

      // Generate affiliate code and QR code
      const affiliateCode = generateUniqueAffiliateCode();
      const qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?afcode=${affiliateCode}`;
      const qrCodeImage = await generateQRCode(qrCodeData);

      // Calculate session expiry
      const sessionExpiry = addMonths(new Date(), 6);

      // Update user with all profiles
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

      // Handle referral bonus if user was referred
      if (user.referredBy) {
        try {
          const referrer = await strapi.entityService.findOne(
            'plugin::users-permissions.user',
            user.referredBy
          ) as unknown as ReferrerUser;

          if (!referrer) {
            console.error(`Referrer with ID ${user.referredBy} not found`);
          } else {
            const adminSettings = await strapi.entityService.findOne(
              'api::admn-setting.admn-setting',
              1
            ) as any;

            const points = (adminSettings && adminSettings.pointsPerRiderReferral) ? 
                           adminSettings.pointsPerRiderReferral : 10;

            // Get current affiliate profile or create empty structure
            const currentAffiliateProfile = referrer.affiliateProfile || {};
            
            // Prepare the complete affiliate profile update
            const affiliateProfileUpdate = {
              affiliateCode: currentAffiliateProfile.affiliateCode || '',
              qrCode: currentAffiliateProfile.qrCode || null,
              totalReferrals: (currentAffiliateProfile.totalReferrals || 0) + 1,
              activeReferrals: (currentAffiliateProfile.activeReferrals || 0) + 1,
              totalPoints: (currentAffiliateProfile.totalPoints || 0) + points,
              totalEarnings: currentAffiliateProfile.totalEarnings || 0,
              pointsBalance: (currentAffiliateProfile.pointsBalance || 0) + points,
              // Include any other required fields from your schema
              blocked: currentAffiliateProfile.blocked || false,
              pendingEarnings: currentAffiliateProfile.pendingEarnings || 0,
              withdrawableBalance: currentAffiliateProfile.withdrawableBalance || 0
            };

            // Update referrer's affiliate profile with complete structure
            await strapi.entityService.update(
              'plugin::users-permissions.user',
              user.referredBy,
              {
                data: {
                  affiliateProfile: affiliateProfileUpdate
                } as any
              }
            );

            // Create affiliate transaction record
            await strapi.entityService.create('api::affiliate-transaction.affiliate-transaction', {
              data: {
                transactionId: `AFF-${Date.now()}`,
                affiliate: user.referredBy,
                referredUser: user.id,
                type: 'referral_signup' as const,
                points: points
              }
            });

            // Send SMS notification if enabled
            if (adminSettings?.smsEnabled && referrer.phoneNumber) {
              console.info(
                `SMS notification would be sent to ${referrer.phoneNumber} for referral`
              );
            }
          }
        } catch (error) {
          console.error('Error processing referrer bonus:', error);
        }
      }

      // Create audit log
      await strapi.entityService.create('api::audit-log.audit-log', {
        data: {
          action: 'user_registration',
          actor: user.id,
          actorType: 'user' as const,
          timestamp: new Date(),
          metadata: {
            phoneNumber: user.phoneNumber,
            referredBy: user.referredBy || null
          }
        }
      });

    } catch (error) {
      console.error('Error in user afterCreate lifecycle:', error);
    }
  },

  async afterUpdate(event: any) {
    const { result: user, params } = event;

    try {
      // Get the previous user state
      const userBefore = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        params?.where?.id || params?.id || user.id
      );

      // Cast to unknown first, then to our expected type
      const userBeforeTyped = userBefore as unknown as { 
        phoneNumber?: string; 
        activeProfile?: string;
      };

      if (!userBeforeTyped) {
        console.error(`User with ID ${params?.where?.id || params?.id || user.id} not found`);
        return;
      }

      // Handle phone number change
      if (userBeforeTyped?.phoneNumber !== user.phoneNumber) {
        await strapi.entityService.update(
          'plugin::users-permissions.user',
          user.id,
          {
            data: {
              phoneVerified: false
            }
          } as any
        );
        console.info(`Phone number changed for user ${user.id}, OTP would be sent`);
      }

      // Handle active profile change
      if (userBeforeTyped?.activeProfile !== user.activeProfile) {
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
          } as any
        );

        console.info(
          `Active profile changed for user ${user.id} to ${user.activeProfile}`
        );
      }
    } catch (error) {
      console.error('Error in user afterUpdate lifecycle:', error);
    }
  }
};