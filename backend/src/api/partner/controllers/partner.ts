// PATH: src/api/partner/controllers/partner.ts
// ============================================================
// Partner Fleet Dashboard — Backend Controller (Complete)
//
// Dependency notes:
//   • Uses user.partner / user.users self-relation (already in schema)
//   • Reads user.partnerProfile component (add via SCHEMA_DIFF)
//   • driverProfile.partnerId integer field (add via SCHEMA_DIFF)
//   • float-topup.partner integer field (add via SCHEMA_DIFF)
//   • ride.cancelledBy / delivery.cancelledBy include 'partner' (add via SCHEMA_DIFF)
//
// All float operations are wrapped in sequential awaits (Strapi's db.query
// does not expose transactions, so we rely on error handling + rollback logic).
// ============================================================

import { factories } from '@strapi/strapi';
import { SendSmsNotification, SendEmailNotification } from '../../../services/messages';
import socketService from '../../../services/socketService';
import { handleUserCreation } from '../../../pluginExtensionsFiles/userLifecycleMethods';

// ─── Auth guard ───────────────────────────────────────────────────────────────
// Returns the full partner User or null. Sets ctx error on failure.
async function requireApprovedPartner(ctx: any) {
    const userId = ctx.state.user?.id;
    if (!userId) {
        ctx.unauthorized('Authentication required');
        return null;
    }

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        select: ['id', 'firstName', 'lastName', 'phoneNumber', 'username', 'address', 'createdAt'],
        populate: {
            partnerProfile: true,
            country: {
                populate: { currency: { select: ['id', 'code', 'symbol'] } },
            },
        },
    });

    if (!user?.partnerProfile) {
        ctx.forbidden('No partner profile found for this account');
        return null;
    }

    if (user.partnerProfile.verificationStatus !== 'approved') {
        ctx.forbidden(
            `Partner account not approved. Current status: ${user.partnerProfile.verificationStatus}`
        );
        return null;
    }

    return user;
}

// ─── Ownership check ──────────────────────────────────────────────────────────
async function getOwnedDriver(driverId: number | string, partnerUserId: number) {
    return strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: Number(driverId), partner: partnerUserId },
        select: ['id', 'firstName', 'lastName', 'phoneNumber', 'username', 'address', 'createdAt'],
        populate: {
            driverProfile: {
                populate: {
                    assignedVehicle: {
                        select: ['id', 'numberPlate', 'make', 'model', 'color', 'vehicleType', 'insuranceExpiryDate'],
                    },
                    taxiDriver: { populate: { vehicle: { select: ['id', 'numberPlate'] } } },
                    busDriver: { populate: { vehicle: { select: ['id', 'numberPlate'] } } },
                    motorbikeRider: { populate: { vehicle: { select: ['id', 'numberPlate'] } } },
                },
            },
            deliveryProfile: { select: ['id', 'isOnline', 'isAvailable', 'isEnroute', 'verificationStatus'] },
        },
    });
}

// ─── Determine driver operational status ─────────────────────────────────────
function resolveDriverStatus(dp: any): 'ONLINE' | 'ON_TRIP' | 'EN_ROUTE' | 'OFFLINE' | 'PENDING' | 'SUSPENDED' {
    if (!dp) return 'OFFLINE';
    if (dp.verificationStatus === 'pending') return 'PENDING';
    if (dp.verificationStatus === 'suspended') return 'SUSPENDED';
    if (!dp.isOnline) return 'OFFLINE';
    if (dp.currentRide || dp.isEnroute) {
        if (dp.currentRide) return 'ON_TRIP';
        return 'EN_ROUTE';
    }
    return 'ONLINE';
}

// ─── Get all driver User IDs owned by partner ─────────────────────────────────
async function getPartnerDriverIds(partnerUserId: number): Promise<number[]> {
    const rows = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: { partner: partnerUserId },
        select: ['id'],
    });
    return rows.map((r: any) => r.id);
}

// ─── Format phone for SMS lookup ──────────────────────────────────────────────
function resolvePhone(user: any): string | null {
    return user?.phoneNumber || user?.username || null;
}

// =============================================================================
// CONTROLLER
// =============================================================================

export default factories.createCoreController(
    'plugin::users-permissions.user',
    ({ strapi }) => ({

        // =========================================================================
        // GET /partner/dashboard
        // =========================================================================
        async getDashboard(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const driverIds = await getPartnerDriverIds(partnerUser.id);

                const fleetDrivers = driverIds.length
                    ? await strapi.db.query('plugin::users-permissions.user').findMany({
                        where: { id: { $in: driverIds } },
                        select: ['id', 'firstName', 'lastName'],
                        populate: {
                            driverProfile: {
                                select: [
                                    'id', 'isOnline', 'isEnroute', 'floatBalance',
                                    'averageRating', 'completedRides', 'totalRides',
                                    'verificationStatus',
                                ],
                                populate: { currentRide: { select: ['id'] } },
                            },
                        },
                    })
                    : [];

                const totalDrivers = fleetDrivers.length;
                const onlineCount = fleetDrivers.filter(
                    (d: any) => d.driverProfile?.isOnline && !d.driverProfile?.currentRide && !d.driverProfile?.isEnroute
                ).length;
                const onTripCount = fleetDrivers.filter((d: any) => !!d.driverProfile?.currentRide).length;
                const enRouteCount = fleetDrivers.filter(
                    (d: any) => d.driverProfile?.isEnroute && !d.driverProfile?.currentRide
                ).length;
                const offlineCount = fleetDrivers.filter((d: any) => !d.driverProfile?.isOnline).length;

                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                let todayRides: any[] = [];
                let todayDeliveries: any[] = [];

                if (driverIds.length) {
                    [todayRides, todayDeliveries] = await Promise.all([
                        strapi.db.query('api::ride.ride').findMany({
                            where: {
                                driver: { $in: driverIds },
                                rideStatus: 'completed',
                                tripCompletedAt: { $gte: todayStart },
                            },
                            select: ['id', 'driverEarnings'],
                        }),
                        strapi.db.query('api::delivery.delivery').findMany({
                            where: {
                                deliverer: { $in: driverIds },
                                rideStatus: 'completed',
                                tripCompletedAt: { $gte: todayStart },
                            },
                            select: ['id', 'driverEarnings'],
                        }),
                    ]);
                }

                const allToday = [...todayRides, ...todayDeliveries];
                const todayEarnings = allToday.reduce((s: number, r: any) => s + (parseFloat(r.driverEarnings) || 0), 0);
                const activeFloat = fleetDrivers.reduce(
                    (s: number, d: any) => s + (parseFloat(d.driverProfile?.floatBalance) || 0), 0
                );
                const avgRating = totalDrivers
                    ? fleetDrivers.reduce(
                        (s: number, d: any) => s + (parseFloat(d.driverProfile?.averageRating) || 0), 0
                    ) / totalDrivers
                    : 0;

                const lowFloatDrivers = fleetDrivers
                    .filter((d: any) => (parseFloat(d.driverProfile?.floatBalance) || 0) < 100)
                    .map((d: any) => ({
                        id: d.id,
                        firstName: d.firstName,
                        lastName: d.lastName,
                        floatBalance: parseFloat(d.driverProfile?.floatBalance) || 0,
                    }));

                // Recent partner float ledger (last 20 entries)
                const recentLedger = await strapi.db.query('api::ledger-entry.ledger-entry').findMany({
                    where: {
                        type: { $in: ['float_topup-partner', 'float_debit-partner'] },
                        // Note: ledger entries have a driver field — for partner float history
                        // we fetch all partner-sourced entries for any of their drivers
                        ...(driverIds.length ? { driver: { $in: driverIds } } : {}),
                    },
                    orderBy: { createdAt: 'desc' },
                    limit: 20,
                    populate: { driver: { select: ['id', 'firstName', 'lastName'] } },
                });

                return ctx.send({
                    partnerProfile: {
                        ...partnerUser.partnerProfile,
                        floatBalance: parseFloat(partnerUser.partnerProfile.floatBalance) || 0,
                    },
                    fleet: { totalDrivers, onlineCount, onTripCount, enRouteCount, offlineCount },
                    todayMetrics: {
                        ridesCompleted: allToday.length,
                        fleetEarnings: parseFloat(todayEarnings.toFixed(2)),
                        activeFloat: parseFloat(activeFloat.toFixed(2)),
                        avgRating: parseFloat(avgRating.toFixed(2)),
                    },
                    lowFloatDrivers,
                    recentFloatActivity: recentLedger,
                });
            } catch (err) {
                strapi.log.error('[Partner:getDashboard]', err);
                return ctx.internalServerError('Failed to load partner dashboard');
            }
        },

        // =========================================================================
        // GET /partner/drivers
        // =========================================================================
        async getDrivers(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const {
                    search,
                    status,
                    verificationStatus,
                    page = 1,
                    pageSize = 20,
                } = ctx.query as any;

                let drivers = await strapi.db.query('plugin::users-permissions.user').findMany({
                    where: { partner: partnerUser.id },
                    select: ['id', 'firstName', 'lastName', 'phoneNumber', 'username', 'createdAt'],
                    populate: {
                        driverProfile: {
                            select: [
                                'id', 'isOnline', 'isEnroute', 'floatBalance',
                                'averageRating', 'completedRides', 'totalRides',
                                'verificationStatus',
                            ],
                            populate: {
                                assignedVehicle: { select: ['id', 'numberPlate', 'make', 'model', 'color'] },
                                currentRide: { select: ['id'] },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                // In-memory filter (component fields not queryable in Strapi db.query where)
                if (search) {
                    const q = String(search).toLowerCase();
                    drivers = drivers.filter(
                        (d: any) =>
                            `${d.firstName || ''} ${d.lastName || ''}`.toLowerCase().includes(q) ||
                            String(d.phoneNumber || d.username || '').includes(q)
                    );
                }

                if (status && status !== 'all') {
                    drivers = drivers.filter(
                        (d: any) =>
                            resolveDriverStatus(d.driverProfile).toLowerCase() === String(status).toLowerCase()
                    );
                }

                if (verificationStatus && verificationStatus !== 'all') {
                    drivers = drivers.filter(
                        (d: any) => d.driverProfile?.verificationStatus === verificationStatus
                    );
                }

                const total = drivers.length;
                const paged = drivers.slice(
                    (Number(page) - 1) * Number(pageSize),
                    Number(page) * Number(pageSize)
                );

                return ctx.send({
                    data: paged.map((d: any) => ({
                        id: d.id,
                        firstName: d.firstName,
                        lastName: d.lastName,
                        phoneNumber: d.phoneNumber || d.username,
                        status: resolveDriverStatus(d.driverProfile),
                        floatBalance: parseFloat(d.driverProfile?.floatBalance) || 0,
                        verificationStatus: d.driverProfile?.verificationStatus || 'not_started',
                        averageRating: parseFloat(d.driverProfile?.averageRating) || 0,
                        completedRides: d.driverProfile?.completedRides || 0,
                        totalRides: d.driverProfile?.totalRides || 0,
                        assignedVehicle: d.driverProfile?.assignedVehicle || null,
                        createdAt: d.createdAt,
                    })),
                    meta: {
                        pagination: {
                            page: Number(page),
                            pageSize: Number(pageSize),
                            pageCount: Math.ceil(total / Number(pageSize)),
                            total,
                        },
                    },
                });
            } catch (err) {
                strapi.log.error('[Partner:getDrivers]', err);
                return ctx.internalServerError('Failed to fetch fleet drivers');
            }
        },

        // =========================================================================
        // POST /partner/drivers/register
        // =========================================================================
        async registerDriver(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const {
                    firstName, lastName, phoneNumber, password,
                    licenseNumber, licenseExpiryDate,
                    nationalIdNumber,
                    address,
                    vehicleType,
                    numberPlate, make, model, year, color,
                    seatingCapacity, insuranceExpiryDate,
                } = ctx.request.body;

                // ── Validation ────────────────────────────────────────────────────
                if (!firstName || !lastName || !phoneNumber || !password) {
                    return ctx.badRequest('firstName, lastName, phoneNumber, and password are required');
                }
                if (!vehicleType || !numberPlate || !make || !model) {
                    return ctx.badRequest('vehicleType, numberPlate, make, and model are required');
                }

                const validVehicleTypes = ['taxi', 'bus', 'motorcycle', 'motorbike', 'truck'];
                if (!validVehicleTypes.includes(vehicleType)) {
                    return ctx.badRequest(`vehicleType must be one of: ${validVehicleTypes.join(' | ')}`);
                }

                const cleanPhone = String(phoneNumber).replace(/\D/g, '');
                const username = cleanPhone;
                const email = `unset_${cleanPhone}@email.com`;

                // Duplicate check
                const existing = await strapi.db.query('plugin::users-permissions.user').findOne({
                    where: { $or: [{ username }, { phoneNumber: cleanPhone }] },
                    select: ['id'],
                });
                if (existing) {
                    return ctx.badRequest('A user with this phone number already exists');
                }

                const defaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
                    where: { type: 'authenticated' },
                    select: ['id'],
                });
                if (!defaultRole) return ctx.internalServerError('Default role not found');

                // ── Create user ───────────────────────────────────────────────────
                const newUser = await strapi
                    .plugin('users-permissions')
                    .service('user')
                    .add({
                        username,
                        email,
                        password,
                        phoneNumber: cleanPhone,
                        firstName,
                        lastName,
                        confirmed: true,
                        blocked: false,
                        role: defaultRole.id,
                    });

                if (!newUser?.id) return ctx.internalServerError('Failed to create driver user account');

                // ── Initialize profiles (affiliate QR, etc.) ──────────────────────
                await handleUserCreation(strapi, newUser);

                // Re-fetch to get freshly created profile IDs
                const freshUser = await strapi.db.query('plugin::users-permissions.user').findOne({
                    where: { id: newUser.id },
                    populate: { driverProfile: true },
                });

                if (!freshUser?.driverProfile) {
                    return ctx.internalServerError('Driver profile initialization failed');
                }

                const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});

                // ── Link driver to this partner ───────────────────────────────────
                await strapi.db.query('plugin::users-permissions.user').update({
                    where: { id: newUser.id },
                    data: { partner: partnerUser.id },
                });

                // ── Populate driverProfile ────────────────────────────────────────
                await strapi.db.query('driver-profiles.driver-profile').update({
                    where: { id: freshUser.driverProfile.id },
                    data: {
                        driverLicenseNumber: licenseNumber || null,
                        licenseExpiryDate: licenseExpiryDate || null,
                        nationalIdNumber: nationalIdNumber || null,
                        verificationStatus: settings?.autoApproveDrivers ? 'approved' : 'pending',
                        floatBalance: parseFloat(settings?.initialDriverFloat) || 0,
                        partnerId: partnerUser.partnerProfile.id,
                        onboardingStep: 'review',
                    },
                });

                if (address) {
                    await strapi.db.query('plugin::users-permissions.user').update({
                        where: { id: newUser.id },
                        data: { address },
                    });
                }

                // ── Create vehicle ────────────────────────────────────────────────
                const vehicleStorageType =
                    vehicleType === 'bus'
                        ? 'bus'
                        : vehicleType === 'motorcycle' || vehicleType === 'motorbike'
                            ? 'motorcycle'
                            : vehicleType === 'truck'
                                ? 'truck'
                                : 'taxi';

                const rideClasses = await strapi.db.query('api::ride-class.ride-class').findMany({
                    where: { isActive: true },
                    select: ['id'],
                });

                const vehicle = await strapi.db.query('api::vehicle.vehicle').create({
                    data: {
                        vehicleType: vehicleStorageType,
                        numberPlate: numberPlate.toUpperCase(),
                        make,
                        model,
                        year: year ? parseInt(year) : new Date().getFullYear(),
                        color: color || null,
                        seatingCapacity: seatingCapacity ? parseInt(seatingCapacity) : null,
                        insuranceExpiryDate: insuranceExpiryDate || null,
                        isActive: true,
                        verificationStatus: settings?.autoApproveDrivers ? 'approved' : 'pending',
                        assignedDriver: newUser.id,
                        rideClasses: { connect: rideClasses.map((rc: any) => rc.id) },
                    },
                });

                // ── Link vehicle to correct driverProfile sub-component ───────────
                const dpWithSubs = await strapi.db.query('driver-profiles.driver-profile').findOne({
                    where: { id: freshUser.driverProfile.id },
                    populate: { taxiDriver: true, busDriver: true, motorbikeRider: true },
                });

                const driverType =
                    vehicleType === 'bus'
                        ? 'busDriver'
                        : vehicleType === 'motorbike' || vehicleType === 'motorcycle'
                            ? 'motorbikeRider'
                            : 'taxiDriver';

                // motorbikeRider sub-component uses the 'motorbike' relation field, others use 'vehicle'
                const vehicleFieldInSub = driverType === 'motorbikeRider' ? 'motorbike' : 'vehicle';
                const existingSub = (dpWithSubs as any)[driverType];
                const subPayload: any = { [vehicleFieldInSub]: vehicle.id, isActive: true };

                await strapi.db.query('driver-profiles.driver-profile').update({
                    where: { id: freshUser.driverProfile.id },
                    data: {
                        assignedVehicle: vehicle.id,
                        vehicles: { connect: [vehicle.id] },
                        activeSubProfile: vehicleType === 'motorbike' ? 'motorbike' : vehicleType,
                        acceptedRideClasses: { connect: rideClasses.map((rc: any) => rc.id) },
                        [driverType]: existingSub?.id
                            ? { id: existingSub.id, ...subPayload }
                            : subPayload,
                    },
                });

                // ── Increment partner.totalDrivers ────────────────────────────────
                const curTotal = partnerUser.partnerProfile.totalDrivers || 0;
                await strapi.db.query('plugin::users-permissions.user').update({
                    where: { id: partnerUser.id },
                    data: {
                        partnerProfile: {
                            id: partnerUser.partnerProfile.id,
                            totalDrivers: curTotal + 1,
                        },
                    },
                });

                // ── Notify admin ──────────────────────────────────────────────────
                try {
                    const emailList = await strapi.db
                        .query('api::email-addresses-list.email-addresses-list')
                        .findOne({ where: { id: 1 } });
                    const partnerBiz = partnerUser.partnerProfile?.businessName || 'unknown partner';
                    const msg =
                        `New driver registered via partner dashboard.\n` +
                        `Partner: ${partnerUser.firstName} ${partnerUser.lastName} (${partnerBiz})\n` +
                        `Driver: ${firstName} ${lastName} — ${cleanPhone}\n` +
                        `Vehicle: ${make} ${model} ${numberPlate.toUpperCase()}`;
                    (emailList?.adminEmailAddresses || []).forEach((email: string) => {
                        try { SendEmailNotification(email, msg); } catch { /* non-fatal */ }
                    });
                } catch { /* non-fatal */ }

                strapi.log.info(
                    `[Partner:registerDriver] Driver ${newUser.id} registered by partner ${partnerUser.id}`
                );

                return ctx.send({
                    success: true,
                    message: 'Driver and vehicle registered successfully',
                    driver: {
                        id: newUser.id,
                        firstName,
                        lastName,
                        phoneNumber: cleanPhone,
                        verificationStatus: settings?.autoApproveDrivers ? 'approved' : 'pending',
                    },
                    vehicle: {
                        id: vehicle.id,
                        numberPlate: vehicle.numberPlate,
                        make: vehicle.make,
                        model: vehicle.model,
                    },
                });
            } catch (err: any) {
                strapi.log.error('[Partner:registerDriver]', err);
                return ctx.internalServerError(err.message || 'Failed to register driver');
            }
        },

        // =========================================================================
        // GET /partner/drivers/:id/metrics
        // =========================================================================
        async getDriverMetrics(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const { id } = ctx.params;
                const { period = 'week' } = ctx.query as any;

                const driver = await getOwnedDriver(id, partnerUser.id);
                if (!driver) return ctx.forbidden('Driver is not in your fleet');

                const now = new Date();
                let startDate = new Date();
                switch (period) {
                    case 'today': startDate.setHours(0, 0, 0, 0); break;
                    case 'week': startDate.setDate(now.getDate() - 7); break;
                    case 'month': startDate.setMonth(now.getMonth() - 1); break;
                    default: startDate.setDate(now.getDate() - 7);
                }

                const [rides, deliveries, ledgerEntries, activeRide, activeDelivery] = await Promise.all([
                    strapi.db.query('api::ride.ride').findMany({
                        where: {
                            driver: Number(id),
                            rideStatus: 'completed',
                            tripCompletedAt: { $gte: startDate },
                        },
                        select: [
                            'id', 'rideCode', 'totalFare', 'driverEarnings', 'commission',
                            'paymentMethod', 'tripCompletedAt', 'actualDistance', 'actualDuration',
                        ],
                        populate: { rideClass: { select: ['id', 'name'] } },
                    }),
                    strapi.db.query('api::delivery.delivery').findMany({
                        where: {
                            deliverer: Number(id),
                            rideStatus: 'completed',
                            tripCompletedAt: { $gte: startDate },
                        },
                        select: [
                            'id', 'rideCode', 'totalFare', 'driverEarnings', 'commission',
                            'paymentMethod', 'tripCompletedAt', 'actualDistance',
                        ],
                    }),
                    strapi.db.query('api::ledger-entry.ledger-entry').findMany({
                        where: {
                            driver: Number(id),
                            type: { $in: ['float_topup-partner', 'float_debit-partner'] },
                        },
                        orderBy: { createdAt: 'desc' },
                        limit: 100,
                    }),
                    // Active ride check (for the driver detail card)
                    strapi.db.query('api::ride.ride').findOne({
                        where: {
                            driver: Number(id),
                            rideStatus: { $notIn: ['completed', 'cancelled', 'no_drivers_available'] },
                        },
                        populate: {
                            rider: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
                            vehicle: { fields: ['id', 'numberPlate'] },
                            rideClass: { fields: ['id', 'name'] },
                        },
                        orderBy: { createdAt: 'desc' },
                    }),
                    strapi.db.query('api::delivery.delivery').findOne({
                        where: {
                            deliverer: Number(id),
                            rideStatus: { $notIn: ['completed', 'cancelled', 'no_drivers_available'] },
                        },
                        populate: {
                            sender: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
                            vehicle: { fields: ['id', 'numberPlate'] },
                        },
                        orderBy: { createdAt: 'desc' },
                    }),
                ]);

                const allCompleted = [
                    ...(rides as any[]).map(r => ({ ...r, recordType: 'ride' })),
                    ...(deliveries as any[]).map(d => ({ ...d, recordType: 'delivery' })),
                ];

                const totalEarnings = allCompleted.reduce((s, r) => s + (parseFloat(r.driverEarnings) || 0), 0);
                const totalCommission = allCompleted.reduce((s, r) => s + (parseFloat(r.commission) || 0), 0);
                const totalDistance = allCompleted.reduce((s, r) => s + (parseFloat(r.actualDistance) || 0), 0);

                // Daily breakdown for chart
                const dailyMap: Record<string, { date: string; rides: number; deliveries: number; earnings: number }> = {};
                allCompleted.forEach(r => {
                    const day = new Date(r.tripCompletedAt).toISOString().split('T')[0];
                    if (!dailyMap[day]) dailyMap[day] = { date: day, rides: 0, deliveries: 0, earnings: 0 };
                    if (r.recordType === 'ride') dailyMap[day].rides++;
                    else dailyMap[day].deliveries++;
                    dailyMap[day].earnings += parseFloat(r.driverEarnings) || 0;
                });
                const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

                // All-time cancelled count
                const cancelledCount = await strapi.db.query('api::ride.ride').count({
                    where: { driver: Number(id), rideStatus: 'cancelled' },
                });

                return ctx.send({
                    driver: {
                        id: driver.id,
                        firstName: driver.firstName,
                        lastName: driver.lastName,
                        phoneNumber: resolvePhone(driver),
                        floatBalance: parseFloat((driver as any).driverProfile?.floatBalance) || 0,
                        averageRating: parseFloat((driver as any).driverProfile?.averageRating) || 0,
                        completedRides: (driver as any).driverProfile?.completedRides || 0,
                        totalRides: (driver as any).driverProfile?.totalRides || 0,
                        cancelledRides: cancelledCount,
                        verificationStatus: (driver as any).driverProfile?.verificationStatus,
                        assignedVehicle: (driver as any).driverProfile?.assignedVehicle || null,
                        status: resolveDriverStatus((driver as any).driverProfile),
                        createdAt: driver.createdAt,
                    },
                    activeRide: activeRide || null,
                    activeDelivery: activeDelivery || null,
                    metrics: {
                        period,
                        ridesCompleted: rides.length,
                        deliveriesCompleted: deliveries.length,
                        totalCompleted: allCompleted.length,
                        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
                        totalCommission: parseFloat(totalCommission.toFixed(2)),
                        totalDistance: parseFloat(totalDistance.toFixed(2)),
                        cashTransactions: allCompleted.filter(r => r.paymentMethod === 'cash').length,
                        digitalTransactions: allCompleted.filter(r => r.paymentMethod === 'okrapay').length,
                    },
                    floatHistory: ledgerEntries,
                    dailyBreakdown,
                });
            } catch (err) {
                strapi.log.error('[Partner:getDriverMetrics]', err);
                return ctx.internalServerError('Failed to get driver metrics');
            }
        },

        // =========================================================================
        // PUT /partner/drivers/:id/float
        // =========================================================================
        async modifyDriverFloat(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const { id } = ctx.params;
                const { action, amount, note } = ctx.request.body;

                if (!action || !['CREDIT', 'DEBIT'].includes(String(action).toUpperCase())) {
                    return ctx.badRequest('action must be CREDIT or DEBIT');
                }
                const normAction = String(action).toUpperCase() as 'CREDIT' | 'DEBIT';
                const numAmount = parseFloat(amount);
                if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
                    return ctx.badRequest('amount must be a positive number');
                }

                // Verify driver belongs to this partner
                const driverUser = await strapi.db.query('plugin::users-permissions.user').findOne({
                    where: { id: Number(id), partner: partnerUser.id },
                    select: ['id', 'firstName', 'lastName', 'phoneNumber', 'username'],
                    populate: {
                        driverProfile: {
                            select: ['id', 'floatBalance', 'isEnroute', 'withdrawableFloatBalance'],
                            populate: { currentRide: { select: ['id'] } },
                        },
                    },
                });

                if (!driverUser) return ctx.forbidden('Driver is not in your fleet');
                if (!driverUser.driverProfile) return ctx.badRequest('Driver profile not found');

                // Active-trip guardrail on DEBIT
                if (normAction === 'DEBIT') {
                    const [activeRide, activeDelivery] = await Promise.all([
                        strapi.db.query('api::ride.ride').findOne({
                            where: { driver: Number(id), rideStatus: { $in: ['accepted', 'arrived', 'passenger_onboard'] } },
                            select: ['id', 'rideStatus'],
                        }),
                        strapi.db.query('api::delivery.delivery').findOne({
                            where: { deliverer: Number(id), rideStatus: { $in: ['accepted', 'arrived', 'passenger_onboard'] } },
                            select: ['id', 'rideStatus'],
                        }),
                    ]);

                    if (activeRide || activeDelivery) {
                        return ctx.badRequest(
                            'Cannot debit float while driver is on an active trip. Please wait for the trip to complete.'
                        );
                    }
                }

                // Balance guardrails
                const partnerFloat = parseFloat(partnerUser.partnerProfile.floatBalance) || 0;
                const driverFloat = parseFloat(driverUser.driverProfile.floatBalance) || 0;

                if (normAction === 'CREDIT' && partnerFloat < numAmount) {
                    return ctx.badRequest(
                        `Insufficient partner float balance. Available: K${partnerFloat.toFixed(2)}, Requested: K${numAmount.toFixed(2)}`
                    );
                }
                if (normAction === 'DEBIT' && driverFloat < numAmount) {
                    return ctx.badRequest(
                        `Driver float too low to debit. Available: K${driverFloat.toFixed(2)}, Requested: K${numAmount.toFixed(2)}`
                    );
                }

                // Calculate new balances
                const newPartnerFloat = normAction === 'CREDIT'
                    ? partnerFloat - numAmount
                    : partnerFloat + numAmount;

                const newDriverFloat = normAction === 'CREDIT'
                    ? driverFloat + numAmount
                    : driverFloat - numAmount;

                // Also adjust withdrawableFloatBalance on the driver for CREDIT ops
                const currentWithdrawable = parseFloat(driverUser.driverProfile.withdrawableFloatBalance) || 0;
                const newWithdrawable = normAction === 'CREDIT'
                    ? currentWithdrawable + numAmount
                    : Math.max(0, currentWithdrawable - numAmount);

                // ── Atomic updates (sequential, rollback on error) ─────────────────
                let partnerUpdateDone = false;
                let driverUpdateDone = false;

                try {
                    // 1. Update partner float
                    await strapi.db.query('partner-profile.partner-profile').update({
                        where: { id: Number(partnerUser.partnerProfile.id) },
                        data: {
                            floatBalance: newPartnerFloat
                        },
                    })
                    partnerUpdateDone = true;

                    // 2. Update driver float
                    await strapi.db.query('driver-profiles.driver-profile').update({
                        where: { id: driverUser.driverProfile.id },
                        data: {
                            floatBalance: newDriverFloat,
                            withdrawableFloatBalance: newWithdrawable,
                        },
                    });
                    driverUpdateDone = true;
                } catch (updateErr: any) {
                    // Rollback whatever succeeded
                    if (partnerUpdateDone && !driverUpdateDone) {
                        try {
                            await strapi.db.query('plugin::users-permissions.user').update({
                                where: { id: partnerUser.id },
                                data: {
                                    partnerProfile: {
                                        id: partnerUser.partnerProfile.id,
                                        floatBalance: partnerFloat,
                                    },
                                },
                            });
                        } catch (rollbackErr) {
                            strapi.log.error('[Partner:modifyDriverFloat] ROLLBACK FAILED:', rollbackErr);
                        }
                    }
                    throw updateErr;
                }

                // 3. Ledger entry
                const ledgerEntry = await strapi.db.query('api::ledger-entry.ledger-entry').create({
                    data: {
                        entryId: `LE-PARTNER-${Date.now()}`,
                        driver: Number(id),
                        type: normAction === 'CREDIT' ? 'float_topup-partner' : 'float_debit-partner',
                        amount: normAction === 'CREDIT' ? numAmount : -numAmount,
                        source: 'partner',
                        ledgerStatus: 'settled',
                        description: note || `Partner ${normAction.toLowerCase()} — K${numAmount.toFixed(2)}`,
                        balanceBefore: driverFloat,
                        balanceAfter: newDriverFloat,
                    },
                });

                // ── SMS to driver ──────────────────────────────────────────────────
                const phone = resolvePhone(driverUser);
                if (phone) {
                    const actionWord = normAction === 'CREDIT' ? 'credited' : 'debited';
                    SendSmsNotification(
                        phone,
                        `Your Okra account has been ${actionWord} with K${numAmount.toFixed(2)} float by your fleet partner.`
                    );
                }

                // ── Socket events ──────────────────────────────────────────────────
                socketService.emitPaymentSuccess(
                    Number(id),
                    'driver',
                    numAmount,
                    ledgerEntry.id,
                    normAction === 'CREDIT' ? 'float_topup-partner' : 'float_debit-partner',
                );

                socketService.emit('partner:float:updated', {
                    partnerId: partnerUser.id,
                    partnerProfileId: partnerUser.partnerProfile.id,
                    newPartnerBalance: parseFloat(newPartnerFloat.toFixed(2)),
                    driverId: Number(id),
                    action: normAction,
                    amount: numAmount,
                });

                // Low-float check (emit alert if driver is now below 100)
                if (newDriverFloat < 100) {
                    socketService.emit('partner:driver:low-float', {
                        partnerId: partnerUser.id,
                        driverId: Number(id),
                        driverName: `${driverUser.firstName || ''} ${driverUser.lastName || ''}`.trim(),
                        floatBalance: parseFloat(newDriverFloat.toFixed(2)),
                        threshold: 100,
                    });
                }

                strapi.log.info(
                    `[Partner:modifyDriverFloat] ${normAction} K${numAmount} → driver ${id} by partner ${partnerUser.id}`
                );

                return ctx.send({
                    success: true,
                    message: `Driver float ${normAction === 'CREDIT' ? 'credited' : 'debited'} successfully`,
                    driverFloatBalance: parseFloat(newDriverFloat.toFixed(2)),
                    partnerFloatBalance: parseFloat(newPartnerFloat.toFixed(2)),
                    ledgerEntryId: ledgerEntry.id,
                });
            } catch (err: any) {
                strapi.log.error('[Partner:modifyDriverFloat]', err);
                return ctx.internalServerError(err.message || 'Failed to modify driver float');
            }
        },

        // =========================================================================
        // GET /partner/vehicles
        // =========================================================================
        async getVehicles(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const { search } = ctx.query as any;

                const driverIds = await getPartnerDriverIds(partnerUser.id);
                if (!driverIds.length) return ctx.send({ data: [] });

                let vehicles = await strapi.db.query('api::vehicle.vehicle').findMany({
                    where: { assignedDriver: { $in: driverIds } },
                    populate: {
                        assignedDriver: { select: ['id', 'firstName', 'lastName', 'phoneNumber'] },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                if (search) {
                    const q = String(search).toUpperCase();
                    vehicles = vehicles.filter(
                        (v: any) =>
                            (v.numberPlate || '').toUpperCase().includes(q) ||
                            (v.make || '').toUpperCase().includes(q) ||
                            (v.model || '').toUpperCase().includes(q)
                    );
                }

                return ctx.send({ data: vehicles });
            } catch (err) {
                strapi.log.error('[Partner:getVehicles]', err);
                return ctx.internalServerError('Failed to fetch vehicles');
            }
        },

        // =========================================================================
        // POST /partner/vehicles
        // =========================================================================
        async addVehicle(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const {
                    vehicleType, numberPlate, make, model, year, color,
                    seatingCapacity, insuranceExpiryDate, driverId,
                } = ctx.request.body;

                if (!vehicleType || !numberPlate || !make || !model) {
                    return ctx.badRequest('vehicleType, numberPlate, make, and model are required');
                }

                let assignedDriverId: number | null = null;

                if (driverId) {
                    const driver = await getOwnedDriver(driverId, partnerUser.id);
                    if (!driver) return ctx.forbidden('Driver is not in your fleet');
                    assignedDriverId = Number(driverId);
                }

                const vehicle = await strapi.db.query('api::vehicle.vehicle').create({
                    data: {
                        vehicleType,
                        numberPlate: numberPlate.toUpperCase(),
                        make,
                        model,
                        year: year ? parseInt(year) : new Date().getFullYear(),
                        color: color || null,
                        seatingCapacity: seatingCapacity ? parseInt(seatingCapacity) : null,
                        insuranceExpiryDate: insuranceExpiryDate || null,
                        isActive: !!assignedDriverId,
                        verificationStatus: 'pending',
                        assignedDriver: assignedDriverId,
                    },
                });

                if (assignedDriverId) {
                    const driver = await getOwnedDriver(assignedDriverId, partnerUser.id);
                    if ((driver as any)?.driverProfile?.id) {
                        await strapi.db.query('driver-profiles.driver-profile').update({
                            where: { id: (driver as any).driverProfile.id },
                            data: {
                                assignedVehicle: vehicle.id,
                                vehicles: { connect: [vehicle.id] },
                            },
                        });
                    }
                }

                return ctx.send({ success: true, vehicle });
            } catch (err: any) {
                strapi.log.error('[Partner:addVehicle]', err);
                return ctx.internalServerError(err.message || 'Failed to add vehicle');
            }
        },

        // =========================================================================
        // PUT /partner/vehicles/:id/assign
        // =========================================================================
        async assignVehicle(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const { id: vehicleId } = ctx.params;
                const { driverId } = ctx.request.body;

                const driverIds = await getPartnerDriverIds(partnerUser.id);

                const vehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
                    where: { id: Number(vehicleId) },
                    populate: { assignedDriver: { select: ['id'] } },
                });

                if (!vehicle) return ctx.notFound('Vehicle not found');

                const currentAssigneeId = vehicle.assignedDriver?.id || vehicle.assignedDriver;

                // Must be unassigned or belong to this fleet
                if (currentAssigneeId && !driverIds.includes(Number(currentAssigneeId))) {
                    return ctx.forbidden('Vehicle does not belong to your fleet');
                }

                // ── Unassign ──────────────────────────────────────────────────────
                if (!driverId) {
                    await strapi.db.query('api::vehicle.vehicle').update({
                        where: { id: Number(vehicleId) },
                        data: { assignedDriver: null, isActive: false },
                    });

                    if (currentAssigneeId) {
                        const prevDriver = await strapi.db.query('plugin::users-permissions.user').findOne({
                            where: { id: Number(currentAssigneeId) },
                            populate: { driverProfile: { select: ['id', 'assignedVehicle'] } },
                        });
                        if (prevDriver?.driverProfile) {
                            const av = (prevDriver as any).driverProfile.assignedVehicle;
                            const avId = typeof av === 'object' ? av?.id : av;
                            if (Number(avId) === Number(vehicleId)) {
                                await strapi.db.query('driver-profiles.driver-profile').update({
                                    where: { id: prevDriver.driverProfile.id },
                                    data: { assignedVehicle: null },
                                });
                            }
                        }
                    }

                    return ctx.send({ success: true, message: 'Vehicle unassigned successfully' });
                }

                // ── Assign to new driver ──────────────────────────────────────────
                const newDriver = await getOwnedDriver(driverId, partnerUser.id);
                if (!newDriver) return ctx.forbidden('Driver is not in your fleet');

                await strapi.db.query('api::vehicle.vehicle').update({
                    where: { id: Number(vehicleId) },
                    data: { assignedDriver: Number(driverId), isActive: true },
                });

                if ((newDriver as any).driverProfile?.id) {
                    await strapi.db.query('driver-profiles.driver-profile').update({
                        where: { id: (newDriver as any).driverProfile.id },
                        data: {
                            assignedVehicle: Number(vehicleId),
                            vehicles: { connect: [Number(vehicleId)] },
                        },
                    });
                }

                return ctx.send({ success: true, message: 'Vehicle assigned successfully' });
            } catch (err: any) {
                strapi.log.error('[Partner:assignVehicle]', err);
                return ctx.internalServerError(err.message || 'Failed to assign vehicle');
            }
        },

        // =========================================================================
        // POST /partner/float/topup
        // =========================================================================
        async initiateFloatTopup(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const { amount } = ctx.request.body;
                const numAmount = parseFloat(amount);

                if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
                    return ctx.badRequest('amount must be a positive number');
                }

                const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});
                const minTopup = parseFloat(settings?.minimumFloatTopup) || 10;
                const maxTopup = parseFloat(settings?.maximumFloatTopup) || 10000;

                if (numAmount < minTopup) return ctx.badRequest(`Minimum top-up is K${minTopup}`);
                if (numAmount > maxTopup) return ctx.badRequest(`Maximum top-up is K${maxTopup}`);

                const topup = await strapi.db.query('api::float-topup.float-topup').create({
                    data: {
                        topupId: `FT-PARTNER-${Date.now()}`,
                        amount: numAmount,
                        paymentMethod: 'okrapay',
                        floatStatus: 'pending',
                        requestedAt: new Date(),
                        partner: partnerUser.id,   // marks this as a partner top-up
                        driver: null,
                    },
                })

                const partnerAccount = await strapi.db.query('plugin::users-permissions.user').findOne({
                    where: { id: partnerUser.id },
                    populate: { partnerProfile: true }
                })

                const newPartnerFloatBalance = parseFloat(partnerAccount?.partnerProfile?.floatBalance) - numAmount
                await strapi.db.query('partner-profile.partner-profile').update({
                    where: { id: Number(partnerAccount?.partnerUser?.id) },
                    data: {
                        floatBalance: newPartnerFloatBalance
                    },
                })

                strapi.log.info(
                    `[Partner:initiateFloatTopup] Created topup ${topup.id} for partner ${partnerUser.id}, K${numAmount}`
                )

                return ctx.send({
                    success: true,
                    id: topup.id,
                    topupId: topup.topupId,
                    amount: numAmount,
                });
            } catch (err: any) {
                strapi.log.error('[Partner:initiateFloatTopup]', err);
                return ctx.internalServerError(err.message || 'Failed to initiate float top-up');
            }
        },

        // =========================================================================
        // GET /partner/fleet/locations
        // =========================================================================
        async getFleetLocations(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const driverIds = await getPartnerDriverIds(partnerUser.id);
                if (!driverIds.length) return ctx.send({ data: [] });

                const drivers = await strapi.db.query('plugin::users-permissions.user').findMany({
                    where: { id: { $in: driverIds } },
                    select: ['id', 'firstName', 'lastName', 'phoneNumber', 'username', 'currentLocation'],
                    populate: {
                        driverProfile: {
                            select: ['id', 'isOnline', 'isEnroute', 'floatBalance', 'averageRating'],
                            populate: { currentRide: { select: ['id'] } },
                        },
                    },
                });

                const data = drivers.map((d: any) => {
                    const loc = d.currentLocation as any;
                    const phone = d.phoneNumber || d.username;
                    return {
                        driverId: d.id,
                        driverName: `${d.firstName || ''} ${d.lastName || ''}`.trim(),
                        phone,
                        phoneDigits: String(phone || '').replace(/\D/g, ''),
                        lat: loc?.lat ?? null,
                        lng: loc?.lng ?? null,
                        status: resolveDriverStatus(d.driverProfile),
                        floatBalance: parseFloat(d.driverProfile?.floatBalance) || 0,
                        isOnline: d.driverProfile?.isOnline || false,
                        averageRating: parseFloat(d.driverProfile?.averageRating) || 0,
                    };
                });

                return ctx.send({ data });
            } catch (err) {
                strapi.log.error('[Partner:getFleetLocations]', err);
                return ctx.internalServerError('Failed to fetch fleet locations');
            }
        },

        // =========================================================================
        // GET /partner/rides
        // =========================================================================
        async getFleetRides(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const {
                    page = 1,
                    pageSize = 20,
                    type,         // 'rides' | 'deliveries' | 'all'
                    status,
                    driverId,
                } = ctx.query as any;

                const allDriverIds = await getPartnerDriverIds(partnerUser.id);
                if (!allDriverIds.length) {
                    return ctx.send({
                        data: [],
                        meta: { pagination: { page: 1, pageSize: 20, pageCount: 0, total: 0 } },
                    });
                }

                let targetDriverIds = allDriverIds;
                if (driverId) {
                    const n = Number(driverId);
                    if (!allDriverIds.includes(n)) return ctx.forbidden('Driver is not in your fleet');
                    targetDriverIds = [n];
                }

                const rideWhere: any = { driver: { $in: targetDriverIds } };
                const deliveryWhere: any = { deliverer: { $in: targetDriverIds } };
                if (status) {
                    rideWhere.rideStatus = status;
                    deliveryWhere.rideStatus = status;
                }

                const includeRides = !type || type === 'all' || type === 'rides';
                const includeDeliveries = !type || type === 'all' || type === 'deliveries';

                const [rides, deliveries] = await Promise.all([
                    includeRides
                        ? strapi.db.query('api::ride.ride').findMany({
                            where: rideWhere,
                            populate: {
                                driver: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
                                rider: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
                                rideClass: { fields: ['id', 'name'] },
                                vehicle: { fields: ['id', 'numberPlate'] },
                            },
                            orderBy: { createdAt: 'desc' },
                        })
                        : Promise.resolve([]),
                    includeDeliveries
                        ? strapi.db.query('api::delivery.delivery').findMany({
                            where: deliveryWhere,
                            populate: {
                                deliverer: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
                                sender: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
                                vehicle: { fields: ['id', 'numberPlate'] },
                            },
                            orderBy: { createdAt: 'desc' },
                        })
                        : Promise.resolve([]),
                ]);

                const merged = [
                    ...(rides as any[]).map(r => ({ ...r, recordType: 'ride' })),
                    ...(deliveries as any[]).map(d => ({ ...d, recordType: 'delivery' })),
                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                const total = merged.length;
                const paged = merged.slice(
                    (Number(page) - 1) * Number(pageSize),
                    Number(page) * Number(pageSize)
                );

                return ctx.send({
                    data: paged,
                    meta: {
                        pagination: {
                            page: Number(page),
                            pageSize: Number(pageSize),
                            pageCount: Math.ceil(total / Number(pageSize)),
                            total,
                        },
                    },
                });
            } catch (err) {
                strapi.log.error('[Partner:getFleetRides]', err);
                return ctx.internalServerError('Failed to fetch fleet rides');
            }
        },

        // =========================================================================
        // GET /partner/rides/:id
        // =========================================================================
        async getRide(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const { id } = ctx.params;
                const { isDelivery } = ctx.query as any;

                const driverIds = await getPartnerDriverIds(partnerUser.id);
                if (!driverIds.length) return ctx.notFound('Ride not found');

                // Try ride first (unless explicitly a delivery)
                if (isDelivery !== 'true') {
                    const ride = await strapi.db.query('api::ride.ride').findOne({
                        where: { id: Number(id) },
                        populate: {
                            driver: {
                                fields: ['id', 'firstName', 'lastName', 'phoneNumber'],
                                populate: { driverProfile: { fields: ['id', 'averageRating', 'totalRatings', 'completedRides'] } },
                            },
                            rider: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
                            rideClass: true,
                            taxiType: true,
                            vehicle: true,
                            pickupStation: true,
                            dropoffStation: true,
                            promoCode: true,
                        },
                    });

                    if (ride) {
                        const rideDriverId = ride.driver?.id ?? ride.driver;
                        if (!driverIds.includes(Number(rideDriverId))) {
                            return ctx.forbidden('Ride does not belong to your fleet');
                        }
                        return ctx.send({ data: { ...ride, recordType: 'ride' } });
                    }
                }

                // Fallback to delivery
                const delivery = await strapi.db.query('api::delivery.delivery').findOne({
                    where: { id: Number(id) },
                    populate: {
                        deliverer: {
                            fields: ['id', 'firstName', 'lastName', 'phoneNumber'],
                            populate: { driverProfile: { fields: ['id', 'averageRating', 'completedRides'] } },
                        },
                        sender: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
                        vehicle: true,
                        package: true,
                    },
                });

                if (!delivery) return ctx.notFound('Ride or delivery not found');

                const deliveryDriverId = delivery.deliverer?.id ?? delivery.deliverer;
                if (!driverIds.includes(Number(deliveryDriverId))) {
                    return ctx.forbidden('Delivery does not belong to your fleet');
                }

                return ctx.send({ data: { ...delivery, recordType: 'delivery' } });
            } catch (err) {
                strapi.log.error('[Partner:getRide]', err);
                return ctx.internalServerError('Failed to fetch ride');
            }
        },

        // =========================================================================
        // POST /partner/rides/:id/cancel
        // =========================================================================
        async cancelRide(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const { id } = ctx.params;
                const { reason = 'Cancelled by partner', isDelivery } = ctx.request.body;

                const driverIds = await getPartnerDriverIds(partnerUser.id);

                if (isDelivery) {
                    // ── Cancel delivery ──────────────────────────────────────────────
                    const delivery = await strapi.db.query('api::delivery.delivery').findOne({
                        where: { id: Number(id) },
                        populate: {
                            deliverer: { populate: { deliveryProfile: { select: ['id', 'cancelledDeliveries'] } } },
                            package: { select: ['id'] },
                        },
                    });

                    if (!delivery) return ctx.notFound('Delivery not found');

                    const deliveryDriverId = delivery.deliverer?.id ?? delivery.deliverer;
                    if (!driverIds.includes(Number(deliveryDriverId))) {
                        return ctx.forbidden('Delivery does not belong to your fleet');
                    }

                    if (['completed', 'cancelled'].includes(delivery.rideStatus)) {
                        return ctx.badRequest('Cannot cancel a completed or already-cancelled delivery');
                    }

                    const updatedDelivery = await strapi.db.query('api::delivery.delivery').update({
                        where: { id: Number(id) },
                        data: {
                            rideStatus: 'cancelled',
                            cancelledAt: new Date(),
                            cancelledBy: 'partner',
                            cancellationReason: reason,
                            cancellationFee: 0,
                        },
                    });

                    // Free up the delivery driver
                    if (delivery.deliverer?.deliveryProfile?.id) {
                        await strapi.db.query('delivery-profiles.delivery-profile').update({
                            where: { id: delivery.deliverer.deliveryProfile.id },
                            data: {
                                isAvailable: true,
                                isEnroute: false,
                                currentDelivery: null,
                                cancelledDeliveries: (delivery.deliverer.deliveryProfile.cancelledDeliveries || 0) + 1,
                            },
                        });
                    }

                    // Update package status
                    if (delivery.package?.id) {
                        await strapi.db.query('api::package.package').update({
                            where: { id: delivery.package.id },
                            data: { packageStatus: 'cancelled' },
                        });
                    }

                    socketService.emit('delivery:cancelled', {
                        deliveryId: Number(id),
                        cancelledBy: 'partner',
                        reason,
                        cancellationFee: 0,
                    });

                    return ctx.send({ success: true, data: updatedDelivery });
                }

                // ── Cancel ride ──────────────────────────────────────────────────
                const ride = await strapi.db.query('api::ride.ride').findOne({
                    where: { id: Number(id) },
                    populate: {
                        driver: {
                            populate: { driverProfile: { select: ['id', 'cancelledRides'] } },
                        },
                    },
                });

                if (!ride) return ctx.notFound('Ride not found');

                const rideDriverId = ride.driver?.id ?? ride.driver;
                if (!driverIds.includes(Number(rideDriverId))) {
                    return ctx.forbidden('Ride does not belong to your fleet');
                }

                if (['completed', 'cancelled'].includes(ride.rideStatus)) {
                    return ctx.badRequest('Cannot cancel a completed or already-cancelled ride');
                }

                const updatedRide = await strapi.db.query('api::ride.ride').update({
                    where: { id: Number(id) },
                    data: {
                        rideStatus: 'cancelled',
                        cancelledAt: new Date(),
                        cancelledBy: 'partner',
                        cancellationReason: reason,
                        cancellationFee: 0,
                    },
                });

                // Free up the driver
                if (ride.driver?.driverProfile?.id) {
                    await strapi.db.query('driver-profiles.driver-profile').update({
                        where: { id: ride.driver.driverProfile.id },
                        data: {
                            isAvailable: true,
                            isEnroute: false,
                            currentRide: null,
                            cancelledRides: (ride.driver.driverProfile.cancelledRides || 0) + 1,
                        },
                    });
                }

                socketService.emit('ride:cancelled', {
                    rideId: Number(id),
                    cancelledBy: 'partner',
                    reason,
                    cancellationFee: 0,
                });

                return ctx.send({ success: true, data: updatedRide });
            } catch (err: any) {
                strapi.log.error('[Partner:cancelRide]', err);
                return ctx.internalServerError(err.message || 'Failed to cancel ride');
            }
        },

        // =========================================================================
        // POST /partner/drivers/:id/report
        // =========================================================================
        async reportDriver(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const { id } = ctx.params;
                const { reason, details } = ctx.request.body;

                if (!reason) return ctx.badRequest('reason is required');

                const driver = await getOwnedDriver(id, partnerUser.id);
                if (!driver) return ctx.forbidden('Driver is not in your fleet');

                const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});
                const adminEmails: string[] = Array.isArray(settings?.adminSupportEmails)
                    ? settings.adminSupportEmails
                    : [];

                const driverName = `${(driver as any).firstName || ''} ${(driver as any).lastName || ''}`.trim();
                const partnerName = `${partnerUser.firstName || ''} ${partnerUser.lastName || ''}`.trim();
                const biz = partnerUser.partnerProfile?.businessName
                    ? ` (${partnerUser.partnerProfile.businessName})`
                    : '';

                const emailBody =
                    `Driver Report — OkraRides Partner Dashboard\n\n` +
                    `Reported By: ${partnerName}${biz} (Partner User ID: ${partnerUser.id})\n` +
                    `Driver:      ${driverName} (User ID: ${id})\n` +
                    `Phone:       ${resolvePhone(driver) || 'N/A'}\n` +
                    `Reason:      ${reason}\n` +
                    `Details:     ${details || 'N/A'}\n` +
                    `Timestamp:   ${new Date().toISOString()}\n`;

                adminEmails.forEach((email: string) => {
                    try { SendEmailNotification(email, emailBody); } catch { /* non-fatal */ }
                });

                // Also notify platform support numbers via SMS if available
                const adminNumbers: string[] = Array.isArray(settings?.adminSupportNumbers)
                    ? settings.adminSupportNumbers
                    : [];
                adminNumbers.forEach((phone: string) => {
                    try {
                        SendSmsNotification(
                            phone,
                            `PARTNER REPORT: ${partnerName} reported driver ${driverName} (ID: ${id}). Reason: ${reason}`
                        );
                    } catch { /* non-fatal */ }
                });

                return ctx.send({ success: true, message: 'Report submitted to Okra support' });
            } catch (err) {
                strapi.log.error('[Partner:reportDriver]', err);
                return ctx.internalServerError('Failed to submit report');
            }
        },

        // =========================================================================
        // POST /partner/support
        // =========================================================================
        async contactSupport(ctx: any) {
            try {
                const partnerUser = await requireApprovedPartner(ctx);
                if (!partnerUser) return;

                const { subject, message } = ctx.request.body;

                if (!message || String(message).trim().length < 20) {
                    return ctx.badRequest('message must be at least 20 characters');
                }

                const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});
                const adminEmails: string[] = Array.isArray(settings?.adminSupportEmails)
                    ? settings.adminSupportEmails
                    : [];

                const partnerName = `${partnerUser.firstName || ''} ${partnerUser.lastName || ''}`.trim();
                const biz = partnerUser.partnerProfile?.businessName
                    ? ` (${partnerUser.partnerProfile.businessName})`
                    : '';

                const emailBody =
                    `Partner Support Request — OkraRides\n\n` +
                    `From:    ${partnerName}${biz}\n` +
                    `User ID: ${partnerUser.id}\n` +
                    `Phone:   ${partnerUser.phoneNumber || 'N/A'}\n` +
                    `Subject: ${subject || 'General Inquiry'}\n\n` +
                    `Message:\n${message}\n\n` +
                    `Sent at: ${new Date().toISOString()}\n`;

                adminEmails.forEach((email: string) => {
                    try { SendEmailNotification(email, emailBody); } catch { /* non-fatal */ }
                });

                return ctx.send({
                    success: true,
                    message: 'Message sent — our team will contact you within 24 hours.',
                });
            } catch (err) {
                strapi.log.error('[Partner:contactSupport]', err);
                return ctx.internalServerError('Failed to send support message');
            }
        },
    })
);