//============================================
// src/api/vehicle/controllers/vehicle.ts
//============================================
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::vehicle.vehicle', ({ strapi }) => ({
  async find(ctx) {
    // Add custom query logic if needed
    return await super.find(ctx);
  },

  async findOne(ctx) {
    const { id } = ctx.params;

    // Use db.query to find by the numerical 'id'
    const entity = await strapi.db.query('api::vehicle.vehicle').findOne({
      where: { id: id },
      populate: true, // or specify your relations ['driver', 'user']
    });

    if (!entity) {
      return ctx.notFound();
    }

    // Sanitize the output to remove private fields (passwords, etc)
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    
    return this.transformResponse(sanitizedEntity);
  },

  async create(ctx) {
    return await super.create(ctx)
  },
  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body; // Standard Strapi wrapper { data: { ... } }

    // 1. Perform the update using the low-level db.query
    // This allows targeting the numerical 'id' directly
    const updatedEntity = await strapi.db.query('api::vehicle.vehicle').update({
      where: { id: id },
      data: data,
      populate: true, // Populates relations so the response is complete
    });

    // 2. Handle 404 if record doesn't exist
    if (!updatedEntity) {
      return ctx.notFound('Vehicle not found');
    }

    // 3. Sanitize the output 
    // This removes sensitive fields based on the Content-Type permissions
    const sanitizedEntity = await this.sanitizeOutput(updatedEntity, ctx);

    // 4. Transform to standard Strapi JSON API response
    // This wraps the result in { data: { id, attributes: ... } } (v4) or { data: { ... } } (v5)
    return this.transformResponse(sanitizedEntity);
  },

 async delete(ctx) {
  const { id } = ctx.params;

  // 1. Perform the deletion using the low-level db.query
  // This targets the numerical 'id' directly. 
  // We use .delete() which returns the deleted record's data.
  const deletedEntity = await strapi.db.query('api::vehicle.vehicle').delete({
    where: { id: id },
    populate: true, // Optional: populate if you need the response to show relations
  });

  // 2. Handle 404 if the record didn't exist
  if (!deletedEntity) {
    return ctx.notFound('Vehicle not found');
  }

  // 3. Sanitize the output
  // Removes sensitive data (like creator information or private fields)
  const sanitizedEntity = await this.sanitizeOutput(deletedEntity, ctx);

  // 4. Transform to standard Strapi JSON API response
  // Returns the deleted record wrapped in the standard { data: ... } format
  return this.transformResponse(sanitizedEntity);
},
  // Get driver's vehicles
  async findOwn(ctx) {
    try {
      const userId = ctx.state.user.id;

      const vehicles = await strapi.db.query('api::vehicle.vehicle').findMany({
        where: { owner: userId },
        populate: ['taxiType', 'rideClass']
      });

      return ctx.send(vehicles);
    } catch (error) {
      strapi.log.error('Find vehicles error:', error);
      return ctx.internalServerError('Failed to get vehicles');
    }
  },
}));

