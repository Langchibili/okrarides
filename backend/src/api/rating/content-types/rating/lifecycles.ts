// src/api/rating/content-types/rating/lifecycles.ts

import socketService from '../../../../services/socketService';

export default {
  /**
   * Triggered after a rating is created
   */
  async afterCreate(event: any) {
    const { result } = event;

    // Populate relations to get user and ride data
    const rating: any = await strapi.db.query('api::rating.rating').findOne({
      where: { id: result.id },
      populate: ['user', 'ride'],
    });

    if (!rating) return;

    // rating.user is the person being rated
    const userId = rating.user?.id || rating.user;
    
    // userType represents the perspective of the person who SUBMITTED the rating
    // e.g., if a rider rated a driver, ratedBy is 'rider'
    const userType = rating.ratedBy; 

    // Confirm rating submission via socket service
    socketService.emitRatingSubmitted(
      userId,
      userType,
      rating.ride?.id || rating.ride,
      rating.rating
    );
  },
};