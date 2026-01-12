// src/api/affiliate-transaction/content-types/affiliate-transaction/lifecycles.js

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Populate relations
    const transaction = await strapi.db.query('api::affiliate-transaction.affiliate-transaction').findOne({
      where: { id: result.id },
      populate: ['affiliate', 'referredUser', 'ride'],
    });

    const affiliateId = transaction.affiliate?.id || transaction.affiliate;

    // Notify affiliate
    if (transaction.type === 'referral_signup') {
      strapi.socketService.emitAffiliateReferralSignup(
        affiliateId,
        transaction.referredUser,
        transaction.pointsEarned
      );
    } else if (transaction.type === 'commission') {
      strapi.socketService.emitAffiliateCommissionEarned(
        affiliateId,
        transaction.amount,
        transaction.ride?.id || transaction.ride,
        transaction.pointsEarned
      );
    }
  },
}