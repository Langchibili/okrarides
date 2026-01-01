// const axios = require('axios');

// // Configuration
// const STRAPI_URL = process.env.SERVERURL; // Change this to your Strapi URL
// const JWT_TOKEN = process.env.SERVERJWTTOKEN// Replace with your actual JWT token

// // Helper function to make API calls
// const api = axios.create({
//   baseURL: `${STRAPI_URL}/api`,
//   headers: {
//     'Authorization': `Bearer ${JWT_TOKEN}`,
//     'Content-Type': 'application/json'
//   }
// });

// // Helper to handle errors
// const handleError = (error, context) => {
//   console.error(`Error in ${context}:`, error.response?.data || error.message);
// };

// // Store created IDs for relations
// const createdIds = {};

// // Dummy data generators
// const dummyData = {
//   currencies: [
//     { name: 'Zambian Kwacha', code: 'ZMW', symbol: 'ZK', exchangeRate: 1, isActive: true },
//     { name: 'US Dollar', code: 'USD', symbol: '$', exchangeRate: 0.04, isActive: true },
//     { name: 'South African Rand', code: 'ZAR', symbol: 'R', exchangeRate: 0.75, isActive: true },
//     { name: 'Euro', code: 'EUR', symbol: '€', exchangeRate: 0.037, isActive: true },
//     { name: 'British Pound', code: 'GBP', symbol: '£', exchangeRate: 0.032, isActive: true }
//   ],

//   countries: (currencyIds) => [
//     { name: 'Zambia', code: 'ZM', phoneCode: '+260', isActive: true, currency: currencyIds[0] },
//     { name: 'South Africa', code: 'ZA', phoneCode: '+27', isActive: true, currency: currencyIds[2] },
//     { name: 'Botswana', code: 'BW', phoneCode: '+267', isActive: true, currency: currencyIds[1] },
//     { name: 'Zimbabwe', code: 'ZW', phoneCode: '+263', isActive: true, currency: currencyIds[1] },
//     { name: 'Namibia', code: 'NA', phoneCode: '+264', isActive: true, currency: currencyIds[2] }
//   ],

//   languages: [
//     { name: 'English', code: 'en', isRTL: false, isActive: true, isDefault: true },
//     { name: 'Bemba', code: 'bem', isRTL: false, isActive: true, isDefault: false },
//     { name: 'Nyanja', code: 'ny', isRTL: false, isActive: true, isDefault: false },
//     { name: 'Tonga', code: 'toi', isRTL: false, isActive: true, isDefault: false },
//     { name: 'Lozi', code: 'loz', isRTL: false, isActive: true, isDefault: false }
//   ],

//   taxiTypes: [
//     { name: 'Sedan', isActive: true, displayOrder: 1 },
//     { name: 'SUV', isActive: true, displayOrder: 2 },
//     { name: 'Van', isActive: true, displayOrder: 3 },
//     { name: 'Hatchback', isActive: true, displayOrder: 4 },
//     { name: 'Luxury', isActive: true, displayOrder: 5 }
//   ],

//   rideClasses: (taxiTypeIds) => [
//     { name: 'Economy', description: 'Budget-friendly rides', baseFare: 10, perKmRate: 3, perMinuteRate: 0.5, minimumFare: 15, commissionPercentage: 15, isActive: true, displayOrder: 1, taxiType: taxiTypeIds[0] },
//     { name: 'Comfort', description: 'Comfortable rides with more space', baseFare: 15, perKmRate: 4, perMinuteRate: 0.7, minimumFare: 20, commissionPercentage: 18, isActive: true, displayOrder: 2, taxiType: taxiTypeIds[1] },
//     { name: 'Premium', description: 'Luxury vehicles and professional drivers', baseFare: 25, perKmRate: 6, perMinuteRate: 1, minimumFare: 35, commissionPercentage: 20, isActive: true, displayOrder: 3, taxiType: taxiTypeIds[4] },
//     { name: 'Shared', description: 'Share rides and split costs', baseFare: 8, perKmRate: 2, perMinuteRate: 0.3, minimumFare: 10, commissionPercentage: 12, isActive: true, displayOrder: 4, taxiType: taxiTypeIds[3] },
//     { name: 'XL', description: 'Extra large vehicles for groups', baseFare: 20, perKmRate: 5, perMinuteRate: 0.8, minimumFare: 30, commissionPercentage: 17, isActive: true, displayOrder: 5, taxiType: taxiTypeIds[2] }
//   ],

//   geofenceZones: (countryIds) => [
//     { name: 'Lusaka Central', coordinates: { type: 'Polygon', coordinates: [[[-28.28333, 15.41667], [-28.28333, 15.50000], [-28.20000, 15.50000], [-28.20000, 15.41667], [-28.28333, 15.41667]]] }, isActive: true, surgeMultiplier: 1.2, country: countryIds[0] },
//     { name: 'Kabulonga', coordinates: { type: 'Polygon', coordinates: [[[-28.30000, 15.40000], [-28.30000, 15.45000], [-28.25000, 15.45000], [-28.25000, 15.40000], [-28.30000, 15.40000]]] }, isActive: true, surgeMultiplier: 1.5, country: countryIds[0] },
//     { name: 'Woodlands', coordinates: { type: 'Polygon', coordinates: [[[-28.32000, 15.42000], [-28.32000, 15.47000], [-28.27000, 15.47000], [-28.27000, 15.42000], [-28.32000, 15.42000]]] }, isActive: true, surgeMultiplier: 1.3, country: countryIds[0] },
//     { name: 'Cairo Road', coordinates: { type: 'Polygon', coordinates: [[[-28.28500, 15.42500], [-28.28500, 15.44000], [-28.27000, 15.44000], [-28.27000, 15.42500], [-28.28500, 15.42500]]] }, isActive: true, surgeMultiplier: 1.8, country: countryIds[0] },
//     { name: 'Northmead', coordinates: { type: 'Polygon', coordinates: [[[-28.29000, 15.38000], [-28.29000, 15.42000], [-28.25000, 15.42000], [-28.25000, 15.38000], [-28.29000, 15.38000]]] }, isActive: true, surgeMultiplier: 1.1, country: countryIds[0] }
//   ],

//   busStations: (geofenceIds) => [
//     { stationCode: 'LS-001', name: 'Lusaka Central Bus Station', location: { lat: -15.42667, lng: 28.28333 }, address: 'Cairo Road, Lusaka', isActive: true, geofenceZone: geofenceIds[0] },
//     { stationCode: 'LS-002', name: 'Intercity Bus Terminal', location: { lat: -15.43000, lng: 28.29000 }, address: 'Dedan Kimathi Road, Lusaka', isActive: true, geofenceZone: geofenceIds[0] },
//     { stationCode: 'LS-003', name: 'Woodlands Station', location: { lat: -15.43500, lng: 28.31000 }, address: 'Great East Road, Woodlands', isActive: true, geofenceZone: geofenceIds[2] },
//     { stationCode: 'LS-004', name: 'Northmead Terminal', location: { lat: -15.40000, lng: 28.27000 }, address: 'Northmead Shopping Centre', isActive: true, geofenceZone: geofenceIds[4] },
//     { stationCode: 'LS-005', name: 'Kabulonga Station', location: { lat: -15.41500, lng: 28.30500 }, address: 'Kabulonga Road', isActive: true, geofenceZone: geofenceIds[1] }
//   ],

//   busRoutes: (stationIds) => [
//     { routeCode: 'RT-001', name: 'Central to Woodlands', routePolyline: 'encoded_polyline_data', estimatedDuration: 30, totalDistance: 8.5, baseFare: 5, isIntercity: false, isActive: true, startStation: stationIds[0], endStation: stationIds[2], intermediateStations: [stationIds[1]] },
//     { routeCode: 'RT-002', name: 'Central to Northmead', routePolyline: 'encoded_polyline_data', estimatedDuration: 25, totalDistance: 7.2, baseFare: 4.5, isIntercity: false, isActive: true, startStation: stationIds[0], endStation: stationIds[3], intermediateStations: [] },
//     { routeCode: 'RT-003', name: 'Kabulonga to Central', routePolyline: 'encoded_polyline_data', estimatedDuration: 20, totalDistance: 6.5, baseFare: 4, isIntercity: false, isActive: true, startStation: stationIds[4], endStation: stationIds[0], intermediateStations: [] },
//     { routeCode: 'RT-004', name: 'Circular Route', routePolyline: 'encoded_polyline_data', estimatedDuration: 60, totalDistance: 20, baseFare: 8, isIntercity: false, isActive: true, startStation: stationIds[0], endStation: stationIds[0], intermediateStations: [stationIds[2], stationIds[3], stationIds[4]] },
//     { routeCode: 'RT-005', name: 'Lusaka to Livingstone', routePolyline: 'encoded_polyline_data', estimatedDuration: 360, totalDistance: 470, baseFare: 150, isIntercity: true, isActive: true, startStation: stationIds[1], endStation: stationIds[1], intermediateStations: [] }
//   ],

//   subscriptionPlans: (currencyIds) => [
//     { planId: 'SP-001', name: 'Daily Basic', description: 'Perfect for part-time drivers', price: 25, durationType: 'daily', durationValue: 1, features: ['Unlimited rides', 'Basic support'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: true, freeTrialDays: 1, isActive: true, isPopular: false, displayOrder: 1, currency: currencyIds[0] },
//     { planId: 'SP-002', name: 'Weekly Standard', description: 'Best value for regular drivers', price: 150, durationType: 'weekly', durationValue: 1, features: ['Unlimited rides', 'Priority support', '10% bonus'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: true, freeTrialDays: 3, isActive: true, isPopular: true, displayOrder: 2, currency: currencyIds[0] },
//     { planId: 'SP-003', name: 'Monthly Pro', description: 'Maximum savings for full-time drivers', price: 500, durationType: 'monthly', durationValue: 1, features: ['Unlimited rides', 'Premium support', '15% bonus', 'Free marketing materials'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: true, freeTrialDays: 7, isActive: true, isPopular: true, displayOrder: 3, currency: currencyIds[0] },
//     { planId: 'SP-004', name: 'Weekend Special', description: 'For weekend warriors', price: 80, durationType: 'weekly', durationValue: 1, features: ['Weekend rides only', 'Standard support'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: false, freeTrialDays: 0, isActive: true, isPopular: false, displayOrder: 4, currency: currencyIds[0] },
//     { planId: 'SP-005', name: 'Annual Premium', description: 'Best deal for committed drivers', price: 5000, durationType: 'yearly', durationValue: 1, features: ['Unlimited rides', 'VIP support', '20% bonus', 'Free marketing kit', 'Insurance discount'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: true, freeTrialDays: 14, isActive: true, isPopular: false, displayOrder: 5, currency: currencyIds[0] }
//   ],

//   cancellationReasons: [
//     { reason: 'Driver not moving', code: 'DRIVER_NOT_MOVING', applicableFor: 'rider', requiresExplanation: false, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 1 },
//     { reason: 'Wrong pickup location', code: 'WRONG_PICKUP', applicableFor: 'driver', requiresExplanation: false, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 2 },
//     { reason: 'Passenger no-show', code: 'PASSENGER_NO_SHOW', applicableFor: 'driver', requiresExplanation: false, hasFee: true, feeAmount: 10, feePercentage: 0, isActive: true, displayOrder: 3 },
//     { reason: 'Change of plans', code: 'CHANGE_OF_PLANS', applicableFor: 'both', requiresExplanation: false, hasFee: true, feeAmount: 5, feePercentage: 0, isActive: true, displayOrder: 4 },
//     { reason: 'Emergency situation', code: 'EMERGENCY', applicableFor: 'both', requiresExplanation: true, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 5 },
//     { reason: 'Vehicle breakdown', code: 'VEHICLE_BREAKDOWN', applicableFor: 'driver', requiresExplanation: true, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 6 },
//     { reason: 'Unsafe conditions', code: 'UNSAFE_CONDITIONS', applicableFor: 'both', requiresExplanation: true, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 7 }
//   ],

//   promoCodes: (currencyIds) => [
//     { code: 'WELCOME50', name: 'Welcome Bonus', description: '50% off first ride', discountType: 'percentage', discountValue: 50, maxDiscountAmount: 20, minimumOrderValue: 10, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-12-31'), maxUsageCount: 1000, maxUsagePerUser: 1, currentUsageCount: 0, applicableFor: 'new_users', applicableRideTypes: ['taxi', 'bus', 'delivery'], isActive: true },
//     { code: 'DAILY10', name: 'Daily Discount', description: '10 ZMW off any ride', discountType: 'fixed_amount', discountValue: 10, maxDiscountAmount: 10, minimumOrderValue: 30, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-12-31'), maxUsageCount: null, maxUsagePerUser: 1, currentUsageCount: 0, applicableFor: 'all_users', applicableRideTypes: ['taxi'], isActive: true },
//     { code: 'WEEKEND25', name: 'Weekend Special', description: '25% off weekend rides', discountType: 'percentage', discountValue: 25, maxDiscountAmount: 30, minimumOrderValue: 20, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-12-31'), maxUsageCount: null, maxUsagePerUser: 4, currentUsageCount: 0, applicableFor: 'all_users', applicableRideTypes: ['taxi', 'bus'], isActive: true },
//     { code: 'DELIVERY15', name: 'Delivery Discount', description: '15% off delivery orders', discountType: 'percentage', discountValue: 15, maxDiscountAmount: 25, minimumOrderValue: 15, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-12-31'), maxUsageCount: null, maxUsagePerUser: 10, currentUsageCount: 0, applicableFor: 'all_users', applicableRideTypes: ['delivery'], isActive: true },
//     { code: 'LOYALTY100', name: 'Loyalty Reward', description: '100 ZMW off for loyal customers', discountType: 'fixed_amount', discountValue: 100, maxDiscountAmount: 100, minimumOrderValue: 200, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-06-30'), maxUsageCount: 100, maxUsagePerUser: 1, currentUsageCount: 0, applicableFor: 'specific_users', applicableRideTypes: ['taxi', 'bus', 'delivery'], isActive: true }
//   ],

//   systemAnnouncements: [
//     { title: 'Welcome to OkraRides!', message: 'Thank you for choosing OkraRides. Safe travels!', type: 'info', targetAudience: 'all', priority: 'medium', showFrom: new Date('2025-01-01'), showUntil: new Date('2025-12-31'), isActive: true, isDismissible: true, linkUrl: null, linkText: null },
//     { title: 'New Features Available', message: 'Check out our latest app features including real-time tracking and in-app chat!', type: 'feature', targetAudience: 'all', priority: 'high', showFrom: new Date('2025-01-01'), showUntil: new Date('2025-03-31'), isActive: true, isDismissible: true, linkUrl: '/features', linkText: 'Learn More' },
//     { title: 'Scheduled Maintenance', message: 'System will undergo maintenance on Sunday 2 AM - 4 AM', type: 'maintenance', targetAudience: 'all', priority: 'high', showFrom: new Date('2025-01-15'), showUntil: new Date('2025-01-20'), isActive: true, isDismissible: false, linkUrl: null, linkText: null },
//     { title: 'Driver Bonus Week!', message: 'Complete 50 rides this week and earn 500 ZMW bonus!', type: 'promotion', targetAudience: 'drivers', priority: 'high', showFrom: new Date('2025-02-01'), showUntil: new Date('2025-02-07'), isActive: true, isDismissible: true, linkUrl: '/promotions', linkText: 'Details' },
//     { title: 'Safety First', message: 'Always verify your driver and vehicle details before getting in', type: 'warning', targetAudience: 'riders', priority: 'medium', showFrom: new Date('2025-01-01'), showUntil: new Date('2025-12-31'), isActive: true, isDismissible: true, linkUrl: '/safety', linkText: 'Safety Tips' }
//   ],

//   appVersions: [
//     { platform: 'android', appType: 'rider', versionNumber: '2.5.0', versionCode: 250, releaseDate: new Date('2025-01-15'), isForceUpdate: false, minimumSupportedVersion: '2.0.0', downloadUrl: 'https://play.google.com/store/apps/okrarides-rider', releaseNotes: 'Bug fixes and performance improvements', changelog: ['Fixed crash on startup', 'Improved map loading', 'Updated payment flow'], isActive: true },
//     { platform: 'ios', appType: 'rider', versionNumber: '2.5.0', versionCode: 250, releaseDate: new Date('2025-01-15'), isForceUpdate: false, minimumSupportedVersion: '2.0.0', downloadUrl: 'https://apps.apple.com/okrarides-rider', releaseNotes: 'Bug fixes and performance improvements', changelog: ['Fixed crash on startup', 'Improved map loading', 'Updated payment flow'], isActive: true },
//     { platform: 'android', appType: 'driver', versionNumber: '2.4.5', versionCode: 245, releaseDate: new Date('2025-01-10'), isForceUpdate: false, minimumSupportedVersion: '2.0.0', downloadUrl: 'https://play.google.com/store/apps/okrarides-driver', releaseNotes: 'New earnings dashboard', changelog: ['Added detailed earnings breakdown', 'Improved navigation integration', 'Bug fixes'], isActive: true },
//     { platform: 'ios', appType: 'driver', versionNumber: '2.4.5', versionCode: 245, releaseDate: new Date('2025-01-10'), isForceUpdate: false, minimumSupportedVersion: '2.0.0', downloadUrl: 'https://apps.apple.com/okrarides-driver', releaseNotes: 'New earnings dashboard', changelog: ['Added detailed earnings breakdown', 'Improved navigation integration', 'Bug fixes'], isActive: true },
//     { platform: 'web', appType: 'admin', versionNumber: '1.8.0', versionCode: 180, releaseDate: new Date('2025-01-20'), isForceUpdate: true, minimumSupportedVersion: '1.5.0', downloadUrl: 'https://admin.okrarides.com', releaseNotes: 'Major security update', changelog: ['Security patches', 'New analytics features', 'UI improvements'], isActive: true }
//   ]
// };

// // Main execution function
// async function populateData() {
//   console.log('Starting data population...\n');

//   try {
//     // Step 1: Create Currencies
//     console.log('Creating Currencies...');
//     createdIds.currencies = [];
//     for (const currency of dummyData.currencies) {
//       try {
//         const response = await api.post('/currencies', { data: currency });
//         createdIds.currencies.push(response.data.data.id);
//         console.log(`✓ Created currency: ${currency.name}`);
//       } catch (error) {
//         handleError(error, `Creating currency ${currency.name}`);
//       }
//     }

//     // Step 2: Create Countries
//     console.log('\nCreating Countries...');
//     createdIds.countries = [];
//     for (const country of dummyData.countries(createdIds.currencies)) {
//       try {
//         const response = await api.post('/countries', { data: country });
//         createdIds.countries.push(response.data.data.id);
//         console.log(`✓ Created country: ${country.name}`);
//       } catch (error) {
//         handleError(error, `Creating country ${country.name}`);
//       }
//     }

//     // Step 3: Create Languages
//     console.log('\nCreating Languages...');
//     createdIds.languages = [];
//     for (const language of dummyData.languages) {
//       try {
//         const response = await api.post('/languages', { data: language });
//         createdIds.languages.push(response.data.data.id);
//         console.log(`✓ Created language: ${language.name}`);
//       } catch (error) {
//         handleError(error, `Creating language ${language.name}`);
//       }
//     }

//     // Step 4: Create Taxi Types
//     console.log('\nCreating Taxi Types...');
//     createdIds.taxiTypes = [];
//     for (const taxiType of dummyData.taxiTypes) {
//       try {
//         const response = await api.post('/taxi-types', { data: taxiType });
//         createdIds.taxiTypes.push(response.data.data.id);
//         console.log(`✓ Created taxi type: ${taxiType.name}`);
//       } catch (error) {
//         handleError(error, `Creating taxi type ${taxiType.name}`);
//       }
//     }

//     // Step 5: Create Ride Classes
//     console.log('\nCreating Ride Classes...');
//     createdIds.rideClasses = [];
//     for (const rideClass of dummyData.rideClasses(createdIds.taxiTypes)) {
//       try {
//         const response = await api.post('/ride-classes', { data: rideClass });
//         createdIds.rideClasses.push(response.data.data.id);
//         console.log(`✓ Created ride class: ${rideClass.name}`);
//       } catch (error) {
//         handleError(error, `Creating ride class ${rideClass.name}`);
//       }
//     }

//     // Step 6: Create Geofence Zones
//     console.log('\nCreating Geofence Zones...');
//     createdIds.geofenceZones = [];
//     for (const zone of dummyData.geofenceZones(createdIds.countries)) {
//       try {
//         const response = await api.post('/geofence-zones', { data: zone });
//         createdIds.geofenceZones.push(response.data.data.id);
//         console.log(`✓ Created geofence zone: ${zone.name}`);
//       } catch (error) {
//         handleError(error, `Creating geofence zone ${zone.name}`);
//       }
//     }

//     // Step 7: Create Bus Stations
//     console.log('\nCreating Bus Stations...');
//     createdIds.busStations = [];
//     for (const station of dummyData.busStations(createdIds.geofenceZones)) {
//       try {
//         const response = await api.post('/bus-stations', { data: station });
//         createdIds.busStations.push(response.data.data.id);
//         console.log(`✓ Created bus station: ${station.name}`);
//       } catch (error) {
//         handleError(error, `Creating bus station ${station.name}`);
//       }
//     }

//     // Step 8: Create Bus Routes
//     console.log('\nCreating Bus Routes...');
//     createdIds.busRoutes = [];
//     for (const route of dummyData.busRoutes(createdIds.busStations)) {
//       try {
//         const response = await api.post('/bus-routes', { data: route });
//         createdIds.busRoutes.push(response.data.data.id);
//         console.log(`✓ Created bus route: ${route.name}`);
//       } catch (error) {
//         handleError(error, `Creating bus route ${route.name}`);
//       }
//     }

//     // Step 9: Create Subscription Plans
//     console.log('\nCreating Subscription Plans...');
//     createdIds.subscriptionPlans = [];
//     for (const plan of dummyData.subscriptionPlans(createdIds.currencies)) {
//       try {
//         const response = await api.post('/subscription-plans', { data: plan });
//         createdIds.subscriptionPlans.push(response.data.data.id);
//         console.log(`✓ Created subscription plan: ${plan.name}`);
//       } catch (error) {
//         handleError(error, `Creating subscription plan ${plan.name}`);
//       }
//     }

//     // Step 10: Create Cancellation Reasons
//     console.log('\nCreating Cancellation Reasons...');
//     for (const reason of dummyData.cancellationReasons) {
//       try {
//         await api.post('/cancellation-reasons', { data: reason });
//         console.log(`✓ Created cancellation reason: ${reason.reason}`);
//       } catch (error) {
//         handleError(error, `Creating cancellation reason ${reason.reason}`);
//       }
//     }

//     // Step 11: Create Promo Codes
//     console.log('\nCreating Promo Codes...');
//     for (const promo of dummyData.promoCodes(createdIds.currencies)) {
//       try {
//         await api.post('/promo-codes', { data: promo });
//         console.log(`✓ Created promo code: ${promo.code}`);
//       } catch (error) {
//         handleError(error, `Creating promo code ${promo.code}`);
//       }
//     }

//     // Step 12: Create System Announcements
//     console.log('\nCreating System Announcements...');
//     for (const announcement of dummyData.systemAnnouncements) {
//       try {
//         await api.post('/system-announcements', { data: announcement });
//         console.log(`✓ Created announcement: ${announcement.title}`);
//       } catch (error) {
//         handleError(error, `Creating announcement ${announcement.title}`);
//       }
//     }

//     // Step 13: Create App Versions
//     console.log('\nCreating App Versions...');
//     for (const version of dummyData.appVersions) {
//       try {
//         await api.post('/app-versions', { data: version });
//         console.log(`✓ Created app version: ${version.platform} ${version.appType} ${version.versionNumber}`);
//       } catch (error) {
//         handleError(error, `Creating app version ${version.platform} ${version.appType}`);
//       }
//     }

//     console.log('\n✅ Data population completed successfully!');
//     console.log('\nCreated IDs summary:');
//     console.log(`Currencies: ${createdIds.currencies?.length || 0}`);
//     console.log(`Countries: ${createdIds.countries?.length || 0}`);
//     console.log(`Languages: ${createdIds.languages?.length || 0}`);
//     console.log(`Taxi Types: ${createdIds.taxiTypes?.length || 0}`);
//     console.log(`Ride Classes: ${createdIds.rideClasses?.length || 0}`);
//     console.log(`Geofence Zones: ${createdIds.geofenceZones?.length || 0}`);
//     console.log(`Bus Stations: ${createdIds.busStations?.length || 0}`);
//     console.log(`Bus Routes: ${createdIds.busRoutes?.length || 0}`);
//     console.log(`Subscription Plans: ${createdIds.subscriptionPlans?.length || 0}`);

//   } catch (error) {
//     console.error('\n❌ Fatal error during data population:', error.message);
//     process.exit(1);
//   }
// }

// // Run the script
// populateData();
const axios = require('axios');

// Configuration
const STRAPI_URL = process.env.SERVERURL; // Change this to your Strapi URL
const JWT_TOKEN = process.env.SERVERJWTTOKEN// Replace with your actual JWT token


// Helper function to make API calls
const api = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Helper to handle errors
const handleError = (error, context) => {
  console.error(`Error in ${context}:`, error.response?.data || error.message);
};

// Helper to find or create an entry
async function findOrCreate(endpoint, data, uniqueField) {
  try {
    // Try to find existing entry
    const searchValue = data[uniqueField];
    const findResponse = await api.get(`${endpoint}?filters[${uniqueField}][$eq]=${encodeURIComponent(searchValue)}`);
    
    if (findResponse.data.data && findResponse.data.data.length > 0) {
      console.log(`⊙ Found existing: ${searchValue}`);
      return findResponse.data.data[0];
    }
    
    // Create new entry if not found
    const createResponse = await api.post(endpoint, { data });
    console.log(`✓ Created: ${searchValue}`);
    return createResponse.data.data;
  } catch (error) {
    handleError(error, `Finding or creating ${endpoint}`);
    return null;
  }
}

// Store created IDs for relations
const createdIds = {};

// Dummy data generators
const dummyData = {
  currencies: [
    { name: 'Zambian Kwacha', code: 'ZMW', symbol: 'ZK', exchangeRate: 1, isActive: true },
    { name: 'US Dollar', code: 'USD', symbol: '$', exchangeRate: 0.04, isActive: true },
    { name: 'South African Rand', code: 'ZAR', symbol: 'R', exchangeRate: 0.75, isActive: true },
    { name: 'Euro', code: 'EUR', symbol: '€', exchangeRate: 0.037, isActive: true },
    { name: 'British Pound', code: 'GBP', symbol: '£', exchangeRate: 0.032, isActive: true }
  ],

  countries: (currencyIds) => [
    { name: 'Zambia', code: 'ZM', phoneCode: '+260', isActive: true, currency: currencyIds[0] },
    { name: 'South Africa', code: 'ZA', phoneCode: '+27', isActive: true, currency: currencyIds[2] },
    { name: 'Botswana', code: 'BW', phoneCode: '+267', isActive: true, currency: currencyIds[1] },
    { name: 'Zimbabwe', code: 'ZW', phoneCode: '+263', isActive: true, currency: currencyIds[1] },
    { name: 'Namibia', code: 'NA', phoneCode: '+264', isActive: true, currency: currencyIds[2] }
  ],

  languages: [
    { name: 'English', code: 'en', isRTL: false, isActive: true, isDefault: true },
    { name: 'Bemba', code: 'bem', isRTL: false, isActive: true, isDefault: false },
    { name: 'Nyanja', code: 'ny', isRTL: false, isActive: true, isDefault: false },
    { name: 'Tonga', code: 'toi', isRTL: false, isActive: true, isDefault: false },
    { name: 'Lozi', code: 'loz', isRTL: false, isActive: true, isDefault: false }
  ],

  taxiTypes: [
    { name: 'Sedan', isActive: true, displayOrder: 1 },
    { name: 'SUV', isActive: true, displayOrder: 2 },
    { name: 'Van', isActive: true, displayOrder: 3 },
    { name: 'Hatchback', isActive: true, displayOrder: 4 },
    { name: 'Luxury', isActive: true, displayOrder: 5 }
  ],

  rideClasses: (taxiTypeIds) => [
    { name: 'Economy', description: 'Budget-friendly rides', baseFare: 10, perKmRate: 3, perMinuteRate: 0.5, minimumFare: 15, commissionPercentage: 15, isActive: true, displayOrder: 1, taxiType: taxiTypeIds[0] },
    { name: 'Comfort', description: 'Comfortable rides with more space', baseFare: 15, perKmRate: 4, perMinuteRate: 0.7, minimumFare: 20, commissionPercentage: 18, isActive: true, displayOrder: 2, taxiType: taxiTypeIds[1] },
    { name: 'Premium', description: 'Luxury vehicles and professional drivers', baseFare: 25, perKmRate: 6, perMinuteRate: 1, minimumFare: 35, commissionPercentage: 20, isActive: true, displayOrder: 3, taxiType: taxiTypeIds[4] },
    { name: 'Shared', description: 'Share rides and split costs', baseFare: 8, perKmRate: 2, perMinuteRate: 0.3, minimumFare: 10, commissionPercentage: 12, isActive: true, displayOrder: 4, taxiType: taxiTypeIds[3] },
    { name: 'XL', description: 'Extra large vehicles for groups', baseFare: 20, perKmRate: 5, perMinuteRate: 0.8, minimumFare: 30, commissionPercentage: 17, isActive: true, displayOrder: 5, taxiType: taxiTypeIds[2] }
  ],

  geofenceZones: (countryIds) => [
    { name: 'Lusaka Central', coordinates: { type: 'Polygon', coordinates: [[[-28.28333, 15.41667], [-28.28333, 15.50000], [-28.20000, 15.50000], [-28.20000, 15.41667], [-28.28333, 15.41667]]] }, isActive: true, surgeMultiplier: 1.2, country: countryIds[0] },
    { name: 'Kabulonga', coordinates: { type: 'Polygon', coordinates: [[[-28.30000, 15.40000], [-28.30000, 15.45000], [-28.25000, 15.45000], [-28.25000, 15.40000], [-28.30000, 15.40000]]] }, isActive: true, surgeMultiplier: 1.5, country: countryIds[0] },
    { name: 'Woodlands', coordinates: { type: 'Polygon', coordinates: [[[-28.32000, 15.42000], [-28.32000, 15.47000], [-28.27000, 15.47000], [-28.27000, 15.42000], [-28.32000, 15.42000]]] }, isActive: true, surgeMultiplier: 1.3, country: countryIds[0] },
    { name: 'Cairo Road', coordinates: { type: 'Polygon', coordinates: [[[-28.28500, 15.42500], [-28.28500, 15.44000], [-28.27000, 15.44000], [-28.27000, 15.42500], [-28.28500, 15.42500]]] }, isActive: true, surgeMultiplier: 1.8, country: countryIds[0] },
    { name: 'Northmead', coordinates: { type: 'Polygon', coordinates: [[[-28.29000, 15.38000], [-28.29000, 15.42000], [-28.25000, 15.42000], [-28.25000, 15.38000], [-28.29000, 15.38000]]] }, isActive: true, surgeMultiplier: 1.1, country: countryIds[0] }
  ],

  busStations: (geofenceIds) => [
    { stationCode: 'LS-001', name: 'Lusaka Central Bus Station', location: { lat: -15.42667, lng: 28.28333 }, address: 'Cairo Road, Lusaka', isActive: true, geofenceZone: geofenceIds[0] },
    { stationCode: 'LS-002', name: 'Intercity Bus Terminal', location: { lat: -15.43000, lng: 28.29000 }, address: 'Dedan Kimathi Road, Lusaka', isActive: true, geofenceZone: geofenceIds[0] },
    { stationCode: 'LS-003', name: 'Woodlands Station', location: { lat: -15.43500, lng: 28.31000 }, address: 'Great East Road, Woodlands', isActive: true, geofenceZone: geofenceIds[2] },
    { stationCode: 'LS-004', name: 'Northmead Terminal', location: { lat: -15.40000, lng: 28.27000 }, address: 'Northmead Shopping Centre', isActive: true, geofenceZone: geofenceIds[4] },
    { stationCode: 'LS-005', name: 'Kabulonga Station', location: { lat: -15.41500, lng: 28.30500 }, address: 'Kabulonga Road', isActive: true, geofenceZone: geofenceIds[1] }
  ],

  busRoutes: (stationIds) => [
    { routeCode: 'RT-001', name: 'Central to Woodlands', routePolyline: 'encoded_polyline_data', estimatedDuration: 30, totalDistance: 8.5, baseFare: 5, isIntercity: false, isActive: true, startStation: stationIds[0], endStation: stationIds[2], intermediateStations: [stationIds[1]] },
    { routeCode: 'RT-002', name: 'Central to Northmead', routePolyline: 'encoded_polyline_data', estimatedDuration: 25, totalDistance: 7.2, baseFare: 4.5, isIntercity: false, isActive: true, startStation: stationIds[0], endStation: stationIds[3], intermediateStations: [] },
    { routeCode: 'RT-003', name: 'Kabulonga to Central', routePolyline: 'encoded_polyline_data', estimatedDuration: 20, totalDistance: 6.5, baseFare: 4, isIntercity: false, isActive: true, startStation: stationIds[4], endStation: stationIds[0], intermediateStations: [] },
    { routeCode: 'RT-004', name: 'Circular Route', routePolyline: 'encoded_polyline_data', estimatedDuration: 60, totalDistance: 20, baseFare: 8, isIntercity: false, isActive: true, startStation: stationIds[0], endStation: stationIds[0], intermediateStations: [stationIds[2], stationIds[3], stationIds[4]] },
    { routeCode: 'RT-005', name: 'Lusaka to Livingstone', routePolyline: 'encoded_polyline_data', estimatedDuration: 360, totalDistance: 470, baseFare: 150, isIntercity: true, isActive: true, startStation: stationIds[1], endStation: stationIds[1], intermediateStations: [] }
  ],

  subscriptionPlans: (currencyIds) => [
    { planId: 'SP-001', name: 'Daily Basic', description: 'Perfect for part-time drivers', price: 25, durationType: 'daily', durationValue: 1, features: ['Unlimited rides', 'Basic support'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: true, freeTrialDays: 1, isActive: true, isPopular: false, displayOrder: 1, currency: currencyIds[0] },
    { planId: 'SP-002', name: 'Weekly Standard', description: 'Best value for regular drivers', price: 150, durationType: 'weekly', durationValue: 1, features: ['Unlimited rides', 'Priority support', '10% bonus'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: true, freeTrialDays: 3, isActive: true, isPopular: true, displayOrder: 2, currency: currencyIds[0] },
    { planId: 'SP-003', name: 'Monthly Pro', description: 'Maximum savings for full-time drivers', price: 500, durationType: 'monthly', durationValue: 1, features: ['Unlimited rides', 'Premium support', '15% bonus', 'Free marketing materials'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: true, freeTrialDays: 7, isActive: true, isPopular: true, displayOrder: 3, currency: currencyIds[0] },
    { planId: 'SP-004', name: 'Weekend Special', description: 'For weekend warriors', price: 80, durationType: 'weekly', durationValue: 1, features: ['Weekend rides only', 'Standard support'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: false, freeTrialDays: 0, isActive: true, isPopular: false, displayOrder: 4, currency: currencyIds[0] },
    { planId: 'SP-005', name: 'Annual Premium', description: 'Best deal for committed drivers', price: 5000, durationType: 'yearly', durationValue: 1, features: ['Unlimited rides', 'VIP support', '20% bonus', 'Free marketing kit', 'Insurance discount'], maxRidesPerDay: 999, maxRidesPerPeriod: 999, hasFreeTrial: true, freeTrialDays: 14, isActive: true, isPopular: false, displayOrder: 5, currency: currencyIds[0] }
  ],

  cancellationReasons: [
    { reason: 'Driver not moving', code: 'DRIVER_NOT_MOVING', applicableFor: 'rider', requiresExplanation: false, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 1 },
    { reason: 'Wrong pickup location', code: 'WRONG_PICKUP', applicableFor: 'driver', requiresExplanation: false, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 2 },
    { reason: 'Passenger no-show', code: 'PASSENGER_NO_SHOW', applicableFor: 'driver', requiresExplanation: false, hasFee: true, feeAmount: 10, feePercentage: 0, isActive: true, displayOrder: 3 },
    { reason: 'Change of plans', code: 'CHANGE_OF_PLANS', applicableFor: 'both', requiresExplanation: false, hasFee: true, feeAmount: 5, feePercentage: 0, isActive: true, displayOrder: 4 },
    { reason: 'Emergency situation', code: 'EMERGENCY', applicableFor: 'both', requiresExplanation: true, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 5 },
    { reason: 'Vehicle breakdown', code: 'VEHICLE_BREAKDOWN', applicableFor: 'driver', requiresExplanation: true, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 6 },
    { reason: 'Unsafe conditions', code: 'UNSAFE_CONDITIONS', applicableFor: 'both', requiresExplanation: true, hasFee: false, feeAmount: 0, feePercentage: 0, isActive: true, displayOrder: 7 }
  ],

  promoCodes: (currencyIds) => [
    { code: 'WELCOME50', name: 'Welcome Bonus', description: '50% off first ride', discountType: 'percentage', discountValue: 50, maxDiscountAmount: 20, minimumOrderValue: 10, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-12-31'), maxUsageCount: 1000, maxUsagePerUser: 1, currentUsageCount: 0, applicableFor: 'new_users', applicableRideTypes: ['taxi', 'bus', 'delivery'], isActive: true },
    { code: 'DAILY10', name: 'Daily Discount', description: '10 ZMW off any ride', discountType: 'fixed_amount', discountValue: 10, maxDiscountAmount: 10, minimumOrderValue: 30, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-12-31'), maxUsageCount: null, maxUsagePerUser: 1, currentUsageCount: 0, applicableFor: 'all_users', applicableRideTypes: ['taxi'], isActive: true },
    { code: 'WEEKEND25', name: 'Weekend Special', description: '25% off weekend rides', discountType: 'percentage', discountValue: 25, maxDiscountAmount: 30, minimumOrderValue: 20, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-12-31'), maxUsageCount: null, maxUsagePerUser: 4, currentUsageCount: 0, applicableFor: 'all_users', applicableRideTypes: ['taxi', 'bus'], isActive: true },
    { code: 'DELIVERY15', name: 'Delivery Discount', description: '15% off delivery orders', discountType: 'percentage', discountValue: 15, maxDiscountAmount: 25, minimumOrderValue: 15, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-12-31'), maxUsageCount: null, maxUsagePerUser: 10, currentUsageCount: 0, applicableFor: 'all_users', applicableRideTypes: ['delivery'], isActive: true },
    { code: 'LOYALTY100', name: 'Loyalty Reward', description: '100 ZMW off for loyal customers', discountType: 'fixed_amount', discountValue: 100, maxDiscountAmount: 100, minimumOrderValue: 200, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-06-30'), maxUsageCount: 100, maxUsagePerUser: 1, currentUsageCount: 0, applicableFor: 'specific_users', applicableRideTypes: ['taxi', 'bus', 'delivery'], isActive: true }
  ],

  systemAnnouncements: [
    { title: 'Welcome to OkraRides!', message: 'Thank you for choosing OkraRides. Safe travels!', type: 'info', targetAudience: 'all', priority: 'medium', showFrom: new Date('2025-01-01'), showUntil: new Date('2025-12-31'), isActive: true, isDismissible: true, linkUrl: null, linkText: null },
    { title: 'New Features Available', message: 'Check out our latest app features including real-time tracking and in-app chat!', type: 'feature', targetAudience: 'all', priority: 'high', showFrom: new Date('2025-01-01'), showUntil: new Date('2025-03-31'), isActive: true, isDismissible: true, linkUrl: '/features', linkText: 'Learn More' },
    { title: 'Scheduled Maintenance', message: 'System will undergo maintenance on Sunday 2 AM - 4 AM', type: 'maintenance', targetAudience: 'all', priority: 'high', showFrom: new Date('2025-01-15'), showUntil: new Date('2025-01-20'), isActive: true, isDismissible: false, linkUrl: null, linkText: null },
    { title: 'Driver Bonus Week!', message: 'Complete 50 rides this week and earn 500 ZMW bonus!', type: 'promotion', targetAudience: 'drivers', priority: 'high', showFrom: new Date('2025-02-01'), showUntil: new Date('2025-02-07'), isActive: true, isDismissible: true, linkUrl: '/promotions', linkText: 'Details' },
    { title: 'Safety First', message: 'Always verify your driver and vehicle details before getting in', type: 'warning', targetAudience: 'riders', priority: 'medium', showFrom: new Date('2025-01-01'), showUntil: new Date('2025-12-31'), isActive: true, isDismissible: true, linkUrl: '/safety', linkText: 'Safety Tips' }
  ],

  appVersions: [
    { platform: 'android', appType: 'rider', versionNumber: '2.5.0', versionCode: 250, releaseDate: new Date('2025-01-15'), isForceUpdate: false, minimumSupportedVersion: '2.0.0', downloadUrl: 'https://play.google.com/store/apps/okrarides-rider', releaseNotes: 'Bug fixes and performance improvements', changelog: ['Fixed crash on startup', 'Improved map loading', 'Updated payment flow'], isActive: true },
    { platform: 'ios', appType: 'rider', versionNumber: '2.5.0', versionCode: 250, releaseDate: new Date('2025-01-15'), isForceUpdate: false, minimumSupportedVersion: '2.0.0', downloadUrl: 'https://apps.apple.com/okrarides-rider', releaseNotes: 'Bug fixes and performance improvements', changelog: ['Fixed crash on startup', 'Improved map loading', 'Updated payment flow'], isActive: true },
    { platform: 'android', appType: 'driver', versionNumber: '2.4.5', versionCode: 245, releaseDate: new Date('2025-01-10'), isForceUpdate: false, minimumSupportedVersion: '2.0.0', downloadUrl: 'https://play.google.com/store/apps/okrarides-driver', releaseNotes: 'New earnings dashboard', changelog: ['Added detailed earnings breakdown', 'Improved navigation integration', 'Bug fixes'], isActive: true },
    { platform: 'ios', appType: 'driver', versionNumber: '2.4.5', versionCode: 245, releaseDate: new Date('2025-01-10'), isForceUpdate: false, minimumSupportedVersion: '2.0.0', downloadUrl: 'https://apps.apple.com/okrarides-driver', releaseNotes: 'New earnings dashboard', changelog: ['Added detailed earnings breakdown', 'Improved navigation integration', 'Bug fixes'], isActive: true },
    { platform: 'web', appType: 'admin', versionNumber: '1.8.0', versionCode: 180, releaseDate: new Date('2025-01-20'), isForceUpdate: true, minimumSupportedVersion: '1.5.0', downloadUrl: 'https://admin.okrarides.com', releaseNotes: 'Major security update', changelog: ['Security patches', 'New analytics features', 'UI improvements'], isActive: true }
  ]
};

// Main execution function
async function populateData() {
  console.log('Starting data population...\n');

  try {
    // Step 1: Create Currencies
    console.log('Creating Currencies...');
    createdIds.currencies = [];
    for (const currency of dummyData.currencies) {
      const result = await findOrCreate('/currencies', currency, 'code');
      if (result) createdIds.currencies.push(result.id);
    }

    // Step 2: Create Countries
    console.log('\nCreating Countries...');
    createdIds.countries = [];
    for (const country of dummyData.countries(createdIds.currencies)) {
      const result = await findOrCreate('/countries', country, 'code');
      if (result) createdIds.countries.push(result.id);
    }

    // Step 3: Create Languages
    console.log('\nCreating Languages...');
    createdIds.languages = [];
    for (const language of dummyData.languages) {
      const result = await findOrCreate('/languages', language, 'code');
      if (result) createdIds.languages.push(result.id);
    }

    // Step 4: Create Taxi Types
    console.log('\nCreating Taxi Types...');
    createdIds.taxiTypes = [];
    for (const taxiType of dummyData.taxiTypes) {
      const result = await findOrCreate('/taxi-types', taxiType, 'name');
      if (result) createdIds.taxiTypes.push(result.id);
    }

    // Step 5: Create Ride Classes
    console.log('\nCreating Ride Classes...');
    createdIds.rideClasses = [];
    for (const rideClass of dummyData.rideClasses(createdIds.taxiTypes)) {
      const result = await findOrCreate('/ride-classes', rideClass, 'name');
      if (result) createdIds.rideClasses.push(result.id);
    }

    // Step 6: Create Geofence Zones
    console.log('\nCreating Geofence Zones...');
    createdIds.geofenceZones = [];
    for (const zone of dummyData.geofenceZones(createdIds.countries)) {
      const result = await findOrCreate('/geofence-zones', zone, 'name');
      if (result) createdIds.geofenceZones.push(result.id);
    }

    // Step 7: Create Bus Stations
    console.log('\nCreating Bus Stations...');
    createdIds.busStations = [];
    for (const station of dummyData.busStations(createdIds.geofenceZones)) {
      const result = await findOrCreate('/bus-stations', station, 'stationCode');
      if (result) createdIds.busStations.push(result.id);
    }

    // Step 8: Create Bus Routes
    console.log('\nCreating Bus Routes...');
    createdIds.busRoutes = [];
    for (const route of dummyData.busRoutes(createdIds.busStations)) {
      const result = await findOrCreate('/bus-routes', route, 'routeCode');
      if (result) createdIds.busRoutes.push(result.id);
    }

    // Step 9: Create Subscription Plans
    console.log('\nCreating Subscription Plans...');
    createdIds.subscriptionPlans = [];
    for (const plan of dummyData.subscriptionPlans(createdIds.currencies)) {
      const result = await findOrCreate('/subscription-plans', plan, 'planId');
      if (result) createdIds.subscriptionPlans.push(result.id);
    }

    // Step 10: Create Cancellation Reasons
    console.log('\nCreating Cancellation Reasons...');
    for (const reason of dummyData.cancellationReasons) {
      await findOrCreate('/cancellation-reasons', reason, 'code');
    }

    // Step 11: Create Promo Codes
    console.log('\nCreating Promo Codes...');
    for (const promo of dummyData.promoCodes(createdIds.currencies)) {
      await findOrCreate('/promo-codes', promo, 'code');
    }

    // Step 12: Create System Announcements
    console.log('\nCreating System Announcements...');
    for (const announcement of dummyData.systemAnnouncements) {
      await findOrCreate('/system-announcements', announcement, 'title');
    }

    // Step 13: Create App Versions
    console.log('\nCreating App Versions...');
    for (const version of dummyData.appVersions) {
      const uniqueKey = `${version.platform}-${version.appType}-${version.versionNumber}`;
      // For app versions, we'll check by multiple fields
      try {
        const findResponse = await api.get(`/app-versions?filters[platform][$eq]=${version.platform}&filters[appType][$eq]=${version.appType}&filters[versionNumber][$eq]=${version.versionNumber}`);
        
        if (findResponse.data.data && findResponse.data.data.length > 0) {
          console.log(`⊙ Found existing: ${uniqueKey}`);
        } else {
          await api.post('/app-versions', { data: version });
          console.log(`✓ Created: ${uniqueKey}`);
        }
      } catch (error) {
        handleError(error, `Creating app version ${uniqueKey}`);
      }
    }

    console.log('\n✅ Data population completed successfully!');
    console.log('\nCreated IDs summary:');
    console.log(`Currencies: ${createdIds.currencies?.length || 0}`);
    console.log(`Countries: ${createdIds.countries?.length || 0}`);
    console.log(`Languages: ${createdIds.languages?.length || 0}`);
    console.log(`Taxi Types: ${createdIds.taxiTypes?.length || 0}`);
    console.log(`Ride Classes: ${createdIds.rideClasses?.length || 0}`);
    console.log(`Geofence Zones: ${createdIds.geofenceZones?.length || 0}`);
    console.log(`Bus Stations: ${createdIds.busStations?.length || 0}`);
    console.log(`Bus Routes: ${createdIds.busRoutes?.length || 0}`);
    console.log(`Subscription Plans: ${createdIds.subscriptionPlans?.length || 0}`);

  } catch (error) {
    console.error('\n❌ Fatal error during data population:', error.message);
    process.exit(1);
  }
}

// Run the script
populateData();