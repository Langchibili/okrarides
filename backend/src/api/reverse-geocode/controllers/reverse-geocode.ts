import { factories } from '@strapi/strapi';
import { reverseGeocode } from '../../../services/mapProviderService';


export default factories.createCoreController('api::device.device', ({ strapi }) => ({
  async reverseGeocode(ctx) {
    try {
      const { location } = ctx.request.body;

      if (!location || typeof location !== 'object') {
        return ctx.badRequest('Location object is required');
      }

      // Handle both {latitude, longitude} and {lat, lng} formats
      const latitude = location.latitude ?? location.lat;
      const longitude = location.longitude ?? location.lng;

      if (latitude === undefined || latitude === null) {
        return ctx.badRequest('Location must include a latitude (or lat) field');
      }
      if (longitude === undefined || longitude === null) {
        return ctx.badRequest('Location must include a longitude (or lng) field');
      }

      let locationDetails: any = {
        latitude,
        longitude,
        ...(location.accuracy !== undefined && { accuracy: location.accuracy }),
        ...(location.altitude !== undefined && { altitude: location.altitude }),
        ...(location.altitudeAccuracy !== undefined && { altitudeAccuracy: location.altitudeAccuracy }),
        ...(location.heading !== undefined && { heading: location.heading }),
        ...(location.speed !== undefined && { speed: location.speed }),
        timestamp: location.timestamp
          ? new Date(location.timestamp).toISOString()
          : new Date().toISOString(),
      };

      try {
        const geocodingData = await reverseGeocode(latitude, longitude);

        if (geocodingData) {
          locationDetails = {
            ...locationDetails,
            name: geocodingData.name,
            address: geocodingData.address,
            placeId: geocodingData.placeId,
            city: geocodingData.city,
            country: geocodingData.country,
            postalCode: geocodingData.postalCode,
            state: geocodingData.state,
            streetAddress: geocodingData.streetAddress,
            streetNumber: geocodingData.streetNumber,
          };
        } else {
          console.warn('[reverseGeocode controller] No geocoding result from any provider');
        }
      } catch (geocodingError) {
        console.error('[reverseGeocode controller] Geocoding error (non-fatal):', geocodingError);
      }

      ctx.send({
        success: true,
        location: locationDetails,
      });
    } catch (error) {
      console.error('[reverseGeocode controller] Error:', error);
      ctx.internalServerError('Failed to reverse geocode location');
    }
  }
}));