// src/api/shared/utils/country-pricing.ts

/**
 * Resolves the authenticated user's linked country ID.
 * Returns null if the user is unauthenticated or has no country set.
 */
export async function getUserCountryId(
    strapi: any,
    userId: number | undefined,
): Promise<number | null> {
    if (!userId) return null;

    const user = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({
            where: { id: userId },
            populate: { country: true },
        });

    return user?.country?.id ?? null;
}

/**
 * Finds an active country-specific pricing entry from a class's
 * `countries` repeatable component array.
 * Returns null if no match is found or the entry is inactive.
 */
export function resolveCountryPricing(
    countriesComponent: any[] | undefined,
    userCountryId: number | null,
): Record<string, number> | null {
    if (!userCountryId || !countriesComponent?.length) return null;

    return (
        countriesComponent.find(
            (entry: any) =>
                entry.country?.id === userCountryId && entry.isActive === true,
        ) ?? null
    );
}

/**
 * Returns true if a class should be shown to the user.
 * A class is visible if:
 *   - its own `isActive` is true, OR
 *   - it has an active country entry for the user's country
 */
export function isClassVisibleForCountry(
    classRecord: any,
    userCountryId: number | null,
): boolean {
    if (classRecord.isActive) return true;
    if (!userCountryId) return false;

    return (classRecord.countries ?? []).some(
        (entry: any) =>
            entry.country?.id === userCountryId && entry.isActive === true,
    );
}