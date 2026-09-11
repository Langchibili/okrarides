

//============================================
// src/api/document/controllers/document.ts
//============================================
import { factories } from '@strapi/strapi';

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  
  // Upload document
  async uploadDocument(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { documentType, files } = ctx.request.body;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      // Update driver profile with document - preserving existing data
      const updates: any = { ...user.driverProfile };
      
      switch(documentType) {
        case 'drivers_license':
          updates.driverLicenseFront = files[0];
          updates.driverLicenseBack = files[1];
          break;
        case 'national_id':
          updates.nationalIdFront = files[0];
          updates.nationalIdBack = files[1];
          break;
        case 'proof_of_address':
          updates.proofOfAddress = files[0];
          break;
      }

      // If all required documents uploaded, set to pending
      const hasAllDocs = updates.driverLicenseFront && updates.nationalIdFront;
      if (hasAllDocs && user.driverProfile.verificationStatus === 'not_started') {
        updates.verificationStatus = 'pending';
      }

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: { driverProfile: updates }
      });

      return ctx.send({ 
        message: 'Document uploaded successfully',
        verificationStatus: updates.verificationStatus 
      });
    } catch (error) {
      strapi.log.error('Upload document error:', error);
      return ctx.internalServerError('Failed to upload document');
    }
  },

  // Get verification status
  async getVerificationStatus(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const profile = user.driverProfile;
      
      return ctx.send({
        verificationStatus: profile.verificationStatus,
        documents: {
          driversLicense: {
            uploaded: !!(profile.driverLicenseFront && profile.driverLicenseBack),
            expiryDate: profile.licenseExpiryDate,
          },
          nationalId: {
            uploaded: !!(profile.nationalIdFront && profile.nationalIdBack),
            number: profile.nationalIdNumber,
          },
          proofOfAddress: {
            uploaded: !!profile.proofOfAddress,
          },
        },
        verificationNotes: profile.verificationNotes,
        verifiedAt: profile.verifiedAt,
      });
    } catch (error) {
      strapi.log.error('Get verification status error:', error);
      return ctx.internalServerError('Failed to get verification status');
    }
  },
}));

