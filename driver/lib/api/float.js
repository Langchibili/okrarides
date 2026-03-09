// PATH: driver/lib/api/float.js

import { apiClient } from './client';

/**
 * Creates a float top-up intent record in the DB.
 *
 * Generates a unique topupId on the client (FT-{timestamp}) so the record
 * is identifiable before the gateway reference is known.
 *
 * Returns the Strapi-created record — callers should use `res.data.id` (the
 * numeric Strapi id) as `relatedEntityId` when opening OkraPayModal.
 *
 * @param {number} amount   - Top-up amount (numeric, e.g. 100)
 * @param {string} currency - Optional currency string label/code (informational;
 *                            the currency relation is resolved server-side)
 * @returns {Promise<{ data: { id: number, attributes: object } }>}
 */
export async function createFloatTopupIntent(amount, driver = null, paymentMethod="okrapay", currency = 'ZMW') {
  const topupId = `FT-${Date.now()}`;

  const res = await apiClient.post('/float-topups', {
    data: {
      topupId,
      amount,
      driver: driver?.id,
      paymentMethod: paymentMethod,
      floatStatus:   'pending',
      requestedAt:   new Date().toISOString(),
    },
  });

  return res;
}

/**
 * Fetches a single float top-up record by its Strapi id.
 *
 * @param {number|string} id
 */
export async function getFloatTopup(id) {
  return apiClient.get(`/float-topups/${id}`);
}

/**
 * Fetches the current driver's float top-up history.
 *
 * @param {{ page?: number, pageSize?: number }} pagination
 */
export async function getFloatTopupHistory({ page = 1, pageSize = 20 } = {}) {
  return apiClient.get(
    `/float-topups?sort=requestedAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=currency`
  );
}