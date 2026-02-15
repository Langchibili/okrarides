// // sockets/src/index.js
// const { createServer } = require("http");
// const { Server } = require("socket.io");
// const fs = require('fs');
// const path = require('path');
// const winston = require("winston");
// // Check log file sizes and rotate if needed
// const LOG_FILE_MAX_SIZE = 100 * 1024 * 1024; // 100MB

// // ==================== ENVIRONMENT CONFIGURATION ====================
// let clientUrls, environment;

// environment = process.env.NODE_ENV || 'local';
// // environment = 'local';
// // environment = 'test';
// // environment = 'production';

// if (environment === 'local' || environment === 'development') {
//   clientUrls = [
//     'http://localhost:3000',  // Main frontend
//     'http://localhost:3001',  // Rider app
//     'http://localhost:3002',  // Driver app
//     'http://localhost:3003',  // Conductor app
//     'http://localhost:3004',  // Delivery app
//     'http://localhost:3005',  // Admin panel
//     'http://localhost:1343',  // Strapi backend
//   ];
// } else if (environment === 'test') {
//   clientUrls = [
//     'https://test.okrarides.com',
//     'https://book.test.okrarides.com',
//     'https://driver.test.okrarides.com',
//     'https://conductor.test.okrarides.com',
//     'https://delivery.test.okrarides.com',
//     'https://admin.test.okrarides.com',
//   ];
// } else if (environment === 'production') {
//   clientUrls = [
//     'https://okrarides.com',
//     'https://book.okrarides.com',
//     'https://driver.okrarides.com',
//     'https://conductor.okrarides.com',
//     'https://delivery.okrarides.com',
//     'https://admin.okrarides.com',
//   ];
// } else {
//   clientUrls = ['http://localhost:3000'];
// }

// // ==================== LOGGER SETUP ====================
// // const logger = winston.createLogger({
// //   level: process.env.LOG_LEVEL || 'info',
// //   format: winston.format.combine(
// //     winston.format.timestamp(),
// //     winston.format.json()
// //   ),
// //   transports: [
// //     new winston.transports.Console({
// //       format: winston.format.combine(
// //         winston.format.colorize(),
// //         winston.format.simple()
// //       )
// //     }),
// //     new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
// //     new winston.transports.File({ filename: 'logs/combined.log' })
// //   ]
// // });
// const checkAndRotateLog = (filename) => {
//   const filepath = path.join(__dirname, '..', 'logs', filename);
//   try {
//     const stats = fs.statSync(filepath);
//     if (stats.size > LOG_FILE_MAX_SIZE) {
//       fs.unlinkSync(filepath);
//       console.error(`Rotated log file: ${filename}`);
//     }
//   } catch (error) {
//     // File doesn't exist yet, ignore
//   }
// };

// const logger = winston.createLogger({
//   level: 'error',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   transports: [
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.simple()
//       ),
//       level: 'error'
//     }),
//     new winston.transports.File({
//       filename: 'logs/error.log',
//       level: 'error',
//       maxsize: LOG_FILE_MAX_SIZE,
//       maxFiles: 1
//     })
//   ]
// });
// // Check log files on startup
// checkAndRotateLog('error.log');
// checkAndRotateLog('combined.log');

// // ==================== HTTP & SOCKET.IO SERVER SETUP ====================
// const httpServer = createServer();
// const allowedOrigins = clientUrls;

// const io = new Server(httpServer, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true
//   },
//   pingTimeout: 60000,
//   pingInterval: 25000,
//   transports: ['websocket', 'polling']
// });

// // ==================== CONNECTION TRACKING ====================
// const connections = {
//   riders: new Map(),      // riderId -> socket.id
//   drivers: new Map(),     // driverId -> socket.id
//   conductors: new Map(),  // conductorId -> socket.id
//   delivery: new Map(),    // deliveryPersonId -> socket.id
//   admins: new Map(),      // adminId -> socket.id
//   sockets: new Map()      // socket.id -> { type, id, metadata }
// };

// // Active rides tracking
// const activeRides = new Map(); // rideId -> { riderId, driverId, status, socketIds }

// // Driver locations cache (for proximity matching)
// const driverLocations = new Map(); // driverId -> { lat, lng, timestamp, isAvailable }

// // ==================== HELPER FUNCTIONS ====================

// function getSocketByEntity(type, entityId) {
//   const map = connections[type];
//   if (!map) return null;
//   const socketId = map.get(entityId);
//   return socketId ? io.sockets.sockets.get(socketId) : null;
// }

// function emitToRoom(room, event, data) {
//   io.to(room).emit(event, data);
//   console.log(`Emitted '${event}' to room '${room}'`, { event, room, dataKeys: Object.keys(data) });
// }

// function emitToUser(type, userId, event, data) {
//   const room = `${type}:${userId}`;
//   emitToRoom(room, event, data);
// }

// function broadcastToNearbyDrivers(location, radius, event, data) {
//   const { lat, lng } = location;
//   const nearbyDrivers = [];

//   driverLocations.forEach((driverLoc, driverId) => {
//     if (!driverLoc.isAvailable) return;
    
//     const distance = calculateDistance(lat, lng, driverLoc.lat, driverLoc.lng);
//     if (distance <= radius) {
//       nearbyDrivers.push({ driverId, distance });
//     }
//   });

//   // Sort by distance
//   nearbyDrivers.sort((a, b) => a.distance - b.distance);

//   // Emit to nearby drivers
//   nearbyDrivers.forEach(({ driverId, distance }) => {
//     emitToUser('driver', driverId, event, { ...data, distance });
//   });

//   console.log(`Broadcast to ${nearbyDrivers.length} nearby drivers`, { event, location, radius });
  
//   return nearbyDrivers;
// }

// // Haversine formula for distance calculation
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Earth's radius in km
//   const dLat = (lat2 - lat1) * Math.PI / 180;
//   const dLon = (lon2 - lon1) * Math.PI / 180;
//   const a = 
//     Math.sin(dLat/2) * Math.sin(dLat/2) +
//     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
//     Math.sin(dLon/2) * Math.sin(dLon/2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//   return R * c;
// }

// // ==================== SOCKET CONNECTION HANDLER ====================
// io.on("connection", (socket) => {
//   console.log(`New connection: ${socket.id}`);

//   // ==================== USER CONNECTION MANAGEMENT ====================

//   // Rider joins
//   socket.on('rider:join', (data) => {
//     const { riderId, metadata } = data;
//     if (!riderId) {
//       socket.emit('error', { message: 'riderId is required' });
//       return;
//     }

//     // Disconnect previous socket if exists
//     const existingSocketId = connections.riders.get(riderId);
//     if (existingSocketId && existingSocketId !== socket.id) {
//       const existingSocket = io.sockets.sockets.get(existingSocketId);
//       if (existingSocket) {
//         existingSocket.emit('rider:session-replaced', { message: 'New session started' });
//         existingSocket.disconnect(true);
//       }
//     }

//     connections.riders.set(riderId, socket.id);
//     connections.sockets.set(socket.id, { type: 'rider', id: riderId, metadata });

//     socket.join(`rider:${riderId}`);
    
//     console.log(`Rider ${riderId} joined`, { socketId: socket.id, metadata });
    
//     socket.emit('rider:connected', { riderId, socketId: socket.id });
//   });

//   // Driver joins
//   socket.on('driver:join', (data) => {
//     const { driverId, location, metadata } = data;
//     if (!driverId) {
//       socket.emit('error', { message: 'driverId is required' });
//       return;
//     }

//     // Disconnect previous socket if exists
//     const existingSocketId = connections.drivers.get(driverId);
//     if (existingSocketId && existingSocketId !== socket.id) {
//       const existingSocket = io.sockets.sockets.get(existingSocketId);
//       if (existingSocket) {
//         existingSocket.emit('driver:session-replaced', { message: 'New session started' });
//         existingSocket.disconnect(true);
//       }
//     }

//     connections.drivers.set(driverId, socket.id);
//     connections.sockets.set(socket.id, { type: 'driver', id: driverId, metadata });

//     socket.join(`driver:${driverId}`);
    
//     // Store initial location if provided
//     if (location && location.lat && location.lng) {
//       driverLocations.set(driverId, {
//         ...location,
//         timestamp: Date.now(),
//         isAvailable: metadata?.isAvailable || false
//       });
//     }
    
//     console.log(`Driver ${driverId} joined`, { socketId: socket.id, location, metadata });
    
//     socket.emit('driver:connected', { driverId, socketId: socket.id });
//   });

//   // Conductor joins
//   socket.on('conductor:join', (data) => {
//     const { conductorId, metadata } = data;
//     if (!conductorId) {
//       socket.emit('error', { message: 'conductorId is required' });
//       return;
//     }

//     const existingSocketId = connections.conductors.get(conductorId);
//     if (existingSocketId && existingSocketId !== socket.id) {
//       const existingSocket = io.sockets.sockets.get(existingSocketId);
//       if (existingSocket) {
//         existingSocket.emit('conductor:session-replaced', { message: 'New session started' });
//         existingSocket.disconnect(true);
//       }
//     }

//     connections.conductors.set(conductorId, socket.id);
//     connections.sockets.set(socket.id, { type: 'conductor', id: conductorId, metadata });

//     socket.join(`conductor:${conductorId}`);
    
//     console.log(`Conductor ${conductorId} joined`, { socketId: socket.id });
    
//     socket.emit('conductor:connected', { conductorId, socketId: socket.id });
//   });

//   // Delivery personnel joins
//   socket.on('delivery:join', (data) => {
//     const { deliveryPersonId, location, metadata } = data;
//     if (!deliveryPersonId) {
//       socket.emit('error', { message: 'deliveryPersonId is required' });
//       return;
//     }

//     const existingSocketId = connections.delivery.get(deliveryPersonId);
//     if (existingSocketId && existingSocketId !== socket.id) {
//       const existingSocket = io.sockets.sockets.get(existingSocketId);
//       if (existingSocket) {
//         existingSocket.emit('delivery:session-replaced', { message: 'New session started' });
//         existingSocket.disconnect(true);
//       }
//     }

//     connections.delivery.set(deliveryPersonId, socket.id);
//     connections.sockets.set(socket.id, { type: 'delivery', id: deliveryPersonId, metadata });

//     socket.join(`delivery:${deliveryPersonId}`);
    
//     if (location && location.lat && location.lng) {
//       driverLocations.set(deliveryPersonId, {
//         ...location,
//         timestamp: Date.now(),
//         isAvailable: metadata?.isAvailable || false
//       });
//     }
    
//     console.log(`Delivery person ${deliveryPersonId} joined`, { socketId: socket.id });
    
//     socket.emit('delivery:connected', { deliveryPersonId, socketId: socket.id });
//   });

//   // Admin joins
//   socket.on('admin:join', (data) => {
//     const { adminId, metadata } = data;
//     if (!adminId) {
//       socket.emit('error', { message: 'adminId is required' });
//       return;
//     }

//     connections.admins.set(adminId, socket.id);
//     connections.sockets.set(socket.id, { type: 'admin', id: adminId, metadata });

//     socket.join(`admin:${adminId}`);
//     socket.join('admin:all'); // All admins room
    
//     console.log(`Admin ${adminId} joined`, { socketId: socket.id });
    
//     socket.emit('admin:connected', { adminId, socketId: socket.id });
//   });

//   // ==================== RIDE REQUEST & MATCHING ====================

//   // From Strapi: New ride request created
//   socket.on('ride:request:created', (data) => {
//     const { rideId, riderId, pickupLocation, dropoffLocation, rideType, estimatedFare } = data;
    
//     console.log(`New ride request: ${rideId}`, { riderId, rideType });

//     // Track this ride
//     activeRides.set(rideId, {
//       riderId,
//       status: 'pending',
//       createdAt: Date.now()
//     });

//     // Notify rider
//     emitToUser('rider', riderId, 'ride:request:created', data);

//     // Broadcast to nearby available drivers
//     const radius = data.searchRadius || 10; // km
//     broadcastToNearbyDrivers(pickupLocation, radius, 'ride:request:new', {
//       rideId,
//       riderId,
//       pickupLocation,
//       dropoffLocation,
//       rideType,
//       estimatedFare,
//       distance: null // Will be calculated per driver
//     });
//   });

//   // From Strapi: Ride request sent to specific drivers
//   socket.on('ride:request:sent', (data) => {
//     const { rideId, driverIds, requestData } = data;
    
//     driverIds.forEach(driverId => {
//       emitToUser('driver', driverId, 'ride:request:received', {
//         rideId,
//         ...requestData
//       });
//     });

//     console.log(`Ride request sent to ${driverIds.length} drivers`, { rideId, driverIds });
//   });

//   // Driver accepts ride
//   socket.on('ride:accept', (data) => {
//     const { rideId, driverId } = data;
    
//     const ride = activeRides.get(rideId);
//     if (!ride) {
//       socket.emit('error', { message: 'Ride not found' });
//       return;
//     }

//     // Update ride tracking
//     ride.driverId = driverId;
//     ride.status = 'accepted';
//     ride.acceptedAt = Date.now();
//     activeRides.set(rideId, ride);

//     // Join ride room
//     socket.join(`ride:${rideId}`);

//     // Notify rider
//     emitToUser('rider', ride.riderId, 'ride:accepted', { rideId, driverId });

//     // Notify other drivers that ride was taken
//     emitToRoom(`ride:${rideId}:pending`, 'ride:taken', { rideId });

//     console.log(`Ride ${rideId} accepted by driver ${driverId}`);
    
//     socket.emit('ride:accept:success', { rideId });
//   });

//   // Driver declines ride
//   socket.on('ride:decline', (data) => {
//     const { rideId, driverId, reason } = data;
    
//     console.log(`Driver ${driverId} declined ride ${rideId}`, { reason });
    
//     socket.emit('ride:decline:success', { rideId });
    
//     // This event should trigger Strapi to send request to next driver
//   });

//   // From Strapi: Driver arrived at pickup
//   socket.on('ride:driver:arrived', (data) => {
//     const { rideId, driverId } = data;
    
//     const ride = activeRides.get(rideId);
//     if (ride) {
//       ride.status = 'arrived';
//       ride.arrivedAt = Date.now();
//       activeRides.set(rideId, ride);

//       emitToUser('rider', ride.riderId, 'ride:driver:arrived', { rideId, driverId });
//     }

//     console.log(`Driver ${driverId} arrived for ride ${rideId}`);
//   });

//   // From Strapi: Trip started
//   socket.on('ride:trip:started', (data) => {
//     const { rideId, driverId } = data;
    
//     const ride = activeRides.get(rideId);
//     if (ride) {
//       ride.status = 'in_progress';
//       ride.startedAt = Date.now();
//       activeRides.set(rideId, ride);

//       emitToUser('rider', ride.riderId, 'ride:trip:started', { rideId });
//       emitToUser('driver', driverId, 'ride:trip:started', { rideId });
//     }

//     console.log(`Trip started for ride ${rideId}`);
//   });

//   // From Strapi: Trip completed
//   socket.on('ride:trip:completed', (data) => {
//     const { rideId, driverId, finalFare, distance, duration } = data;
    
//     const ride = activeRides.get(rideId);
//     if (ride) {
//       ride.status = 'completed';
//       ride.completedAt = Date.now();

//       emitToUser('rider', ride.riderId, 'ride:trip:completed', {
//         rideId,
//         finalFare,
//         distance,
//         duration
//       });
//       emitToUser('driver', driverId, 'ride:trip:completed', {
//         rideId,
//         finalFare,
//         distance,
//         duration
//       });

//       // Clean up after a delay
//       setTimeout(() => {
//         activeRides.delete(rideId);
//       }, 300000); // 5 minutes
//     }

//     console.log(`Trip completed for ride ${rideId}`, { finalFare, distance, duration });
//   });

//   // From Strapi: Ride cancelled
//   socket.on('ride:cancelled', (data) => {
//     const { rideId, cancelledBy, reason, cancellationFee } = data;
    
//     const ride = activeRides.get(rideId);
//     if (ride) {
//       ride.status = 'cancelled';
//       ride.cancelledAt = Date.now();

//       emitToRoom(`ride:${rideId}`, 'ride:cancelled', {
//         rideId,
//         cancelledBy,
//         reason,
//         cancellationFee
//       });

//       // Clean up
//       setTimeout(() => {
//         activeRides.delete(rideId);
//       }, 60000); // 1 minute
//     }

//     console.log(`Ride ${rideId} cancelled by ${cancelledBy}`, { reason });
//   });

//   // ==================== LIVE LOCATION TRACKING ====================

//   // Driver location update
//   socket.on('driver:location:update', (data) => {
//     const { driverId, location, heading, speed } = data;
    
//     // Update location cache
//     const existingLoc = driverLocations.get(driverId) || {};
//     driverLocations.set(driverId, {
//       ...existingLoc,
//       lat: location.lat,
//       lng: location.lng,
//       heading,
//       speed,
//       timestamp: Date.now()
//     });

//     // If driver is on an active ride, broadcast to rider
//     activeRides.forEach((ride, rideId) => {
//       if (ride.driverId === driverId && ride.status !== 'completed' && ride.status !== 'cancelled') {
//         emitToUser('rider', ride.riderId, 'driver:location:updated', {
//           rideId,
//           driverId,
//           location,
//           heading,
//           speed
//         })
//       }
//     })
//   })

//   // Rider location update
//   socket.on('rider:location:update', (data) => {
//     const { riderId, location } = data;
    
//     // If rider is on an active ride, broadcast to driver
//     activeRides.forEach((ride, rideId) => {
//       if (ride.riderId === riderId && ride.driverId && ride.status !== 'completed' && ride.status !== 'cancelled') {
//         emitToUser('driver', ride.driverId, 'rider:location:updated', {
//           rideId,
//           riderId,
//           location
//         });
//       }
//     });
//   });

//   // ==================== DRIVER AVAILABILITY ====================

//   // Driver goes online
//   socket.on('driver:online', (data) => {
//     const { driverId, location } = data;
    
//     const driverLoc = driverLocations.get(driverId) || {};
//     driverLocations.set(driverId, {
//       ...driverLoc,
//       lat: location?.lat || driverLoc.lat,
//       lng: location?.lng || driverLoc.lng,
//       isAvailable: true,
//       timestamp: Date.now()
//     });

//     console.log(`Driver ${driverId} is now online`);
    
//     socket.emit('driver:online:success', { driverId });
//   });

//   // Driver goes offline
//   socket.on('driver:offline', (data) => {
//     const { driverId } = data;
    
//     const driverLoc = driverLocations.get(driverId);
//     if (driverLoc) {
//       driverLoc.isAvailable = false;
//       driverLocations.set(driverId, driverLoc);
//     }

//     console.log(`Driver ${driverId} is now offline`);
    
//     socket.emit('driver:offline:success', { driverId });
//   });

//   // From Strapi: Driver forced offline (subscription expired, etc.)
//   socket.on('driver:forced:offline', (data) => {
//     const { driverId, reason, message } = data;
    
//     const driverLoc = driverLocations.get(driverId);
//     if (driverLoc) {
//       driverLoc.isAvailable = false;
//       driverLocations.set(driverId, driverLoc);
//     }

//     emitToUser('driver', driverId, 'driver:forced:offline', { reason, message });
    
//     logger.warn(`Driver ${driverId} forced offline`, { reason });
//   });

//   // ==================== SUBSCRIPTION UPDATES ====================

//   // From Strapi: Subscription expiring soon
//   socket.on('subscription:expiring:warning', (data) => {
//     const { driverId, daysRemaining, expiresAt, planName } = data;
    
//     emitToUser('driver', driverId, 'subscription:expiring:warning', {
//       daysRemaining,
//       expiresAt,
//       planName
//     });
//   });

//   // From Strapi: Subscription expired
//   socket.on('subscription:expired', (data) => {
//     const { driverId, expiredAt, message } = data;
    
//     emitToUser('driver', driverId, 'subscription:expired', {
//       expiredAt,
//       message
//     });
//   });

//   // From Strapi: Subscription activated/renewed
//   socket.on('subscription:activated', (data) => {
//     const { driverId, planName, expiresAt } = data;
    
//     emitToUser('driver', driverId, 'subscription:activated', {
//       planName,
//       expiresAt
//     });
//   });

//   // ==================== PAYMENT NOTIFICATIONS ====================

//   // From Strapi: Payment successful
//   socket.on('payment:success', (data) => {
//     const { userId, userType, amount, transactionId, type } = data;
    
//     emitToUser(userType, userId, 'payment:success', {
//       amount,
//       transactionId,
//       type
//     });
//   });

//   // From Strapi: Payment failed
//   socket.on('payment:failed', (data) => {
//     const { userId, userType, amount, reason, transactionId } = data;
    
//     emitToUser(userType, userId, 'payment:failed', {
//       amount,
//       reason,
//       transactionId
//     });
//   });

//   // From Strapi: Withdrawal processed
//   socket.on('withdrawal:processed', (data) => {
//     const { driverId, amount, method, transactionId } = data;
    
//     emitToUser('driver', driverId, 'withdrawal:processed', {
//       amount,
//       method,
//       transactionId
//     });
//   });

//   // ==================== RATING REQUESTS ====================

//   // From Strapi: Request rating from rider
//   socket.on('rating:request:rider', (data) => {
//     const { riderId, rideId, driverId } = data;
    
//     emitToUser('rider', riderId, 'rating:request', {
//       rideId,
//       driverId,
//       ratingType: 'driver'
//     });
//   });

//   // From Strapi: Request rating from driver
//   socket.on('rating:request:driver', (data) => {
//     const { driverId, rideId, riderId } = data;
    
//     emitToUser('driver', driverId, 'rating:request', {
//       rideId,
//       riderId,
//       ratingType: 'rider'
//     });
//   });

//   // From Strapi: Rating submitted confirmation
//   socket.on('rating:submitted', (data) => {
//     const { userId, userType, rideId, rating } = data;
    
//     emitToUser(userType, userId, 'rating:submitted', {
//       rideId,
//       rating
//     });
//   });

//   // ==================== NOTIFICATIONS ====================

//   // From Strapi: Generic notification
//   socket.on('notification:send', (data) => {
//     const { userId, userType, notification } = data;
    
//     emitToUser(userType, userId, 'notification:new', notification);
//   });

//   // From Strapi: Broadcast to all users of a type
//   socket.on('notification:broadcast', (data) => {
//     const { userType, notification } = data;
    
//     if (userType === 'all') {
//       io.emit('notification:broadcast', notification);
//     } else {
//       connections[`${userType}s`]?.forEach((socketId, userId) => {
//         emitToUser(userType, userId, 'notification:broadcast', notification);
//       });
//     }
    
//     console.log(`Broadcast notification to ${userType}`, { notification });
//   });

//   // ==================== SOS & EMERGENCY ====================

//   // SOS alert triggered
//   socket.on('sos:trigger', (data) => {
//     const { userId, userType, location, rideId, type } = data;
    
//     // Notify all admins immediately
//     emitToRoom('admin:all', 'sos:alert', {
//       userId,
//       userType,
//       location,
//       rideId,
//       type,
//       timestamp: Date.now()
//     });

//     // Notify emergency contacts (handled by Strapi)
    
//     logger.error(`SOS ALERT from ${userType} ${userId}`, { location, rideId, type });
    
//     socket.emit('sos:triggered', { alertId: `SOS-${Date.now()}` });
//   });

//   // From Strapi: SOS alert acknowledged
//   socket.on('sos:acknowledged', (data) => {
//     const { alertId, userId, userType, acknowledgedBy } = data;
    
//     emitToUser(userType, userId, 'sos:acknowledged', {
//       alertId,
//       acknowledgedBy
//     });
//   });

//   // ==================== BUS ROUTE TRACKING ====================

//   // Bus driver starts route
//   socket.on('bus:route:started', (data) => {
//     const { driverId, routeId, busId } = data;
    
//     socket.join(`bus:route:${routeId}`);
    
//     // Notify passengers waiting on this route
//     emitToRoom(`bus:route:${routeId}`, 'bus:route:started', {
//       driverId,
//       routeId,
//       busId
//     });
    
//     console.log(`Bus route ${routeId} started by driver ${driverId}`);
//   });

//   // Bus location update
//   socket.on('bus:location:update', (data) => {
//     const { driverId, routeId, location, nextStation, eta } = data;
    
//     // Broadcast to all passengers tracking this route
//     emitToRoom(`bus:route:${routeId}`, 'bus:location:updated', {
//       driverId,
//       location,
//       nextStation,
//       eta
//     });
//   });

//   // Passenger tracking bus route
//   socket.on('bus:route:track', (data) => {
//     const { riderId, routeId } = data;
    
//     socket.join(`bus:route:${routeId}`);
    
//     console.log(`Rider ${riderId} tracking bus route ${routeId}`);
//   });

//   // Stop tracking bus route
//   socket.on('bus:route:untrack', (data) => {
//     const { routeId } = data;
    
//     socket.leave(`bus:route:${routeId}`);
//   });

//   // ==================== AFFILIATE NOTIFICATIONS ====================

//   // From Strapi: Referral signup
//   socket.on('affiliate:referral:signup', (data) => {
//     const { affiliateId, referredUser, points } = data;
    
//     emitToUser('rider', affiliateId, 'affiliate:referral:signup', {
//       referredUser,
//       points
//     });
//   });

//   // From Strapi: Commission earned
//   socket.on('affiliate:commission:earned', (data) => {
//     const { affiliateId, amount, rideId, points } = data;
    
//     emitToUser('rider', affiliateId, 'affiliate:commission:earned', {
//       amount,
//       rideId,
//       points
//     });
//   });

//   // ==================== ADMIN OPERATIONS ====================

//   // From Strapi: System announcement
//   socket.on('admin:announcement', (data) => {
//     const { targetAudience, message, priority } = data;
    
//     if (targetAudience === 'all') {
//       io.emit('system:announcement', { message, priority });
//     } else {
//       connections[`${targetAudience}s`]?.forEach((socketId, userId) => {
//         emitToUser(targetAudience, userId, 'system:announcement', { message, priority });
//       });
//     }
    
//     console.log('System announcement sent', { targetAudience, priority });
//   });

//   // Admin monitoring - watch all rides
//   socket.on('admin:monitor:rides', () => {
//     socket.join('admin:monitor:rides');
    
//     // Send current active rides
//     const rides = Array.from(activeRides.entries()).map(([rideId, ride]) => ({
//       rideId,
//       ...ride
//     }));
    
//     socket.emit('admin:monitor:rides:data', { rides });
//   });

//   // Admin monitoring - watch all drivers
//   socket.on('admin:monitor:drivers', () => {
//     socket.join('admin:monitor:drivers');
    
//     // Send current driver locations
//     const drivers = Array.from(driverLocations.entries()).map(([driverId, location]) => ({
//       driverId,
//       ...location
//     }));
    
//     socket.emit('admin:monitor:drivers:data', { drivers });
//   });

//   // ==================== HEARTBEAT / PING ====================

//   socket.on('ping', () => {
//     socket.emit('pong', { timestamp: Date.now() });
//   });

//   // ==================== DISCONNECT HANDLER ====================

//   socket.on('disconnect', (reason) => {
//     console.log(`Socket disconnected: ${socket.id}`, { reason });
    
//     const entityInfo = connections.sockets.get(socket.id);
//     if (entityInfo) {
//       const { type, id } = entityInfo;
      
//       // Clean up connection tracking
//       connections[`${type}s`]?.delete(id);
//       connections.sockets.delete(socket.id);
      
//       // Clean up driver location if driver disconnects
//       if (type === 'driver' || type === 'delivery') {
//         const loc = driverLocations.get(id);
//         if (loc) {
//           loc.isAvailable = false;
//           driverLocations.set(id, loc);
//         }
//       }
      
//       console.log(`Cleaned up ${type} ${id}`);
//     }
//   });

//   // ==================== ERROR HANDLING ====================

//   socket.on('error', (error) => {
//     logger.error(`Socket error: ${socket.id}`, { error: error.message });
//   });
// });

// // ==================== HTTP HEALTH CHECK ====================
// httpServer.on('request', (req, res) => {
//   if (req.url === '/health') {
//     res.writeHead(200, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify({
//       status: 'ok',
//       environment,
//       connections: {
//         riders: connections.riders.size,
//         drivers: connections.drivers.size,
//         conductors: connections.conductors.size,
//         delivery: connections.delivery.size,
//         admins: connections.admins.size,
//         total: connections.sockets.size
//       },
//       activeRides: activeRides.size,
//       availableDrivers: Array.from(driverLocations.values()).filter(loc => loc.isAvailable).length,
//       timestamp: new Date().toISOString()
//     }));
//   } else if (req.url === '/stats') {
//     res.writeHead(200, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify({
//       connections: {
//         riders: connections.riders.size,
//         drivers: connections.drivers.size,
//         conductors: connections.conductors.size,
//         delivery: connections.delivery.size,
//         admins: connections.admins.size,
//         total: connections.sockets.size
//       },
//       rides: {
//         active: activeRides.size,
//         pending: Array.from(activeRides.values()).filter(r => r.status === 'pending').length,
//         inProgress: Array.from(activeRides.values()).filter(r => r.status === 'in_progress').length,
//       },
//       drivers: {
//         total: driverLocations.size,
//         available: Array.from(driverLocations.values()).filter(loc => loc.isAvailable).length,
//         offline: Array.from(driverLocations.values()).filter(loc => !loc.isAvailable).length,
//       },
//       timestamp: new Date().toISOString()
//     }));
//   } else {
//     res.writeHead(404);
//     res.end('Not Found');
//   }
// });

// // ==================== PERIODIC CLEANUP ====================
// setInterval(() => {
//   const now = Date.now();
//   const staleThreshold = 5 * 60 * 1000; // 5 minutes

//   // Clean up stale driver locations
//   driverLocations.forEach((location, driverId) => {
//     if (now - location.timestamp > staleThreshold) {
//       logger.warn(`Removing stale location for driver ${driverId}`);
//       driverLocations.delete(driverId);
//     }
//   });

//   // Clean up old completed/cancelled rides
//   activeRides.forEach((ride, rideId) => {
//     if ((ride.status === 'completed' || ride.status === 'cancelled') && 
//         now - (ride.completedAt || ride.cancelledAt || ride.createdAt) > staleThreshold) {
//       console.log(`Cleaning up old ride ${rideId}`);
//       activeRides.delete(rideId);
//     }
//   });
// }, 60000); // Run every minute

// // ==================== SERVER START ====================
// const PORT = process.env.PORT || 3005;

// httpServer.listen(PORT, () => {
//   console.log(`🚀 OkraRides Socket Server started`);
//   console.log(`📡 Listening on port ${PORT}`);
//   console.log(`🌍 Environment: ${environment}`);
//   console.log(`🔐 Allowed origins: ${allowedOrigins.join(', ')}`);
// });

// // ==================== GRACEFUL SHUTDOWN ====================
// process.on('SIGTERM', () => {
//   console.log('SIGTERM received, closing server gracefully...');
//   httpServer.close(() => {
//     console.log('Server closed');
//     process.exit(0);
//   });
// });

// process.on('SIGINT', () => {
//   console.log('SIGINT received, closing server gracefully...');
//   httpServer.close(() => {
//     console.log('Server closed');
//     process.exit(0);
//   });
// });

// process.on('uncaughtException', (error) => {
//   logger.error('Uncaught Exception:', error);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });
// sockets/src/index.js (FIXED - Complete)
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');
const winston = require("winston");
// Check log file sizes and rotate if needed
const LOG_FILE_MAX_SIZE = 100 * 1024 * 1024; // 100MB

// ==================== ENVIRONMENT CONFIGURATION ====================
let clientUrls, environment;

environment = process.env.NODE_ENV || 'local';
// environment = 'local';
// environment = 'test';
// environment = 'production';

if (environment === 'local' || environment === 'development') {
  clientUrls = [
    'http://localhost:3000',  // Main frontend
    'http://localhost:3001',  // Rider app
    'http://localhost:3002',  // Driver app
    'http://localhost:3003',  // Conductor app
    'http://localhost:3004',  // Delivery app
    'http://localhost:3005',  // Admin panel
    'http://localhost:1343',  // Strapi backend
    'http://localhost:3008',  // Device socket server
  ];
} else if (environment === 'test') {
  clientUrls = [
    'https://test.okrarides.com',
    'https://book.test.okrarides.com',
    'https://driver.test.okrarides.com',
    'https://conductor.test.okrarides.com',
    'https://delivery.test.okrarides.com',
    'https://admin.test.okrarides.com',
  ];
} else if (environment === 'production') {
  clientUrls = [
    'https://okrarides.com',
    'https://book.okrarides.com',
    'https://driver.okrarides.com',
    'https://conductor.okrarides.com',
    'https://delivery.okrarides.com',
    'https://admin.okrarides.com',
  ];
} else {
  clientUrls = ['http://localhost:3000'];
}

// ==================== LOGGER SETUP ====================
const checkAndRotateLog = (filename) => {
  const filepath = path.join(__dirname, '..', 'logs', filename);
  try {
    const stats = fs.statSync(filepath);
    if (stats.size > LOG_FILE_MAX_SIZE) {
      fs.unlinkSync(filepath);
      console.error(`Rotated log file: ${filename}`);
    }
  } catch (error) {
    // File doesn't exist yet, ignore
  }
};

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: LOG_FILE_MAX_SIZE,
      maxFiles: 1
    })
  ]
});
// Check log files on startup
checkAndRotateLog('error.log');
checkAndRotateLog('combined.log');

// ==================== HTTP & SOCKET.IO SERVER SETUP ====================
const httpServer = createServer();
const allowedOrigins = clientUrls;

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// ==================== CONNECTION TRACKING ====================
const connections = {
  riders: new Map(),      // riderId -> socket.id
  drivers: new Map(),     // driverId -> socket.id
  conductors: new Map(),  // conductorId -> socket.id
  delivery: new Map(),    // deliveryPersonId -> socket.id
  admins: new Map(),      // adminId -> socket.id
  sockets: new Map()      // socket.id -> { type, id, metadata }
};

// Active rides tracking
const activeRides = new Map(); // rideId -> { riderId, driverId, status, socketIds }

// Driver locations cache (for proximity matching)
const driverLocations = new Map(); // driverId -> { lat, lng, timestamp, isAvailable }

// ==================== HELPER FUNCTIONS ====================

function getSocketByEntity(type, entityId) {
  const map = connections[type];
  if (!map) return null;
  const socketId = map.get(entityId);
  return socketId ? io.sockets.sockets.get(socketId) : null;
}

function emitToRoom(room, event, data) {
  io.to(room).emit(event, data);
  console.log(`Emitted '${event}' to room '${room}'`, { event, room, dataKeys: Object.keys(data) });
}

// MODIFIED: Also emit to device socket server
function emitToUser(type, userId, event, data) {
  const room = `${type}:${userId}`;
  
  // Emit to web clients in the room
  io.to(room).emit(event, data);
  
  // ALSO emit to device socket server with userId info
  io.emit(event, { 
    ...data, 
    userId, 
    userType: type,
    // Ensure the specific ID field is also present
    [`${type}Id`]: userId 
  });
  
  console.log(`Emitted '${event}' to ${type} ${userId} (web + devices)`);
}

function broadcastToNearbyDrivers(location, radius, event, data) {
  const { lat, lng } = location;
  const nearbyDrivers = [];

  driverLocations.forEach((driverLoc, driverId) => {
    if (!driverLoc.isAvailable) return;
    
    const distance = calculateDistance(lat, lng, driverLoc.lat, driverLoc.lng);
    if (distance <= radius) {
      nearbyDrivers.push({ driverId, distance });
    }
  });

  // Sort by distance
  nearbyDrivers.sort((a, b) => a.distance - b.distance);

  // Emit to nearby drivers
  nearbyDrivers.forEach(({ driverId, distance }) => {
    emitToUser('driver', driverId, event, { ...data, distance });
  });

  console.log(`Broadcast to ${nearbyDrivers.length} nearby drivers`, { event, location, radius });
  
  return nearbyDrivers;
}

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ==================== SOCKET CONNECTION HANDLER ====================
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // ==================== USER CONNECTION MANAGEMENT ====================

  // Rider joins
  socket.on('rider:join', (data) => {
    const { riderId, metadata } = data;
    if (!riderId) {
      socket.emit('error', { message: 'riderId is required' });
      return;
    }

    // Disconnect previous socket if exists
    const existingSocketId = connections.riders.get(riderId);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit('rider:session-replaced', { message: 'New session started', riderId });
        existingSocket.disconnect(true);
      }
    }

    connections.riders.set(riderId, socket.id);
    connections.sockets.set(socket.id, { type: 'rider', id: riderId, metadata });

    socket.join(`rider:${riderId}`);
    
    console.log(`Rider ${riderId} joined`, { socketId: socket.id, metadata });
    
    socket.emit('rider:connected', { riderId, socketId: socket.id });
  });

  // Driver joins
  socket.on('driver:join', (data) => {
    const { driverId, location, metadata } = data;
    if (!driverId) {
      socket.emit('error', { message: 'driverId is required' });
      return;
    }

    // Disconnect previous socket if exists
    const existingSocketId = connections.drivers.get(driverId);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit('driver:session-replaced', { message: 'New session started', driverId });
        existingSocket.disconnect(true);
      }
    }

    connections.drivers.set(driverId, socket.id);
    connections.sockets.set(socket.id, { type: 'driver', id: driverId, metadata });

    socket.join(`driver:${driverId}`);
    
    // Store initial location if provided
    if (location && location.lat && location.lng) {
      driverLocations.set(driverId, {
        ...location,
        timestamp: Date.now(),
        isAvailable: metadata?.isAvailable || false
      });
    }
    
    console.log(`Driver ${driverId} joined`, { socketId: socket.id, location, metadata });
    
    socket.emit('driver:connected', { driverId, socketId: socket.id });
  });

  // Conductor joins
  socket.on('conductor:join', (data) => {
    const { conductorId, metadata } = data;
    if (!conductorId) {
      socket.emit('error', { message: 'conductorId is required' });
      return;
    }

    const existingSocketId = connections.conductors.get(conductorId);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit('conductor:session-replaced', { message: 'New session started', conductorId });
        existingSocket.disconnect(true);
      }
    }

    connections.conductors.set(conductorId, socket.id);
    connections.sockets.set(socket.id, { type: 'conductor', id: conductorId, metadata });

    socket.join(`conductor:${conductorId}`);
    
    console.log(`Conductor ${conductorId} joined`, { socketId: socket.id });
    
    socket.emit('conductor:connected', { conductorId, socketId: socket.id });
  });

  // Delivery personnel joins
  socket.on('delivery:join', (data) => {
    const { deliveryPersonId, location, metadata } = data;
    if (!deliveryPersonId) {
      socket.emit('error', { message: 'deliveryPersonId is required' });
      return;
    }

    const existingSocketId = connections.delivery.get(deliveryPersonId);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit('delivery:session-replaced', { message: 'New session started', deliveryPersonId });
        existingSocket.disconnect(true);
      }
    }

    connections.delivery.set(deliveryPersonId, socket.id);
    connections.sockets.set(socket.id, { type: 'delivery', id: deliveryPersonId, metadata });

    socket.join(`delivery:${deliveryPersonId}`);
    
    if (location && location.lat && location.lng) {
      driverLocations.set(deliveryPersonId, {
        ...location,
        timestamp: Date.now(),
        isAvailable: metadata?.isAvailable || false
      });
    }
    
    console.log(`Delivery person ${deliveryPersonId} joined`, { socketId: socket.id });
    
    socket.emit('delivery:connected', { deliveryPersonId, socketId: socket.id });
  });

  // Admin joins
  socket.on('admin:join', (data) => {
    const { adminId, metadata } = data;
    if (!adminId) {
      socket.emit('error', { message: 'adminId is required' });
      return;
    }

    connections.admins.set(adminId, socket.id);
    connections.sockets.set(socket.id, { type: 'admin', id: adminId, metadata });

    socket.join(`admin:${adminId}`);
    socket.join('admin:all'); // All admins room
    
    console.log(`Admin ${adminId} joined`, { socketId: socket.id });
    
    socket.emit('admin:connected', { adminId, socketId: socket.id });
  });

  // ==================== RIDE REQUEST & MATCHING ====================

  // From Strapi: New ride request created
  socket.on('ride:request:created', (data) => {
    const { rideId, riderId, pickupLocation, dropoffLocation, rideType, estimatedFare } = data;
    
    console.log(`New ride request: ${rideId}`, { riderId, rideType });

    // Track this ride
    activeRides.set(rideId, {
      riderId,
      status: 'pending',
      createdAt: Date.now()
    });

    // Notify rider
    emitToUser('rider', riderId, 'ride:request:created', data);

    // Broadcast to nearby available drivers
    const radius = data.searchRadius || 10; // km
    broadcastToNearbyDrivers(pickupLocation, radius, 'ride:request:new', {
      rideId,
      riderId,
      pickupLocation,
      dropoffLocation,
      rideType,
      estimatedFare,
      distance: null // Will be calculated per driver
    });
  });

  // From Strapi: Ride request sent to specific drivers
  socket.on('ride:request:sent', (data) => {
    const { rideId, driverIds, requestData } = data;
    
    driverIds.forEach(driverId => {
      emitToUser('driver', driverId, 'ride:request:received', {
        rideId,
        ...requestData
      });
    });

    console.log(`Ride request sent to ${driverIds.length} drivers`, { rideId, driverIds });
  });

  // Driver accepts ride
  socket.on('ride:accept', (data) => {
    const { rideId, driverId } = data;
    
    const ride = activeRides.get(rideId);
    if (!ride) {
      socket.emit('error', { message: 'Ride not found' });
      return;
    }

    // Update ride tracking
    ride.driverId = driverId;
    ride.status = 'accepted';
    ride.acceptedAt = Date.now();
    activeRides.set(rideId, ride);

    // Join ride room
    socket.join(`ride:${rideId}`);

    // Notify rider
    emitToUser('rider', ride.riderId, 'ride:accepted', { rideId, driverId });

    // Notify other drivers that ride was taken
    emitToRoom(`ride:${rideId}:pending`, 'ride:taken', { rideId, driverId });

    console.log(`Ride ${rideId} accepted by driver ${driverId}`);
    
    socket.emit('ride:accept:success', { rideId, driverId });
  });

  // Driver declines ride
  socket.on('ride:decline', (data) => {
    const { rideId, driverId, reason } = data;
    
    console.log(`Driver ${driverId} declined ride ${rideId}`, { reason });
    
    socket.emit('ride:decline:success', { rideId, driverId });
    
    // This event should trigger Strapi to send request to next driver
  });

  // From Strapi: Driver arrived at pickup
  socket.on('ride:driver:arrived', (data) => {
    const { rideId, driverId } = data;
    
    const ride = activeRides.get(rideId);
    if (ride) {
      ride.status = 'arrived';
      ride.arrivedAt = Date.now();
      activeRides.set(rideId, ride);

      emitToUser('rider', ride.riderId, 'ride:driver:arrived', { rideId, driverId });
      emitToUser('driver', driverId, 'ride:driver:arrived', { rideId, riderId: ride.riderId });
    }

    console.log(`Driver ${driverId} arrived for ride ${rideId}`);
  });

  // From Strapi: Trip started
  socket.on('ride:trip:started', (data) => {
    const { rideId, driverId } = data;
    
    const ride = activeRides.get(rideId);
    if (ride) {
      ride.status = 'in_progress';
      ride.startedAt = Date.now();
      activeRides.set(rideId, ride);

      emitToUser('rider', ride.riderId, 'ride:trip:started', { rideId, driverId });
      emitToUser('driver', driverId, 'ride:trip:started', { rideId, riderId: ride.riderId });
    }

    console.log(`Trip started for ride ${rideId}`);
  });

  // From Strapi: Trip completed
  socket.on('ride:trip:completed', (data) => {
    const { rideId, driverId, finalFare, distance, duration } = data;
    
    const ride = activeRides.get(rideId);
    if (ride) {
      ride.status = 'completed';
      ride.completedAt = Date.now();

      emitToUser('rider', ride.riderId, 'ride:trip:completed', {
        rideId,
        driverId,
        finalFare,
        distance,
        duration
      });
      emitToUser('driver', driverId, 'ride:trip:completed', {
        rideId,
        riderId: ride.riderId,
        finalFare,
        distance,
        duration
      });

      // Clean up after a delay
      setTimeout(() => {
        activeRides.delete(rideId);
      }, 300000); // 5 minutes
    }

    console.log(`Trip completed for ride ${rideId}`, { finalFare, distance, duration });
  });

  // From Strapi: Ride cancelled
  socket.on('ride:cancelled', (data) => {
    const { rideId, cancelledBy, reason, cancellationFee } = data;
    
    const ride = activeRides.get(rideId);
    if (ride) {
      ride.status = 'cancelled';
      ride.cancelledAt = Date.now();

      // Emit to both rider and driver
      if (ride.riderId) {
        emitToUser('rider', ride.riderId, 'ride:cancelled', {
          rideId,
          cancelledBy,
          reason,
          cancellationFee
        });
      }
      if (ride.driverId) {
        emitToUser('driver', ride.driverId, 'ride:cancelled', {
          rideId,
          cancelledBy,
          reason,
          cancellationFee
        });
      }

      // Clean up
      setTimeout(() => {
        activeRides.delete(rideId);
      }, 60000); // 1 minute
    }

    console.log(`Ride ${rideId} cancelled by ${cancelledBy}`, { reason });
  });

  // ==================== LIVE LOCATION TRACKING ====================

  // Driver location update
  socket.on('driver:location:update', (data) => {
    const { driverId, location, heading, speed } = data;
    
    // Update location cache
    const existingLoc = driverLocations.get(driverId) || {};
    driverLocations.set(driverId, {
      ...existingLoc,
      lat: location.lat,
      lng: location.lng,
      heading,
      speed,
      timestamp: Date.now()
    });

    // If driver is on an active ride, broadcast to rider
    activeRides.forEach((ride, rideId) => {
      if (ride.driverId === driverId && ride.status !== 'completed' && ride.status !== 'cancelled') {
        emitToUser('rider', ride.riderId, 'driver:location:updated', {
          rideId,
          driverId,
          location,
          heading,
          speed
        })
      }
    })
  })

  // Rider location update
  socket.on('rider:location:update', (data) => {
    const { riderId, location } = data;
    
    // If rider is on an active ride, broadcast to driver
    activeRides.forEach((ride, rideId) => {
      if (ride.riderId === riderId && ride.driverId && ride.status !== 'completed' && ride.status !== 'cancelled') {
        emitToUser('driver', ride.driverId, 'rider:location:updated', {
          rideId,
          riderId,
          location
        });
      }
    });
  });

  // ==================== DRIVER AVAILABILITY ====================

  // Driver goes online
  socket.on('driver:online', (data) => {
    const { driverId, location } = data;
    
    const driverLoc = driverLocations.get(driverId) || {};
    driverLocations.set(driverId, {
      ...driverLoc,
      lat: location?.lat || driverLoc.lat,
      lng: location?.lng || driverLoc.lng,
      isAvailable: true,
      timestamp: Date.now()
    });

    console.log(`Driver ${driverId} is now online`);
    
    socket.emit('driver:online:success', { driverId });
  });

  // Driver goes offline
  socket.on('driver:offline', (data) => {
    const { driverId } = data;
    
    const driverLoc = driverLocations.get(driverId);
    if (driverLoc) {
      driverLoc.isAvailable = false;
      driverLocations.set(driverId, driverLoc);
    }

    console.log(`Driver ${driverId} is now offline`);
    
    socket.emit('driver:offline:success', { driverId });
  });

  // From Strapi: Driver forced offline (subscription expired, etc.)
  socket.on('driver:forced:offline', (data) => {
    const { driverId, reason, message } = data;
    
    const driverLoc = driverLocations.get(driverId);
    if (driverLoc) {
      driverLoc.isAvailable = false;
      driverLocations.set(driverId, driverLoc);
    }

    emitToUser('driver', driverId, 'driver:forced:offline', { reason, message });
    
    logger.warn(`Driver ${driverId} forced offline`, { reason });
  });

  // ==================== SUBSCRIPTION UPDATES ====================

  // From Strapi: Subscription expiring soon
  socket.on('subscription:expiring:warning', (data) => {
    const { driverId, daysRemaining, expiresAt, planName } = data;
    
    emitToUser('driver', driverId, 'subscription:expiring:warning', {
      daysRemaining,
      expiresAt,
      planName
    });
  });

  // From Strapi: Subscription expired
  socket.on('subscription:expired', (data) => {
    const { driverId, expiredAt, message } = data;
    
    emitToUser('driver', driverId, 'subscription:expired', {
      expiredAt,
      message
    });
  });

  // From Strapi: Subscription activated/renewed
  socket.on('subscription:activated', (data) => {
    const { driverId, planName, expiresAt } = data;
    
    emitToUser('driver', driverId, 'subscription:activated', {
      planName,
      expiresAt
    });
  });

  // ==================== PAYMENT NOTIFICATIONS ====================

  // From Strapi: Payment successful
  socket.on('payment:success', (data) => {
    const { userId, userType, amount, transactionId, type } = data;
    
    emitToUser(userType, userId, 'payment:success', {
      amount,
      transactionId,
      type
    });
  });

  // From Strapi: Payment failed
  socket.on('payment:failed', (data) => {
    const { userId, userType, amount, reason, transactionId } = data;
    
    emitToUser(userType, userId, 'payment:failed', {
      amount,
      reason,
      transactionId
    });
  });

  // From Strapi: Withdrawal processed
  socket.on('withdrawal:processed', (data) => {
    const { driverId, amount, method, transactionId } = data;
    
    emitToUser('driver', driverId, 'withdrawal:processed', {
      amount,
      method,
      transactionId
    });
  });

  // ==================== RATING REQUESTS ====================

  // From Strapi: Request rating from rider
  socket.on('rating:request:rider', (data) => {
    const { riderId, rideId, driverId } = data;
    
    emitToUser('rider', riderId, 'rating:request', {
      rideId,
      driverId,
      ratingType: 'driver'
    });
  });

  // From Strapi: Request rating from driver
  socket.on('rating:request:driver', (data) => {
    const { driverId, rideId, riderId } = data;
    
    emitToUser('driver', driverId, 'rating:request', {
      rideId,
      riderId,
      ratingType: 'rider'
    });
  });

  // From Strapi: Rating submitted confirmation
  socket.on('rating:submitted', (data) => {
    const { userId, userType, rideId, rating } = data;
    
    emitToUser(userType, userId, 'rating:submitted', {
      rideId,
      rating
    });
  });

  // ==================== NOTIFICATIONS ====================

  // From Strapi: Generic notification
  socket.on('notification:send', (data) => {
    const { userId, userType, notification } = data;
    
    emitToUser(userType, userId, 'notification:new', notification);
  });

  // From Strapi: Broadcast to all users of a type
  socket.on('notification:broadcast', (data) => {
    const { userType, notification } = data;
    
    if (userType === 'all') {
      io.emit('notification:broadcast', notification);
    } else {
      connections[`${userType}s`]?.forEach((socketId, userId) => {
        emitToUser(userType, userId, 'notification:broadcast', notification);
      });
    }
    
    console.log(`Broadcast notification to ${userType}`, { notification });
  });

  // ==================== SOS & EMERGENCY ====================

  // SOS alert triggered
  socket.on('sos:trigger', (data) => {
    const { userId, userType, location, rideId, type } = data;
    
    // Notify all admins immediately
    emitToRoom('admin:all', 'sos:alert', {
      userId,
      userType,
      location,
      rideId,
      type,
      timestamp: Date.now()
    });

    // Notify emergency contacts (handled by Strapi)
    
    logger.error(`SOS ALERT from ${userType} ${userId}`, { location, rideId, type });
    
    // Send confirmation back to user
    const alertId = `SOS-${Date.now()}`;
    socket.emit('sos:triggered', { alertId, userId });
    
    // Also emit to device socket server
    io.emit('sos:triggered', { alertId, userId, userType });
  });

  // From Strapi: SOS alert acknowledged
  socket.on('sos:acknowledged', (data) => {
    const { alertId, userId, userType, acknowledgedBy } = data;
    
    emitToUser(userType, userId, 'sos:acknowledged', {
      alertId,
      acknowledgedBy
    });
  });

  // ==================== BUS ROUTE TRACKING ====================

  // Bus driver starts route
  socket.on('bus:route:started', (data) => {
    const { driverId, routeId, busId } = data;
    
    socket.join(`bus:route:${routeId}`);
    
    // Notify passengers waiting on this route
    emitToRoom(`bus:route:${routeId}`, 'bus:route:started', {
      driverId,
      routeId,
      busId
    });
    
    // Also emit to device socket server
    io.emit('bus:route:started', { driverId, routeId, busId, userType: 'driver', userId: driverId });
    
    console.log(`Bus route ${routeId} started by driver ${driverId}`);
  });

  // Bus location update
  socket.on('bus:location:update', (data) => {
    const { driverId, routeId, location, nextStation, eta } = data;
    
    // Broadcast to all passengers tracking this route
    emitToRoom(`bus:route:${routeId}`, 'bus:location:updated', {
      driverId,
      location,
      nextStation,
      eta
    });
    
    // Also emit to device socket server
    io.emit('bus:location:updated', {
      driverId,
      location,
      nextStation,
      eta,
      routeId
    });
  });

  // Passenger tracking bus route
  socket.on('bus:route:track', (data) => {
    const { riderId, routeId } = data;
    
    socket.join(`bus:route:${routeId}`);
    
    console.log(`Rider ${riderId} tracking bus route ${routeId}`);
  });

  // Stop tracking bus route
  socket.on('bus:route:untrack', (data) => {
    const { routeId } = data;
    
    socket.leave(`bus:route:${routeId}`);
  });

  // ==================== AFFILIATE NOTIFICATIONS ====================

  // From Strapi: Referral signup
  socket.on('affiliate:referral:signup', (data) => {
    const { affiliateId, referredUser, points } = data;
    
    emitToUser('rider', affiliateId, 'affiliate:referral:signup', {
      referredUser,
      points
    });
  });

  // From Strapi: Commission earned
  socket.on('affiliate:commission:earned', (data) => {
    const { affiliateId, amount, rideId, points } = data;
    
    emitToUser('rider', affiliateId, 'affiliate:commission:earned', {
      amount,
      rideId,
      points
    });
  });

  // ==================== ADMIN OPERATIONS ====================

  // From Strapi: System announcement
  socket.on('admin:announcement', (data) => {
    const { targetAudience, message, priority } = data;
    
    if (targetAudience === 'all') {
      io.emit('system:announcement', { message, priority });
    } else {
      connections[`${targetAudience}s`]?.forEach((socketId, userId) => {
        emitToUser(targetAudience, userId, 'system:announcement', { message, priority });
      });
    }
    
    console.log('System announcement sent', { targetAudience, priority });
  });

  // Admin monitoring - watch all rides
  socket.on('admin:monitor:rides', () => {
    socket.join('admin:monitor:rides');
    
    // Send current active rides
    const rides = Array.from(activeRides.entries()).map(([rideId, ride]) => ({
      rideId,
      ...ride
    }));
    
    socket.emit('admin:monitor:rides:data', { rides });
  });

  // Admin monitoring - watch all drivers
  socket.on('admin:monitor:drivers', () => {
    socket.join('admin:monitor:drivers');
    
    // Send current driver locations
    const drivers = Array.from(driverLocations.entries()).map(([driverId, location]) => ({
      driverId,
      ...location
    }));
    
    socket.emit('admin:monitor:drivers:data', { drivers });
  });

  // ==================== HEARTBEAT / PING ====================

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // ==================== DISCONNECT HANDLER ====================

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id}`, { reason });
    
    const entityInfo = connections.sockets.get(socket.id);
    if (entityInfo) {
      const { type, id } = entityInfo;
      
      // Clean up connection tracking
      connections[`${type}s`]?.delete(id);
      connections.sockets.delete(socket.id);
      
      // Clean up driver location if driver disconnects
      if (type === 'driver' || type === 'delivery') {
        const loc = driverLocations.get(id);
        if (loc) {
          loc.isAvailable = false;
          driverLocations.set(id, loc);
        }
      }
      
      console.log(`Cleaned up ${type} ${id}`);
    }
  });

  // ==================== ERROR HANDLING ====================

  socket.on('error', (error) => {
    logger.error(`Socket error: ${socket.id}`, { error: error.message });
  });
});

// ==================== HTTP HEALTH CHECK ====================
httpServer.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      environment,
      connections: {
        riders: connections.riders.size,
        drivers: connections.drivers.size,
        conductors: connections.conductors.size,
        delivery: connections.delivery.size,
        admins: connections.admins.size,
        total: connections.sockets.size
      },
      activeRides: activeRides.size,
      availableDrivers: Array.from(driverLocations.values()).filter(loc => loc.isAvailable).length,
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connections: {
        riders: connections.riders.size,
        drivers: connections.drivers.size,
        conductors: connections.conductors.size,
        delivery: connections.delivery.size,
        admins: connections.admins.size,
        total: connections.sockets.size
      },
      rides: {
        active: activeRides.size,
        pending: Array.from(activeRides.values()).filter(r => r.status === 'pending').length,
        inProgress: Array.from(activeRides.values()).filter(r => r.status === 'in_progress').length,
      },
      drivers: {
        total: driverLocations.size,
        available: Array.from(driverLocations.values()).filter(loc => loc.isAvailable).length,
        offline: Array.from(driverLocations.values()).filter(loc => !loc.isAvailable).length,
      },
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// ==================== PERIODIC CLEANUP ====================
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes

  // Clean up stale driver locations
  driverLocations.forEach((location, driverId) => {
    if (now - location.timestamp > staleThreshold) {
      logger.warn(`Removing stale location for driver ${driverId}`);
      driverLocations.delete(driverId);
    }
  });

  // Clean up old completed/cancelled rides
  activeRides.forEach((ride, rideId) => {
    if ((ride.status === 'completed' || ride.status === 'cancelled') && 
        now - (ride.completedAt || ride.cancelledAt || ride.createdAt) > staleThreshold) {
      console.log(`Cleaning up old ride ${rideId}`);
      activeRides.delete(rideId);
    }
  });
}, 60000); // Run every minute

// ==================== SERVER START ====================
const PORT = process.env.PORT || 3005;

httpServer.listen(PORT, () => {
  console.log(`🚀 OkraRides Socket Server started`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🔐 Allowed origins: ${allowedOrigins.join(', ')}`);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});