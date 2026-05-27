// src/api/vehicle/content-types/vehicle/lifecycles.ts

const VEHICLE_UID = 'api::vehicle.vehicle';
const USER_UID = 'plugin::users-permissions.user';

// ─── Types ──────────────────────────────────────────────────────────────────

type VehicleLink = {
    apiPath: string;
    id: number | null;
};

// ─── Keys that directly hold a vehicle id, object, or array ─────────────────
//
// "vehicle"        → taxiDriver.vehicle  and all delivery sub-components
// "bus"            → busDriver.bus        (driver controller uses "bus")
// "motorbike"      → motorbikeRider.motorbike (driver controller uses "motorbike")
// "assignedVehicle"→ driverProfile direct relation
// "vehicles"       → driverProfile array relation
//
// Delivery sub-component keys ("taxi", "motorbike", "motorcycle", "truck") are
// intentionally ABSENT — they hold sub-component objects, not vehicle ids.
// collectVehicleLinks recurses into them and finds the nested "vehicle" key.

const VEHICLE_RELATION_KEYS = new Set([
    'assignedVehicle',
    'vehicles',
    'vehicle',
    'bus',
    'motorbike',
]);

// ─── Populate spec ───────────────────────────────────────────────────────────
//
// Must reach every nested field that could hold a vehicle reference so that
// collectVehicleLinks can find all of them.
//
// Each driver sub-component uses a DIFFERENT field name:
//   taxiDriver     → vehicle
//   busDriver      → bus       ← not "vehicle"
//   motorbikeRider → motorbike ← not "vehicle"
//
// All delivery sub-components use "vehicle" uniformly.

const USER_VEHICLE_POPULATE = {
    driverProfile: {
        populate: {
            assignedVehicle: true,
            vehicles: true,
            taxiDriver: { populate: { vehicle: true } },
            busDriver: { populate: { bus: true } },
            motorbikeRider: { populate: { motorbike: true } },
        },
    },
    deliveryProfile: {
        populate: {
            taxi: { populate: { vehicle: true } },
            motorbike: { populate: { vehicle: true } },
            motorcycle: { populate: { vehicle: true } },
            truck: { populate: { vehicle: true } },
        },
    },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const asId = (value: any): number | null => {
    if (value == null) return null;
    if (typeof value === 'object') {
        return Number(value.id ?? value.value ?? null) || null;
    }
    return Number(value) || null;
};

const deepClone = <T>(value: T): T =>
    JSON.parse(JSON.stringify(value ?? null));

const containsVehicle = (value: any, vehicleId: number): boolean => {
    if (Array.isArray(value)) return value.some((item) => asId(item) === vehicleId);
    return asId(value) === vehicleId;
};

// Null-out or filter the value at `path` inside `obj`. Mutates in-place.
const removeVehicleFromPath = (
    obj: Record<string, any>,
    path: string,
    vehicleId: number,
): void => {
    if (!obj || !path) return;

    const parts = path.split('.');
    let cursor: any = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (!cursor[key] || typeof cursor[key] !== 'object') return;
        cursor = cursor[key];
    }

    const lastKey = parts[parts.length - 1];
    const current = cursor[lastKey];

    if (Array.isArray(current)) {
        cursor[lastKey] = current.filter((item: any) => asId(item) !== vehicleId);
    } else {
        cursor[lastKey] = null;
    }
};

// Walk the populated user object and collect every dot-notation path where
// vehicleId appears under a recognised relation key.
//
// Paths produced for the driver profile:
//   driverProfile.assignedVehicle
//   driverProfile.vehicles
//   driverProfile.taxiDriver.vehicle
//   driverProfile.busDriver.bus
//   driverProfile.motorbikeRider.motorbike
//
// Paths produced for the delivery profile:
//   deliveryProfile.taxi.vehicle
//   deliveryProfile.motorbike.vehicle
//   deliveryProfile.motorcycle.vehicle
//   deliveryProfile.truck.vehicle

const collectVehicleLinks = (
    node: any,
    vehicleId: number,
    currentPath = '',
    results: VehicleLink[] = [],
): VehicleLink[] => {
    if (!node || typeof node !== 'object') return results;

    if (Array.isArray(node)) {
        node.forEach((item, index) =>
            collectVehicleLinks(item, vehicleId, `${currentPath}[${index}]`, results)
        );
        return results;
    }

    for (const [key, value] of Object.entries(node)) {
        const nextPath = currentPath ? `${currentPath}.${key}` : key;

        if (VEHICLE_RELATION_KEYS.has(key) && containsVehicle(value, vehicleId)) {
            results.push({ apiPath: nextPath, id: asId(node.id) });
        }

        if (value && typeof value === 'object') {
            collectVehicleLinks(value, vehicleId, nextPath, results);
        }
    }

    return results;
};

// Build a patch object keyed by top-level user field ("driverProfile",
// "deliveryProfile"). Each value is a deep clone with all vehicle references
// removed. Applied via entityService.update(USER_UID, driverId, { data: patch }).
const buildRemovalPatch = (
    user: Record<string, any>,
    links: VehicleLink[],
    vehicleId: number,
): Record<string, any> => {
    const roots = new Map<string, any>();

    for (const link of links) {
        if (!link?.apiPath) continue;

        const [root, ...rest] = link.apiPath.split('.');
        if (!root || !user?.[root]) continue;

        if (!roots.has(root)) roots.set(root, deepClone(user[root]));

        if (rest.length > 0) {
            removeVehicleFromPath(roots.get(root)!, rest.join('.'), vehicleId);
        }
    }

    return Object.fromEntries(roots);
};

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export default {
    // Capture the assignedDriver before the update so afterUpdate can compare.
    async beforeUpdate(event: any) {
        const vehicleId = event?.params?.where?.id;
        if (!vehicleId) return;

        try {
            event.state.previousVehicle = await strapi.entityService.findOne(
                VEHICLE_UID,
                vehicleId,
                { populate: { assignedDriver: true } },
            );
        } catch (err) {
            strapi.log.error('[Vehicle Lifecycle] beforeUpdate failed:', err);
        }
    },

    async afterUpdate(event: any) {
        const previousVehicle = event?.state?.previousVehicle;
        const vehicleId = event?.result?.id ?? previousVehicle?.id;
        if (!vehicleId) return;

        const prevDriverId = asId((previousVehicle as any)?.assignedDriver);

        // ── Only run when there was already a driver assigned ────────────────
        // prevDriverId === null means this is the very first assignment.
        // There is nothing to clean up, so bail immediately.
        if (!prevDriverId) return;

        let currentVehicle: any;
        try {
            currentVehicle = await strapi.entityService.findOne(
                VEHICLE_UID,
                vehicleId,
                { populate: { assignedDriver: true } },
            );
        } catch (err) {
            strapi.log.error('[Vehicle Lifecycle] afterUpdate vehicle fetch failed:', err);
            return;
        }

        const currentDriverId = asId((currentVehicle as any)?.assignedDriver);

        // ── No change in driver — nothing to do ──────────────────────────────
        if (prevDriverId === currentDriverId) return;

        // ── Driver changed (swap or removal) — clean up the previous driver ──
        strapi.log.info(
            `[Vehicle Lifecycle] vehicle ${vehicleId}: driver changed ` +
            `${prevDriverId} → ${currentDriverId ?? 'none'}, cleaning up driver ${prevDriverId}`,
        );

        try {
            const previousDriver = await strapi.entityService.findOne(
                USER_UID,
                prevDriverId,
                { populate: USER_VEHICLE_POPULATE as any },
            );

            if (!previousDriver) {
                strapi.log.warn(
                    `[Vehicle Lifecycle] previous driver ${prevDriverId} not found, skipping cleanup`
                );
                return;
            }

            const links = collectVehicleLinks(previousDriver as any, vehicleId);

            if (links.length === 0) {
                strapi.log.info(
                    `[Vehicle Lifecycle] no links found for vehicle ${vehicleId} on driver ${prevDriverId}`
                );
                return;
            }

            strapi.log.info(
                `[Vehicle Lifecycle] removing ${links.length} link(s): ` +
                links.map(l => l.apiPath).join(', ')
            );

            const patch = buildRemovalPatch(previousDriver as any, links, vehicleId);

            if (Object.keys(patch).length > 0) {
                await strapi.entityService.update(
                    USER_UID,
                    prevDriverId,
                    { data: patch },
                );

                strapi.log.info(
                    `[Vehicle Lifecycle] cleaned vehicle ${vehicleId} from driver ${prevDriverId}`
                );
            }
        } catch (err) {
            strapi.log.error(
                `[Vehicle Lifecycle] failed to clean up driver ${prevDriverId}:`,
                err,
            );
        }
    },
} as any;