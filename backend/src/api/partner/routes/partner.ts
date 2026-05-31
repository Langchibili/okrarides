// PATH: src/api/partner/routes/partner.ts
// ============================================================
// Partner Fleet Dashboard — Custom Routes
//
// All routes require a valid JWT. The partner controller's
// requireApprovedPartner() guard enforces APPROVED status on
// every handler internally — no separate Strapi policy needed.
// ============================================================

export default {
    routes: [
        // ── Dashboard summary ───────────────────────────────────────────────────
        {
            method: 'GET',
            path: '/partner/dashboard',
            handler: 'partner.getDashboard',
            config: { policies: [], middlewares: [] },
        },

        // ── Driver management ───────────────────────────────────────────────────
        {
            // List fleet drivers (with search/filter)
            method: 'GET',
            path: '/partner/drivers',
            handler: 'partner.getDrivers',
            config: { policies: [], middlewares: [] },
        },
        {
            // Register a new driver + vehicle atomically
            method: 'POST',
            path: '/partner/drivers/register',
            handler: 'partner.registerDriver',
            config: { policies: [], middlewares: [] },
        },
        {
            // Per-driver metrics + float history + daily breakdown
            method: 'GET',
            path: '/partner/drivers/:id/metrics',
            handler: 'partner.getDriverMetrics',
            config: { policies: [], middlewares: [] },
        },
        {
            // Cancel a ride or delivery on behalf of the driver
            method: 'GET',
            path: '/partner/drivers/:id/deliveries',
            handler: 'partner.getDriverDeliveries',
            config: { policies: [], middlewares: [] },
        },

        // ── Support ──────────────────────────────────────────────────────────────
        {
            // Send a support message to Okra admin
            method: 'GET',
            path: '/partner/drivers/:id/rides',
            handler: 'partner.getDriverRides',
            config: { policies: [], middlewares: [] },
        },
        {
            // Credit or debit a specific driver's float
            method: 'PUT',
            path: '/partner/drivers/:id/float',
            handler: 'partner.modifyDriverFloat',
            config: { policies: [], middlewares: [] },
        },
        {
            // Report a driver to Okra admin
            method: 'POST',
            path: '/partner/drivers/:id/report',
            handler: 'partner.reportDriver',
            config: { policies: [], middlewares: [] },
        },

        // ── Vehicle management ───────────────────────────────────────────────────
        {
            // List fleet vehicles
            method: 'GET',
            path: '/partner/vehicles',
            handler: 'partner.getVehicles',
            config: { policies: [], middlewares: [] },
        },
        {
            // Add a standalone vehicle to the fleet
            method: 'POST',
            path: '/partner/vehicles',
            handler: 'partner.addVehicle',
            config: { policies: [], middlewares: [] },
        },
        {
            // Assign (or unassign when driverId is omitted) a vehicle to a driver
            method: 'PUT',
            path: '/partner/vehicles/:id/assign',
            handler: 'partner.assignVehicle',
            config: { policies: [], middlewares: [] },
        },

        // ── Partner float wallet ─────────────────────────────────────────────────
        {
            // Create a pending float-topup record; returns ID for OkraPay modal
            method: 'POST',
            path: '/partner/float/topup',
            handler: 'partner.initiateFloatTopup',
            config: { policies: [], middlewares: [] },
        },

        // ── Fleet map ────────────────────────────────────────────────────────────
        {
            // Lightweight location poll — called every 10 minutes by the dashboard
            method: 'GET',
            path: '/partner/fleet/locations',
            handler: 'partner.getFleetLocations',
            config: { policies: [], middlewares: [] },
        },
        {
            method: 'GET',
            path: '/partner/fleet/all',
            handler: 'partner.getPartnerAllFleetItems',
            config: { policies: [] }
        },

        // ── Rides & deliveries ───────────────────────────────────────────────────
        {
            // Paginated list of all fleet rides + deliveries
            method: 'GET',
            path: '/partner/rides',
            handler: 'partner.getFleetRides',
            config: { policies: [], middlewares: [] },
        },
        {
            method: 'GET',
            path: '/partner/rides',
            handler: 'partner.getPartnerRides',
            config: { policies: [] }
        },
        {
            method: 'GET',
            path: '/partner/deliveries',
            handler: 'partner.getPartnerDeliveries',
            config: { policies: [] }
        },

        {
            // Single ride or delivery detail
            method: 'GET',
            path: '/partner/rides/:id',
            handler: 'partner.getRide',
            config: { policies: [], middlewares: [] },
        },
        {
            // Cancel a ride or delivery on behalf of the driver
            method: 'POST',
            path: '/partner/rides/:id/cancel',
            handler: 'partner.cancelRide',
            config: { policies: [], middlewares: [] },
        },

        // ── Support ──────────────────────────────────────────────────────────────
        {
            // Send a support message to Okra admin
            method: 'POST',
            path: '/partner/support',
            handler: 'partner.contactSupport',
            config: { policies: [], middlewares: [] },
        }
    ],
};