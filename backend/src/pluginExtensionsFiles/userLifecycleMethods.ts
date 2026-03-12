// import crypto from 'crypto';
// import QRCode from 'qrcode';
// import { Readable } from 'stream';
// import { uploadQRCodeWithClient } from "../services/uploadQrCode"

// // Interface definitions
// interface User {
//   id: number;
//   documentId?: string;
//   email?: string;
//   phoneNumber?: string;
//   referredBy?: number;
//   affiliateProfile?: any;
//   riderProfile?: any;
//   driverProfile?: any;
//   deliveryProfile?: any;
//   conductorProfile?: any;
//   sessionExpiry?: Date;
//   phoneVerified?: boolean;
//   activeProfile?: string;
//   profileActivityStatus?: any;
// }

// interface ReferrerUser {
//   id: number;
//   documentId?: string;
//   phoneNumber?: string;
//   affiliateProfile?: any;
// }

// interface StrapiInstance {
//   db: {
//     query: (uid: string) => {
//       update: (params: { where: { id: number }, data: any, populate?: any }) => Promise<any>;
//       findOne: (params: { where: { id: number }, populate?: any, select?: any }) => Promise<any>;
//       create: (params: { data: any }) => Promise<any>;
//     };
//   };
//   documents: (uid: string) => {
//     update: (params: { documentId: string, data: any, populate?: any }) => Promise<any>;
//     findOne: (params: { documentId: string, populate?: any, select?: any }) => Promise<any>;
//     create: (params: { data: any }) => Promise<any>;
//   };
//   plugin: (name: string) => {
//     service: (serviceName: string) => any;
//   };
//   query: (uid: string) => {
//     findOne: (params: { where: any, populate?: any }) => Promise<any>;
//     update: (params: { where: any, data: any }) => Promise<any>;
//   };
//   entityService: {
//     update: (uid: string, id: number, data: any) => Promise<any>;
//   };
//   log?: {
//     error: (message: string, error?: any) => void;
//     info: (message: string) => void;
//   };
// }

// // Helper functions
// function generateUniqueAffiliateCode(): string {
//   return 'OKRA' + crypto.randomBytes(2).toString('hex').toUpperCase();
// }

// async function generateQRCode(data: string): Promise<string | null> {
//   try {
//     return await QRCode.toDataURL(data);
//   } catch (error) {
//     console.error('QR Code generation failed:', error);
//     return null;
//   }
// }

// function addMonths(date: Date, months: number): Date {
//   const d = new Date(date);
//   d.setMonth(d.getMonth() + months);
//   return d;
// }

// /**
//  * Convert buffer to readable stream
//  */
// function bufferToStream(buffer: Buffer): Readable {
//   const readable = new Readable();
//   readable._read = () => {}; // _read is required but we can noop it
//   readable.push(buffer);
//   readable.push(null);
//   return readable;
// }
// /**
//  * Upload QR code to Strapi media library using V5 buffer approach
//  */
// async function uploadQRCode(strapi: StrapiInstance, qrCodeImage: string, userId: number): Promise<any | null> {
//   try {
//     if (!qrCodeImage) {
//       console.error('QR code image is empty');
//       return null;
//     }

//     // Validate and extract base64 data
//     const base64Match = qrCodeImage.match(/^data:image\/(png|jpg|jpeg);base64,/);
//     if (!base64Match) {
//       console.error('Invalid QR code data URL format');
//       return null;
//     }

//     const base64Data = qrCodeImage.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
//     const buffer = Buffer.from(base64Data, 'base64');
//     const imageType = base64Match[1] || 'png';
//     const fileName = `qr_code_${userId}.${imageType}`;
//     const mimeType = `image/${imageType}`;
    
//     console.log(`Attempting to upload QR code for user ${userId}...`);
    
//     // Get the upload service
//     const uploadService = strapi.plugin('upload').service('upload');
    
//     // Convert buffer to stream
//     const stream = bufferToStream(buffer);
    
//     // Upload using uploadStream method with proper file object structure
//     const uploadedFiles = await uploadService.uploadStream({
//       stream,
//       name: fileName,
//       type: mimeType,
//       size: buffer.length,
//     }, {
//       fileInfo: {
//         name: `QR Code for User ${userId}`,
//         alternativeText: `Affiliate referral QR code for user ${userId}`,
//         caption: 'Automatically generated affiliate QR code',
//       },
//     });

//     if (uploadedFiles && uploadedFiles.length > 0) {
//       console.log(`✅ QR code uploaded successfully: ${uploadedFiles[0].url}`);
//       return uploadedFiles[0];
//     } else if (uploadedFiles && !Array.isArray(uploadedFiles)) {
//       // Sometimes it returns a single object instead of array
//       console.log(`✅ QR code uploaded successfully: ${uploadedFiles.url}`);
//       return uploadedFiles;
//     }

//     console.error('Upload returned no files');
//     return null;
//   } catch (error) {
//     console.error('❌ Error uploading QR code:', error);
//     console.error('Error details:', JSON.stringify(error, null, 2));
//     return null;
//   }
// }

// // Extracted functions for afterCreate lifecycle
// async function generateUserEmail(user: User): Promise<{user: User, emailGenerated: boolean}> {
//   const userCopy = { ...user };
//   let emailGenerated = false;

//   // Check if we need to generate an email
//   if (!userCopy.email || (userCopy.email && userCopy.email.startsWith('unset_'))) {
//     // Use phone number to generate email if available
//     if (userCopy.phoneNumber) {
//       const cleanPhone = userCopy.phoneNumber.replace(/^\+/, '').replace(/\D/g, '');
//       userCopy.email = `unset_${cleanPhone}@email.com`;
//       emailGenerated = true;
//     } else {
//       // If no phone number, generate a random email
//       const randomSuffix = crypto.randomBytes(4).toString('hex');
//       userCopy.email = `unset_${randomSuffix}@email.com`;
//       emailGenerated = true;
//     }
//   }

//   return { user: userCopy, emailGenerated };
// }

// async function initializeUserProfiles(
//   strapi: StrapiInstance, 
//   user: User, 
//   emailGenerated: boolean
// ): Promise<void> {
//   const affiliateCode = generateUniqueAffiliateCode();
  
//   // Generate QR code data
//   let qrCodeData = '';
//   if (user.phoneNumber) {
//     qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?afcode=${affiliateCode}&phone=${user.phoneNumber}`;
//   } else {
//     qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?afcode=${affiliateCode}&userId=${user.id}`;
//   }
  
//   // Generate and upload QR code
//   const qrCodeImage = await generateQRCode(qrCodeData);
//   const sessionExpiry = addMonths(new Date(), 6);

//   try {
//     // Upload QR code to media library
//     let qrCodeFileEntry = null;
//     if (qrCodeImage) {
//       //qrCodeFileEntry = await uploadQRCode(strapi, qrCodeImage, user.id);
//       qrCodeFileEntry = await uploadQRCodeWithClient(qrCodeImage, user.id);
//     }

//     // Prepare affiliate profile data with QR code
//     const affiliateProfileData: any = {
//       affiliateCode: affiliateCode,
//       totalReferrals: 0,
//       activeReferrals: 0,
//       totalPoints: 0,
//       totalEarnings: 0,
//       pointsBalance: 0,
//       pendingEarnings: 0,
//       withdrawableBalance: 0,
//       blocked: false,
//       qrCode: qrCodeFileEntry ? qrCodeFileEntry.id : null
//     };

//     // Changed snake_case fields to camelCase to match Strapi schema conventions
//     const updateData = {
//       affiliateProfile: affiliateProfileData,
//       riderProfile: {
//         totalRides: 0,
//         totalSpent: 0,
//         averageRating: 0,
//         isActive: false,
//         completedRides: 0,
//         cancelledRides: 0,
//         totalRatings: 0,
//         savedLocations: JSON.stringify([]),
//         ridePreferences: JSON.stringify({}),
//         blocked: false
//       },
//       driverProfile: {
//         verificationStatus: 'not_started',
//         isActive: false,
//         taxiDriver: null,
//         busDriver: null,
//         motorbikeRider: null,
//         subscriptionStatus: 'inactive',
//         subscriptionPlan: null,
//         currentSubscription: null,
//         blocked: false
//       },
//       deliveryProfile: {
//         verificationStatus: 'not_started',
//         isActive: false,
//         taxi: null,
//         motorbike: null,
//         motorcycle: null,
//         truck: null,
//         blocked: false
//       },
//       conductorProfile: {
//         verificationStatus: 'not_started',
//         isActive: false,
//         assignedDriver: null,
//         blocked: false
//       },
//       sessionExpiry: sessionExpiry,
//       ...(emailGenerated && { email: user.email })
//     };

//     // Try document service first, fallback to db.query
//     // We capture the updated user here to access the created profile IDs
//     let updatedUser;
    
//     if (user.documentId) {
//       updatedUser = await strapi.documents('plugin::users-permissions.user').update({
//         documentId: user.documentId,
//         data: updateData,
//         populate: ['riderProfile', 'driverProfile', 'deliveryProfile', 'conductorProfile', 'affiliateProfile']
//       });
//     } else {
//       // Fallback to db.query
//       updatedUser = await strapi.db.query('plugin::users-permissions.user').update({
//         where: { id: user.id },
//         data: updateData,
//         populate: ['riderProfile', 'driverProfile', 'deliveryProfile', 'conductorProfile', 'affiliateProfile']
//       });
//     }

//     // Extract IDs and save to profileIds field
//     if (updatedUser) {
//       const profileIds = {
//         riderProfileId: updatedUser.riderProfile?.id,
//         driverProfileId: updatedUser.driverProfile?.id,
//         deliveryProfileId: updatedUser.deliveryProfile?.id,
//         conductorProfileId: updatedUser.conductorProfile?.id,
//         affiliateProfileId: updatedUser.affiliateProfile?.id
//       };

//       if (user.documentId) {
//         await strapi.documents('plugin::users-permissions.user').update({
//           documentId: user.documentId,
//           data: { profileIds }
//         });
//       } else {
//         await strapi.db.query('plugin::users-permissions.user').update({
//           where: { id: user.id },
//           data: { profileIds }
//         });
//       }
//     }

//     console.log(`✅ User ${user.id} profiles initialized successfully with QR code`);
//   } catch (error) {
//     console.error('❌ Error initializing user profiles:', error);
//     throw error;
//   }
// }

// async function handleReferralBonus(
//   strapi: StrapiInstance, 
//   user: User
// ): Promise<void> {
//   if (!user.referredBy) {
//     return;
//   }

//   try {
//     const referrer = await strapi.db.query('plugin::users-permissions.user').findOne({
//       where: { id: user.referredBy },
//       populate: ['affiliateProfile']
//     }) as unknown as ReferrerUser;

//     if (!referrer) {
//       console.error(`Referrer with ID ${user.referredBy} not found`);
//       return;
//     }

//     const adminSettings = await strapi.db.query('api::admin-setting.admin-setting').findOne({
//       where: { id: 1 }
//     }) as any;

//     const points = (adminSettings && adminSettings.pointsPerRiderReferral) ? 
//                    adminSettings.pointsPerRiderReferral : 10;

//     const currentAffiliateProfile = referrer.affiliateProfile || {};
    
//     const affiliateProfileUpdate = {
//       affiliateCode: currentAffiliateProfile.affiliateCode || '',
//       qrCode: currentAffiliateProfile.qrCode || null,
//       totalReferrals: (currentAffiliateProfile.totalReferrals || 0) + 1,
//       activeReferrals: (currentAffiliateProfile.activeReferrals || 0) + 1,
//       totalPoints: (currentAffiliateProfile.totalPoints || 0) + points,
//       totalEarnings: currentAffiliateProfile.totalEarnings || 0,
//       pointsBalance: (currentAffiliateProfile.pointsBalance || 0) + points,
//       blocked: currentAffiliateProfile.blocked || false,
//       pendingEarnings: currentAffiliateProfile.pendingEarnings || 0,
//       withdrawableBalance: currentAffiliateProfile.withdrawableBalance || 0
//     }

//     if (referrer.documentId) {
//       await strapi.documents('plugin::users-permissions.user').update({
//         documentId: referrer.documentId,
//         data: {
//           affiliateProfile: affiliateProfileUpdate
//         }
//       })
//     } else {
//       await strapi.db.query('plugin::users-permissions.user').update({
//         where: { id: user.referredBy },
//         data: {
//           affiliateProfile: affiliateProfileUpdate
//         }
//       })
//     }

//     try {
//       await strapi.documents('api::affiliate-transaction.affiliate-transaction').create({
//         data: {
//           transactionId: `AFF-${Date.now()}`,
//           affiliate: user.referredBy,
//           referredUser: user.id,
//           type: 'referral_signup',
//           points: points
//         }
//       });
//     } catch (docError) {
//       await strapi.db.query('api::affiliate-transaction.affiliate-transaction').create({
//         data: {
//           transactionId: `AFF-${Date.now()}`,
//           affiliate: user.referredBy,
//           referredUser: user.id,
//           type: 'referral_signup',
//           points: points
//         }
//       });
//     }

//     if (adminSettings?.smsEnabled && referrer.phoneNumber) {
//       strapi.log?.info(`SMS notification would be sent to ${referrer.phoneNumber} for referral`);
//     }
//   } catch (error) {
//     console.error('Error processing referrer bonus:', error);
//   }
// }

// async function createAuditLog(
//   strapi: StrapiInstance, 
//   user: User
// ): Promise<void> {
//   try {
//     try {
//       await strapi.documents('api::audit-log.audit-log').create({
//         data: {
//           action: 'user_registration',
//           actor: user.id,
//           actorType: 'user',
//           timestamp: new Date(),
//           metadata: {
//             phoneNumber: user.phoneNumber || 'N/A',
//             referredBy: user.referredBy || null
//           }
//         }
//       });
//     } catch (docError) {
//       await strapi.db.query('api::audit-log.audit-log').create({
//         data: {
//           action: 'user_registration',
//           actor: user.id,
//           actorType: 'user',
//           timestamp: new Date(),
//           metadata: {
//             phoneNumber: user.phoneNumber || 'N/A',
//             referredBy: user.referredBy || null
//           }
//         }
//       });
//     }
//   } catch (error) {
//     console.error('Error creating audit log:', error);
//   }
// }

// export async function handleUserCreation(
//   strapi: StrapiInstance, 
//   user: User
// ): Promise<void> {
//   console.log('User creation lifecycle triggered for user:', user.id);
  
//   try {
//     if (!user.id) {
//       console.error('User ID is required for profile initialization');
//       return;
//     }

//     const { user: updatedUser, emailGenerated } = await generateUserEmail(user);
    
//     await initializeUserProfiles(strapi, updatedUser, emailGenerated);
    
//     if (updatedUser.referredBy) {
//       await handleReferralBonus(strapi, updatedUser);
//     }
    
//     await createAuditLog(strapi, updatedUser);
    
//     console.log(`✅ User ${updatedUser.id} profiles initialized successfully`);
//   } catch (error) {
//     console.error('❌ Error in user creation lifecycle:', error);
//   }
// }

// export async function handleUserUpdate(
//   strapi: StrapiInstance, 
//   user: User, 
//   params?: any
// ): Promise<void> {
//   console.log('User update lifecycle triggered for user:', user?.id);
//   strapi.log?.info(`User ${user?.id} was updated`);
// }

// export default {
//   async afterCreate(event: any) {
//     console.log('✅ afterCreate lifecycle triggered');
//     const { result: user } = event;
    
//     console.log('User data received:', {
//       id: user?.id,
//       documentId: user?.documentId,
//       email: user?.email,
//       phoneNumber: user?.phoneNumber,
//       referredBy: user?.referredBy
//     });
    
//     if (!user?.id) {
//       console.error('User ID is missing in afterCreate');
//       return;
//     }
    
//     try {
//       await handleUserCreation(strapi, user);
//     } catch (error) {
//       console.error('Error in afterCreate:', error);
//     }
//   },

//   async afterUpdate(event: any) {
//     console.log('✅ afterUpdate lifecycle triggered');
//     const { result: user } = event;
    
//     if (!user?.id) {
//       console.error('User ID is missing in afterUpdate');
//       return;
//     }
    
//     try {
//       console.log(`User ${user.id} was updated. No further actions to avoid recursion.`);
//     } catch (error) {
//       console.error('Error in afterUpdate:', error);
//     }
//   }
// };
import crypto from 'crypto';
import QRCode from 'qrcode';
import { Readable } from 'stream';
import { uploadQRCodeWithClient } from "../services/uploadQrCode"
import { SendSmsNotification } from '../services/messages'; // ← CHANGE 1: new import
// Interface definitions
interface User {
  id: number;
  documentId?: string;
  email?: string;
  phoneNumber?: string;
  referredBy?: number;
  affiliateProfile?: any;
  riderProfile?: any;
  driverProfile?: any;
  deliveryProfile?: any;
  conductorProfile?: any;
  sessionExpiry?: Date;
  phoneVerified?: boolean;
  activeProfile?: string;
  profileActivityStatus?: any;
}
interface ReferrerUser {
  id: number;
  documentId?: string;
  phoneNumber?: string;
  affiliateProfile?: any;
}
interface StrapiInstance {
  db: {
    query: (uid: string) => {
      update: (params: { where: { id: number }, data: any, populate?: any }) => Promise<any>;
      findOne: (params: { where: { id: number }, populate?: any, select?: any }) => Promise<any>;
      create: (params: { data: any }) => Promise<any>;
    };
  };
  documents: (uid: string) => {
    update: (params: { documentId: string, data: any, populate?: any }) => Promise<any>;
    findOne: (params: { documentId: string, populate?: any, select?: any }) => Promise<any>;
    create: (params: { data: any }) => Promise<any>;
  };
  plugin: (name: string) => {
    service: (serviceName: string) => any;
  };
  query: (uid: string) => {
    findOne: (params: { where: any, populate?: any }) => Promise<any>;
    update: (params: { where: any, data: any }) => Promise<any>;
  };
  entityService: {
    update: (uid: string, id: number, data: any) => Promise<any>;
  };
  log?: {
    error: (message: string, error?: any) => void;
    info: (message: string) => void;
  };
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
/**
 * Convert buffer to readable stream
 */
function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable._read = () => {}; // _read is required but we can noop it
  readable.push(buffer);
  readable.push(null);
  return readable;
}
/**
 * Upload QR code to Strapi media library using V5 buffer approach
 */
async function uploadQRCode(strapi: StrapiInstance, qrCodeImage: string, userId: number): Promise<any | null> {
  try {
    if (!qrCodeImage) {
      console.error('QR code image is empty');
      return null;
    }
    // Validate and extract base64 data
    const base64Match = qrCodeImage.match(/^data:image\/(png|jpg|jpeg);base64,/);
    if (!base64Match) {
      console.error('Invalid QR code data URL format');
      return null;
    }
    const base64Data = qrCodeImage.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const imageType = base64Match[1] || 'png';
    const fileName = `qr_code_${userId}.${imageType}`;
    const mimeType = `image/${imageType}`;
    
    console.log(`Attempting to upload QR code for user ${userId}...`);
    
    // Get the upload service
    const uploadService = strapi.plugin('upload').service('upload');
    
    // Convert buffer to stream
    const stream = bufferToStream(buffer);
    
    // Upload using uploadStream method with proper file object structure
    const uploadedFiles = await uploadService.uploadStream({
      stream,
      name: fileName,
      type: mimeType,
      size: buffer.length,
    }, {
      fileInfo: {
        name: `QR Code for User ${userId}`,
        alternativeText: `Affiliate referral QR code for user ${userId}`,
        caption: 'Automatically generated affiliate QR code',
      },
    });
    if (uploadedFiles && uploadedFiles.length > 0) {
      console.log(`✅ QR code uploaded successfully: ${uploadedFiles[0].url}`);
      return uploadedFiles[0];
    } else if (uploadedFiles && !Array.isArray(uploadedFiles)) {
      // Sometimes it returns a single object instead of array
      console.log(`✅ QR code uploaded successfully: ${uploadedFiles.url}`);
      return uploadedFiles;
    }
    console.error('Upload returned no files');
    return null;
  } catch (error) {
    console.error('❌ Error uploading QR code:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return null;
  }
}
// Extracted functions for afterCreate lifecycle
async function generateUserEmail(user: User): Promise<{user: User, emailGenerated: boolean}> {
  const userCopy = { ...user };
  let emailGenerated = false;
  // Check if we need to generate an email
  if (!userCopy.email || (userCopy.email && userCopy.email.startsWith('unset_'))) {
    // Use phone number to generate email if available
    if (userCopy.phoneNumber) {
      const cleanPhone = userCopy.phoneNumber.replace(/^\+/, '').replace(/\D/g, '');
      userCopy.email = `unset_${cleanPhone}@email.com`;
      emailGenerated = true;
    } else {
      // If no phone number, generate a random email
      const randomSuffix = crypto.randomBytes(4).toString('hex');
      userCopy.email = `unset_${randomSuffix}@email.com`;
      emailGenerated = true;
    }
  }
  return { user: userCopy, emailGenerated };
}
async function initializeUserProfiles(
  strapi: StrapiInstance, 
  user: User, 
  emailGenerated: boolean
): Promise<void> {
  const affiliateCode = generateUniqueAffiliateCode();
  
  // Generate QR code data
  let qrCodeData = '';
  if (user.phoneNumber) {
    qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?afcode=${affiliateCode}&phone=${user.phoneNumber}`;
  } else {
    qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?afcode=${affiliateCode}&userId=${user.id}`;
  }
  
  // Generate and upload QR code
  const qrCodeImage = await generateQRCode(qrCodeData);
  const sessionExpiry = addMonths(new Date(), 6);
  try {
    // Upload QR code to media library
    let qrCodeFileEntry = null;
    if (qrCodeImage) {
      //qrCodeFileEntry = await uploadQRCode(strapi, qrCodeImage, user.id);
      qrCodeFileEntry = await uploadQRCodeWithClient(qrCodeImage, user.id);
    }
    // Prepare affiliate profile data with QR code
    const affiliateProfileData: any = {
      affiliateCode: affiliateCode,
      totalReferrals: 0,
      activeReferrals: 0,
      totalPoints: 0,
      totalEarnings: 0,
      pointsBalance: 0,
      pendingEarnings: 0,
      withdrawableBalance: 0,
      blocked: false,
      qrCode: qrCodeFileEntry ? qrCodeFileEntry.id : null
    };
    // Changed snake_case fields to camelCase to match Strapi schema conventions
    const updateData = {
      affiliateProfile: affiliateProfileData,
      riderProfile: {
        totalRides: 0,
        totalSpent: 0,
        averageRating: 0,
        isActive: false,
        completedRides: 0,
        cancelledRides: 0,
        totalRatings: 0,
        savedLocations: JSON.stringify([]),
        ridePreferences: JSON.stringify({}),
        blocked: false
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
    };
    // Try document service first, fallback to db.query
    // We capture the updated user here to access the created profile IDs
    let updatedUser;
    
    if (user.documentId) {
      updatedUser = await strapi.documents('plugin::users-permissions.user').update({
        documentId: user.documentId,
        data: updateData,
        populate: ['riderProfile', 'driverProfile', 'deliveryProfile', 'conductorProfile', 'affiliateProfile']
      });
    } else {
      // Fallback to db.query
      updatedUser = await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: updateData,
        populate: ['riderProfile', 'driverProfile', 'deliveryProfile', 'conductorProfile', 'affiliateProfile']
      });
    }
    // Extract IDs and save to profileIds field
    if (updatedUser) {
      const profileIds = {
        riderProfileId: updatedUser.riderProfile?.id,
        driverProfileId: updatedUser.driverProfile?.id,
        deliveryProfileId: updatedUser.deliveryProfile?.id,
        conductorProfileId: updatedUser.conductorProfile?.id,
        affiliateProfileId: updatedUser.affiliateProfile?.id
      };
      if (user.documentId) {
        await strapi.documents('plugin::users-permissions.user').update({
          documentId: user.documentId,
          data: { profileIds }
        });
      } else {
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: { profileIds }
        });
      }
    }
    console.log(`✅ User ${user.id} profiles initialized successfully with QR code`);
  } catch (error) {
    console.error('❌ Error initializing user profiles:', error);
    throw error;
  }
}
async function handleReferralBonus(
  strapi: StrapiInstance, 
  user: User
): Promise<void> {
  if (!user.referredBy) {
    return;
  }
  try {
    const referrer = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.referredBy },
      populate: ['affiliateProfile']
    }) as unknown as ReferrerUser;
    if (!referrer) {
      console.error(`Referrer with ID ${user.referredBy} not found`);
      return;
    }
    const adminSettings = await strapi.db.query('api::admin-setting.admin-setting').findOne({
      where: { id: 1 }
    }) as any;
    const points = (adminSettings && adminSettings.pointsPerRiderReferral) ? 
                   adminSettings.pointsPerRiderReferral : 10;
    const currentAffiliateProfile = referrer.affiliateProfile || {};
    
    const affiliateProfileUpdate = {
      affiliateCode: currentAffiliateProfile.affiliateCode || '',
      qrCode: currentAffiliateProfile.qrCode || null,
      totalReferrals: (currentAffiliateProfile.totalReferrals || 0) + 1,
      activeReferrals: (currentAffiliateProfile.activeReferrals || 0) + 1,
      totalPoints: (currentAffiliateProfile.totalPoints || 0) + points,
      totalEarnings: currentAffiliateProfile.totalEarnings || 0,
      pointsBalance: (currentAffiliateProfile.pointsBalance || 0) + points,
      blocked: currentAffiliateProfile.blocked || false,
      pendingEarnings: currentAffiliateProfile.pendingEarnings || 0,
      withdrawableBalance: currentAffiliateProfile.withdrawableBalance || 0
    }
    if (referrer.documentId) {
      await strapi.documents('plugin::users-permissions.user').update({
        documentId: referrer.documentId,
        data: {
          affiliateProfile: affiliateProfileUpdate
        }
      })
    } else {
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.referredBy },
        data: {
          affiliateProfile: affiliateProfileUpdate
        }
      })
    }
    try {
      await strapi.documents('api::affiliate-transaction.affiliate-transaction').create({
        data: {
          transactionId: `AFF-${Date.now()}`,
          affiliate: user.referredBy,
          referredUser: user.id,
          type: 'referral_signup',
          points: points
        }
      });
    } catch (docError) {
      await strapi.db.query('api::affiliate-transaction.affiliate-transaction').create({
        data: {
          transactionId: `AFF-${Date.now()}`,
          affiliate: user.referredBy,
          referredUser: user.id,
          type: 'referral_signup',
          points: points
        }
      });
    }
    if (adminSettings?.smsEnabled && referrer.phoneNumber) {
      strapi.log?.info(`SMS notification would be sent to ${referrer.phoneNumber} for referral`);
    }
  } catch (error) {
    console.error('Error processing referrer bonus:', error);
  }
}
async function createAuditLog(
  strapi: StrapiInstance, 
  user: User
): Promise<void> {
  try {
    try {
      await strapi.documents('api::audit-log.audit-log').create({
        data: {
          action: 'user_registration',
          actor: user.id,
          actorType: 'user',
          timestamp: new Date(),
          metadata: {
            phoneNumber: user.phoneNumber || 'N/A',
            referredBy: user.referredBy || null
          }
        }
      });
    } catch (docError) {
      await strapi.db.query('api::audit-log.audit-log').create({
        data: {
          action: 'user_registration',
          actor: user.id,
          actorType: 'user',
          timestamp: new Date(),
          metadata: {
            phoneNumber: user.phoneNumber || 'N/A',
            referredBy: user.referredBy || null
          }
        }
      });
    }
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}
export async function handleUserCreation(
  strapi: StrapiInstance, 
  user: User
): Promise<void> {
  console.log('User creation lifecycle triggered for user:', user.id);
  
  try {
    if (!user.id) {
      console.error('User ID is required for profile initialization');
      return;
    }
    const { user: updatedUser, emailGenerated } = await generateUserEmail(user);
    
    await initializeUserProfiles(strapi, updatedUser, emailGenerated);
    
    if (updatedUser.referredBy) {
      await handleReferralBonus(strapi, updatedUser);
    }
    
    await createAuditLog(strapi, updatedUser);
    
    console.log(`✅ User ${updatedUser.id} profiles initialized successfully`);
  } catch (error) {
    console.error('❌ Error in user creation lifecycle:', error);
  }
}
// ← CHANGE 2: handleUserUpdate stub replaced with real implementation
export async function handleUserUpdate(
  strapi: StrapiInstance,
  user: User,
  params?: any,
): Promise<void> {
  console.log('User update lifecycle triggered for user:', user?.id);
  strapi.log?.info(`User ${user?.id} was updated`);

  try {
    // Only proceed when this update explicitly sets verificationStatus to "approved"
    const incomingStatus = params?.data?.driverProfile?.verificationStatus;
    if (incomingStatus !== 'approved') return;

    // Re-fetch the full user so we have phone details and can confirm the DB committed
    const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where:    { id: user.id },
      select:   ['id', 'firstName', 'lastName', 'username', 'phoneNumber'],
      populate: { driverProfile: { select: ['id', 'verificationStatus'] } },
    });

    if (!fullUser) {
      strapi.log?.info(`[lifecycle:update] Could not fetch user ${user.id} — aborting`);
      return;
    }

    // Double-check the DB record is now approved (guards against race conditions)
    if (fullUser.driverProfile?.verificationStatus !== 'approved') {
      strapi.log?.info(`[lifecycle:update] User ${user.id} driverProfile not yet approved in DB — skipping SMS`);
      return;
    }

    // Resolve phone — prefer username if it looks like a phone number, else phoneNumber field
    const isPhoneNumber = (str: string): boolean => {
      if (!str) return false;
      const digits = str.replace(/[\s\-().+]/g, '');
      return /^\d{7,15}$/.test(digits);
    };
    const phone: string | null = isPhoneNumber(fullUser.username || '')
      ? fullUser.username
      : (fullUser.phoneNumber || null);

    if (!phone) {
      strapi.log?.info(`[lifecycle:update] No phone number for user ${user.id} — skipping SMS`);
      return;
    }

    // Build and send the approval message
    const firstName = fullUser.firstName?.trim() || '';
    const lastName  = fullUser.lastName?.trim()  || '';
    const name      = [firstName, lastName].filter(Boolean).join(' ') || 'driver';

    const message =
      `Dear ${name}, your Okrarides account has been approved, ` +
      `you can now receive orders, open the app and start earning now!`;

    SendSmsNotification(phone, message);
    strapi.log?.info(`[lifecycle:update] Approval SMS sent to driver ${user.id} (${phone})`);

  } catch (error) {
    console.error(`❌ Error in handleUserUpdate for user ${user?.id}:`, error);
  }
}
export default {
  async afterCreate(event: any) {
    console.log('✅ afterCreate lifecycle triggered');
    const { result: user } = event;
    
    console.log('User data received:', {
      id: user?.id,
      documentId: user?.documentId,
      email: user?.email,
      phoneNumber: user?.phoneNumber,
      referredBy: user?.referredBy
    });
    
    if (!user?.id) {
      console.error('User ID is missing in afterCreate');
      return;
    }
    
    try {
      await handleUserCreation(strapi, user);
    } catch (error) {
      console.error('Error in afterCreate:', error);
    }
  },
  async afterUpdate(event: any) {
    console.log('✅ afterUpdate lifecycle triggered');
    const { result: user, params } = event; // ← CHANGE 3: destructure params
    
    if (!user?.id) {
      console.error('User ID is missing in afterUpdate');
      return;
    }
    
    try {
      await handleUserUpdate(strapi, user, params); // ← CHANGE 3: call handleUserUpdate
    } catch (error) {
      console.error('Error in afterUpdate:', error);
    }
  }
};