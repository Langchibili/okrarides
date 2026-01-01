// src/api/ride/utils/generateRideCode.ts

import { customAlphabet } from 'nanoid';

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

interface RideCodeConfig {
  prefix?: string;
  maxAttempts?: number;
}

/**
 * Generates a unique ride code in format: RIDE-ABC123
 * @param config - Optional configuration
 * @returns Promise resolving to unique ride code
 */
export async function generateUniqueRideCode(
  config: RideCodeConfig = {}
): Promise<string> {
  const { prefix = 'RIDE', maxAttempts = 10 } = config;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateCode();
    const rideCode = `${prefix}-${code}`;

    // Access global strapi instance
    const existingRide = await strapi.db.query('api::ride.ride').findOne({
      where: { rideCode },
      select: ['id'],
    });

    if (!existingRide) {
      return rideCode;
    }
  }

  // Fallback with timestamp
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
  const fallbackCode = `${prefix}-${timestamp}`;
  
  strapi.log.warn(
    `Failed to generate unique ride code after ${maxAttempts} attempts. Using fallback: ${fallbackCode}`
  );
  
  return fallbackCode;
}

/**
 * Validates a ride code format
 * @param rideCode - The ride code to validate
 * @returns True if valid format
 */
export function isValidRideCodeFormat(rideCode: string): boolean {
  if (!rideCode || typeof rideCode !== 'string') {
    return false;
  }
  
  const regex = /^[A-Z]+-[A-Z0-9]{6,}$/;
  return regex.test(rideCode);
}

/**
 * Checks if a ride code exists in the database
 * @param rideCode - The ride code to check
 * @returns Promise resolving to true if exists
 */
export async function rideCodeExists(rideCode: string): Promise<boolean> {
  if (!isValidRideCodeFormat(rideCode)) {
    return false;
  }

  const existingRide = await strapi.db.query('api::ride.ride').findOne({
    where: { rideCode },
    select: ['id'],
  });

  return !!existingRide;
}