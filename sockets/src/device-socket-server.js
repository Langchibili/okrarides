// // device-socket-server/src/index.js
// // ==================== DEVICE SOCKET SERVER ====================
// // This server allows ALL origins for native device connections
// // and routes messages to the main socket server

// const { createServer } = require("http");
// const { Server } = require("socket.io");
// const fs = require('fs');
// const path = require('path');
// const axios = require("axios");
// const winston = require("winston");

// // ==================== ENVIRONMENT CONFIGURATION ====================
// const environment = process.env.NODE_ENV || 'local';
// const MAIN_SOCKET_URL = process.env.MAIN_SOCKET_URL || 'http://localhost:3005';
// const PORT = process.env.DEVICESPORT || 3008;
// const LOG_FILE_MAX_SIZE = 100 * 1024 * 1024; // 100MB

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
// //     new winston.transports.File({ filename: 'logs/device-error.log', level: 'error' }),
// //     new winston.transports.File({ filename: 'logs/device-combined.log' })
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
//     // File doesn't exist yet
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
//       filename: 'logs/device-error.log',
//       level: 'error',
//       maxsize: LOG_FILE_MAX_SIZE,
//       maxFiles: 1
//     })
//   ]
// });

// checkAndRotateLog('device-error.log');
// checkAndRotateLog('device-combined.log');


// // ==================== HTTP & SOCKET.IO SERVER SETUP ====================
// const httpServer = createServer();

// // ALLOW ALL ORIGINS - Critical for native devices
// const io = new Server(httpServer, {
//   cors: {
//     origin: "*", // Allow all origins
//     methods: ["GET", "POST"],
//     credentials: true
//   },
//   pingTimeout: 60000,
//   pingInterval: 25000,
//   transports: ['websocket', 'polling']
// });

// // ==================== DEVICE CONNECTION TRACKING ====================
// const deviceConnections = new Map(); // deviceId -> { socketId, userId, userType, metadata }
// const userDevices = new Map(); // userId -> Set of deviceIds

// // ==================== SOCKET.IO CLIENT TO MAIN SERVER ====================
// const { io: ioClient } = require("socket.io-client");
// let mainSocket = null;

// function connectToMainServer() {
//   mainSocket = ioClient(MAIN_SOCKET_URL, {
//     autoConnect: true,
//     reconnection: true,
//     reconnectionDelay: 1000,
//     reconnectionAttempts: 10,
//     transports: ['websocket', 'polling']
//   });

//   mainSocket.on('connect', () => {
//     console.log('✅ Device server connected to main socket server');
//   });

//   mainSocket.on('disconnect', (reason) => {
//     logger.warn('❌ Device server disconnected from main socket server:', reason);
//   });

//   mainSocket.on('connect_error', (error) => {
//     logger.error('❌ Connection error to main server:', error.message);
//   });

//   // Forward events from main server to devices
//   setupMainServerEventForwarding();
// }

// function setupMainServerEventForwarding() {
//   // Forward location request from main server to specific device
//   mainSocket.on('device:location:request', (data) => {
//     const { userId, userType } = data;
    
//     // Find all devices for this user
//     const deviceIds = userDevices.get(userId);
//     if (!deviceIds || deviceIds.size === 0) {
//       logger.warn(`No devices found for user ${userId}`);
//       return;
//     }

//     // Send to all user's devices
//     deviceIds.forEach(deviceId => {
//       const device = deviceConnections.get(deviceId);
//       if (device) {
//         const socket = io.sockets.sockets.get(device.socketId);
//         if (socket) {
//           socket.emit('getCurrentLocation', data);
//           console.log(`Location request sent to device ${deviceId} for user ${userId}`);
//         }
//       }
//     });
//   });

//   // Forward notification request
//   mainSocket.on('device:notification:send', (data) => {
//     const { userId, notification } = data;
    
//     const deviceIds = userDevices.get(userId);
//     if (!deviceIds || deviceIds.size === 0) return;

//     deviceIds.forEach(deviceId => {
//       const device = deviceConnections.get(deviceId);
//       if (device) {
//         const socket = io.sockets.sockets.get(device.socketId);
//         if (socket) {
//           socket.emit('showNotification', notification);
//         }
//       }
//     });
//   });

//   // Forward draw-over-app request
//   mainSocket.on('device:drawover:show', (data) => {
//     const { userId, overlayData } = data;
    
//     const deviceIds = userDevices.get(userId);
//     if (!deviceIds || deviceIds.size === 0) return;

//     deviceIds.forEach(deviceId => {
//       const device = deviceConnections.get(deviceId);
//       if (device) {
//         const socket = io.sockets.sockets.get(device.socketId);
//         if (socket) {
//           socket.emit('showDrawOver', overlayData);
//         }
//       }
//     });
//   });
// }

// // ==================== DEVICE SOCKET HANDLERS ====================
// io.on("connection", (socket) => {
//   console.log(`📱 New device connection: ${socket.id}`);

//   // Device registration
//   socket.on('device:register', async (data) => {
//     const { 
//       deviceId, 
//       userId,
//       userType, 
//       frontendName,
//       notificationToken,
//       deviceInfo,
//       socketServerUrl 
//     } = data;

//     if (!deviceId || !userId || !userType) {
//       socket.emit('device:register:error', { message: 'Missing required fields' });
//       return;
//     }

//     // Store device connection
//     deviceConnections.set(deviceId, {
//       socketId: socket.id,
//       userId,
//       userType,
//       frontendName,
//       notificationToken,
//       deviceInfo,
//       registeredAt: Date.now()
//     });

//     // Track user devices
//     if (!userDevices.has(userId)) {
//       userDevices.set(userId, new Set());
//     }
//     userDevices.get(userId).add(deviceId);

//     console.log(`✅ Device ${deviceId} registered for user ${userId} (${userType})`);

//     // Notify main socket server about device registration
//     if (mainSocket && mainSocket.connected) {
//       mainSocket.emit('device:registered', {
//         deviceId,
//         userId,
//         userType,
//         frontendName,
//         notificationToken,
//         deviceInfo
//       });
//     }

//     // Send device info to backend API for storage
//     try {
//       await axios.post(`${process.env.BACKEND_URL || 'http://localhost:1343'}/api/devices/register`, {
//         userId,
//         devices: [{
//           deviceId,
//           notificationToken,
//           deviceInfo,
//           frontendName,
//           registeredAt: new Date().toISOString()
//         }]
//       });
//     } catch (error) {
//       logger.error('Error saving device to backend:', error.message);
//     }

//     socket.emit('device:register:success', { deviceId, userId });

//     // Subscribe to main socket server with user credentials
//     if (mainSocket && mainSocket.connected) {
//       const joinEvent = `${userType}:join`;
//       mainSocket.emit(joinEvent, {
//         [`${userType}Id`]: userId,
//         metadata: deviceInfo
//       });
//     }
//   });

//   // Location update from device
//   socket.on('device:location:update', async(data) => {
//     const { deviceId, location, heading, speed } = data;
//     const device = deviceConnections.get(deviceId);
//     if (!device) {
//       logger.warn(`Location update from unregistered device: ${deviceId}`);
//       return;
//     }
//     try {
//       await axios.post(`${process.env.BACKEND_URL || 'http://localhost:1343'}/api/devices/updatecurrentloc`, {
//         deviceId,
//         location: {
//           latitude: location.lat,
//           longitude: location.lng,
//           accuracy: location.accuracy,
//           altitude: location.altitude,
//           altitudeAccuracy: location.altitudeAccuracy,
//           heading: location.heading,
//           speed: location.speed,
//           location: location.location
//         }
//       })
//     } catch (error) {
//       console.log(error)
//       logger.error('Error saving current location to backend:', error.message);
//     }
    

//     // Forward to main socket server
//     if (mainSocket && mainSocket.connected) {
//       if(device?.userType){
//         const locationEvent = `${device.userType}:location:update`;
//         mainSocket.emit(locationEvent, {
//           [`${device.userType}Id`]: device.userId,
//           location,
//           heading,
//           speed
//         })
//        }
//     }

//     logger.debug(`Location update from device ${deviceId}`);
//   })

//   // Notification acknowledgment
//   socket.on('device:notification:acknowledged', (data) => {
//     const { deviceId, notificationId } = data;
    
//     const device = deviceConnections.get(deviceId);
//     if (device && mainSocket && mainSocket.connected) {
//       mainSocket.emit('device:notification:acknowledged', {
//         userId: device.userId,
//         notificationId
//       });
//     }
//   });

//   // Draw-over dismissed
//   socket.on('device:drawover:dismissed', (data) => {
//     const { deviceId, overlayId } = data;
    
//     const device = deviceConnections.get(deviceId);
//     if (device && mainSocket && mainSocket.connected) {
//       mainSocket.emit('device:drawover:dismissed', {
//         userId: device.userId,
//         overlayId
//       });
//     }
//   });

//   // Permission status update
//   socket.on('device:permissions:update', async (data) => {
//     const { deviceId, permissions } = data;
    
//     const device = deviceConnections.get(deviceId);
//     if (!device) return;

//     // Update backend
//     try {
//       await axios.patch(
//         `${process.env.BACKEND_URL || 'http://localhost:1343'}/api/devices/${device.userId}/${deviceId}`,
//         { permissions }
//       );
//     } catch (error) {
//       logger.error('Error updating device permissions:', error.message);
//     }
//   });

//   // Generic message forwarding to main server
//   socket.on('forward:to:main', (data) => {
//     const { event, payload } = data;
    
//     if (mainSocket && mainSocket.connected) {
//       mainSocket.emit(event, payload);
//     }
//   });

//   // Ping/Pong for keepalive
//   socket.on('ping', () => {
//     socket.emit('pong', { timestamp: Date.now() });
//   });

//   // Disconnect handler
//   socket.on('disconnect', (reason) => {
//     console.log(`📱 Device disconnected: ${socket.id}, reason: ${reason}`);

//     // Find and remove device
//     for (const [deviceId, device] of deviceConnections.entries()) {
//       if (device.socketId === socket.id) {
//         // Remove from user devices
//         const userDeviceSet = userDevices.get(device.userId);
//         if (userDeviceSet) {
//           userDeviceSet.delete(deviceId);
//           if (userDeviceSet.size === 0) {
//             userDevices.delete(device.userId);
//           }
//         }

//         // Remove device connection
//         deviceConnections.delete(deviceId);
        
//         console.log(`Cleaned up device ${deviceId}`);
//         break;
//       }
//     }
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
//         devices: deviceConnections.size,
//         users: userDevices.size,
//         mainServerConnected: mainSocket?.connected || false
//       },
//       timestamp: new Date().toISOString()
//     }));
//   } else if (req.url === '/stats') {
//     res.writeHead(200, { 'Content-Type': 'application/json' });
    
//     const devicesByType = {};
//     deviceConnections.forEach(device => {
//       devicesByType[device.userType] = (devicesByType[device.userType] || 0) + 1;
//     });

//     res.end(JSON.stringify({
//       connections: {
//         totalDevices: deviceConnections.size,
//         uniqueUsers: userDevices.size,
//         devicesByType
//       },
//       mainServer: {
//         connected: mainSocket?.connected || false,
//         url: MAIN_SOCKET_URL
//       },
//       timestamp: new Date().toISOString()
//     }));
//   } else {
//     res.writeHead(404);
//     res.end('Not Found');
//   }
// });

// // ==================== SERVER START ====================
// connectToMainServer();

// httpServer.listen(PORT, () => {
//   console.log(`🚀 Device Socket Server started`);
//   console.log(`📡 Listening on port ${PORT}`);
//   console.log(`🌍 Environment: ${environment}`);
//   console.log(`🔓 CORS: Allow ALL origins (for native devices)`);
//   console.log(`🔗 Main Socket Server: ${MAIN_SOCKET_URL}`);
// });

// // ==================== GRACEFUL SHUTDOWN ====================
// process.on('SIGTERM', () => {
//   console.log('SIGTERM received, closing server gracefully...');
//   if (mainSocket) mainSocket.disconnect();
//   httpServer.close(() => {
//     console.log('Server closed');
//     process.exit(0);
//   });
// });

// process.on('SIGINT', () => {
//   console.log('SIGINT received, closing server gracefully...');
//   if (mainSocket) mainSocket.disconnect();
//   httpServer.close(() => {
//     console.log('Server closed');
//     process.exit(0);
//   });
// });
// device-socket-server/src/index.js (Complete)
// ==================== DEVICE SOCKET SERVER ====================
// This server allows ALL origins for native device connections
// and routes messages to the main socket server

const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');
const axios = require("axios");
const winston = require("winston");

// ==================== ENVIRONMENT CONFIGURATION ====================
const environment = process.env.NODE_ENV || 'local';
const MAIN_SOCKET_URL = process.env.MAIN_SOCKET_URL || 'http://localhost:3005';
const PORT = process.env.DEVICESPORT || 3008;
const LOG_FILE_MAX_SIZE = 100 * 1024 * 1024; // 100MB

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
    // File doesn't exist yet
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
      filename: 'logs/device-error.log',
      level: 'error',
      maxsize: LOG_FILE_MAX_SIZE,
      maxFiles: 1
    })
  ]
});

checkAndRotateLog('device-error.log');
checkAndRotateLog('device-combined.log');


// ==================== HTTP & SOCKET.IO SERVER SETUP ====================
const httpServer = createServer();

// ALLOW ALL ORIGINS - Critical for native devices
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// ==================== DEVICE CONNECTION TRACKING ====================
const deviceConnections = new Map(); // deviceId -> { socketId, userId, userType, metadata }
const userDevices = new Map(); // userId -> Set of deviceIds

// ==================== SOCKET.IO CLIENT TO MAIN SERVER ====================
const { io: ioClient } = require("socket.io-client");
let mainSocket = null;

function connectToMainServer() {
  mainSocket = ioClient(MAIN_SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling']
  });

  mainSocket.on('connect', () => {
    console.log('✅ Device server connected to main socket server');
  });

  mainSocket.on('disconnect', (reason) => {
    logger.warn('❌ Device server disconnected from main socket server:', reason);
  });

  mainSocket.on('connect_error', (error) => {
    logger.error('❌ Connection error to main server:', error.message);
  });

  // Forward events from main server to devices
  setupMainServerEventForwarding();
}

// ==================== HELPER FUNCTION ====================
function forwardToUserDevices(userId, eventName, data) {
  const deviceIds = userDevices.get(userId);
  if (!deviceIds || deviceIds.size === 0) {
    console.log(`No devices found for user ${userId} for event ${eventName}`);
    return;
  }

  let sentCount = 0;
  deviceIds.forEach(deviceId => {
    const device = deviceConnections.get(deviceId);
    if (device) {
      const socket = io.sockets.sockets.get(device.socketId);
      if (socket) {
        socket.emit(eventName, data);
        sentCount++;
      }
    }
  });

  console.log(`📤 Forwarded '${eventName}' to ${sentCount} device(s) for user ${userId}`);
}

function setupMainServerEventForwarding() {
  // ==================== RIDE EVENTS ====================
  
  // Ride request created (to rider)
  mainSocket.on('ride:request:created', (data) => {
    const { riderId } = data;
    if (riderId) forwardToUserDevices(riderId, 'ride:request:created', data);
  });

  // New ride request (to drivers - broadcast)
  mainSocket.on('ride:request:new', (data) => {
    
    console.log('user devices',userDevices)
    
    console.log('driverId',driverId)
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'ride:request:new', data);
  })

  // Ride request received (to specific driver)
  mainSocket.on('ride:request:received', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'ride:request:received', data);
  });

  // Ride accepted (to rider)
  mainSocket.on('ride:accepted', (data) => {
    const { riderId } = data;
    if (riderId) forwardToUserDevices(riderId, 'ride:accepted', data);
  });

  // Ride taken by another driver
  mainSocket.on('ride:taken', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'ride:taken', data);
  });

  // Driver arrived at pickup
  mainSocket.on('ride:driver:arrived', (data) => {
    const { riderId, driverId } = data;
    if (riderId) forwardToUserDevices(riderId, 'ride:driver:arrived', data);
    if (driverId) forwardToUserDevices(driverId, 'ride:driver:arrived', data);
  });

  // Trip started
  mainSocket.on('ride:trip:started', (data) => {
    const { riderId, driverId } = data;
    if (riderId) forwardToUserDevices(riderId, 'ride:trip:started', data);
    if (driverId) forwardToUserDevices(driverId, 'ride:trip:started', data);
  });

  // Trip completed
  mainSocket.on('ride:trip:completed', (data) => {
    const { riderId, driverId } = data;
    if (riderId) forwardToUserDevices(riderId, 'ride:trip:completed', data);
    if (driverId) forwardToUserDevices(driverId, 'ride:trip:completed', data);
  });

  // Ride cancelled
  mainSocket.on('ride:cancelled', (data) => {
    const { riderId, driverId } = data;
    if (riderId) forwardToUserDevices(riderId, 'ride:cancelled', data);
    if (driverId) forwardToUserDevices(driverId, 'ride:cancelled', data);
  });

  // ==================== LOCATION EVENTS ====================
  
  // Driver location updated (to rider)
  mainSocket.on('driver:location:updated', (data) => {
    const { riderId } = data;
    if (riderId) forwardToUserDevices(riderId, 'driver:location:updated', data);
  });

  // Rider location updated (to driver)
  mainSocket.on('rider:location:updated', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'rider:location:updated', data);
  });

  // Location request from backend
  mainSocket.on('device:location:request', (data) => {
    const { userId } = data;
    if (userId) forwardToUserDevices(userId, 'getCurrentLocation', data);
  });

  // ==================== DRIVER AVAILABILITY EVENTS ====================
  
  // Driver online success
  mainSocket.on('driver:online:success', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'driver:online:success', data);
  });

  // Driver offline success
  mainSocket.on('driver:offline:success', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'driver:offline:success', data);
  });

  // Driver forced offline
  mainSocket.on('driver:forced:offline', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'driver:forced:offline', data);
  });

  // ==================== SUBSCRIPTION EVENTS ====================
  
  // Subscription expiring warning
  mainSocket.on('subscription:expiring:warning', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'subscription:expiring:warning', data);
  });

  // Subscription expired
  mainSocket.on('subscription:expired', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'subscription:expired', data);
  });

  // Subscription activated
  mainSocket.on('subscription:activated', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'subscription:activated', data);
  });

  // ==================== PAYMENT EVENTS ====================
  
  // Payment success
  mainSocket.on('payment:success', (data) => {
    const { userId } = data;
    if (userId) forwardToUserDevices(userId, 'payment:success', data);
  });

  // Payment failed
  mainSocket.on('payment:failed', (data) => {
    const { userId } = data;
    if (userId) forwardToUserDevices(userId, 'payment:failed', data);
  });

  // Withdrawal processed
  mainSocket.on('withdrawal:processed', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'withdrawal:processed', data);
  });

  // ==================== RATING EVENTS ====================
  
  // Rating request
  mainSocket.on('rating:request', (data) => {
    const { riderId, driverId } = data;
    if (riderId) forwardToUserDevices(riderId, 'rating:request', data);
    if (driverId) forwardToUserDevices(driverId, 'rating:request', data);
  });

  // Rating request to rider
  mainSocket.on('rating:request:rider', (data) => {
    const { riderId } = data;
    if (riderId) forwardToUserDevices(riderId, 'rating:request', data);
  });

  // Rating request to driver
  mainSocket.on('rating:request:driver', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'rating:request', data);
  });

  // Rating submitted
  mainSocket.on('rating:submitted', (data) => {
    const { userId } = data;
    if (userId) forwardToUserDevices(userId, 'rating:submitted', data);
  });

  // ==================== NOTIFICATION EVENTS ====================
  
  // New notification
  mainSocket.on('notification:new', (data) => {
    const { userId } = data;
    if (userId) forwardToUserDevices(userId, 'notification:new', data);
  });

  // Notification send (device specific)
  mainSocket.on('device:notification:send', (data) => {
    const { userId, notification } = data;
    if (userId) forwardToUserDevices(userId, 'showNotification', notification);
  });

  // Broadcast notification
  mainSocket.on('notification:broadcast', (data) => {
    // Broadcast to ALL connected devices
    deviceConnections.forEach((device) => {
      const socket = io.sockets.sockets.get(device.socketId);
      if (socket) {
        socket.emit('notification:broadcast', data);
      }
    });
    console.log(`📢 Broadcast notification to ${deviceConnections.size} devices`);
  });

  // ==================== SOS & EMERGENCY EVENTS ====================
  
  // SOS triggered confirmation
  mainSocket.on('sos:triggered', (data) => {
    const { userId } = data;
    if (userId) forwardToUserDevices(userId, 'sos:triggered', data);
  });

  // SOS acknowledged
  mainSocket.on('sos:acknowledged', (data) => {
    const { userId } = data;
    if (userId) forwardToUserDevices(userId, 'sos:acknowledged', data);
  });

  // SOS alert (to admins - handled separately as they don't use device socket)
  mainSocket.on('sos:alert', (data) => {
    // This goes to admin panel, not mobile devices
    console.log('SOS alert received (admin-only event)');
  });

  // ==================== BUS ROUTE EVENTS ====================
  
  // Bus route started
  mainSocket.on('bus:route:started', (data) => {
    const { riderId, driverId } = data;
    if (riderId) forwardToUserDevices(riderId, 'bus:route:started', data);
    if (driverId) forwardToUserDevices(driverId, 'bus:route:started', data);
  });

  // Bus location updated
  mainSocket.on('bus:location:updated', (data) => {
    const { riderId } = data;
    if (riderId) forwardToUserDevices(riderId, 'bus:location:updated', data);
  });

  // ==================== AFFILIATE EVENTS ====================
  
  // Referral signup
  mainSocket.on('affiliate:referral:signup', (data) => {
    const { affiliateId } = data;
    if (affiliateId) forwardToUserDevices(affiliateId, 'affiliate:referral:signup', data);
  });

  // Commission earned
  mainSocket.on('affiliate:commission:earned', (data) => {
    const { affiliateId } = data;
    if (affiliateId) forwardToUserDevices(affiliateId, 'affiliate:commission:earned', data);
  });

  // ==================== SYSTEM EVENTS ====================
  
  // System announcement
  mainSocket.on('system:announcement', (data) => {
    // Broadcast to ALL devices
    deviceConnections.forEach((device) => {
      const socket = io.sockets.sockets.get(device.socketId);
      if (socket) {
        socket.emit('system:announcement', data);
      }
    });
    console.log(`📢 System announcement sent to ${deviceConnections.size} devices`);
  });

  // ==================== CONNECTION EVENTS ====================
  
  // Session replaced events
  mainSocket.on('rider:session-replaced', (data) => {
    const { riderId } = data;
    if (riderId) forwardToUserDevices(riderId, 'rider:session-replaced', data);
  });

  mainSocket.on('driver:session-replaced', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'driver:session-replaced', data);
  });

  mainSocket.on('conductor:session-replaced', (data) => {
    const { conductorId } = data;
    if (conductorId) forwardToUserDevices(conductorId, 'conductor:session-replaced', data);
  });

  mainSocket.on('delivery:session-replaced', (data) => {
    const { deliveryPersonId } = data;
    if (deliveryPersonId) forwardToUserDevices(deliveryPersonId, 'delivery:session-replaced', data);
  });

  // ==================== DRAW-OVER EVENTS ====================
  
  mainSocket.on('device:drawover:show', (data) => {
    const { userId, overlayData } = data;
    if (userId) forwardToUserDevices(userId, 'showDrawOver', overlayData);
  });

  // ==================== SUCCESS/CONFIRMATION EVENTS ====================
  
  // Ride accept success
  mainSocket.on('ride:accept:success', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'ride:accept:success', data);
  });

  // Ride decline success
  mainSocket.on('ride:decline:success', (data) => {
    const { driverId } = data;
    if (driverId) forwardToUserDevices(driverId, 'ride:decline:success', data);
  });

  // ==================== ERROR EVENTS ====================
  
  mainSocket.on('error', (data) => {
    const { userId } = data;
    if (userId) forwardToUserDevices(userId, 'error', data);
  });

  // ==================== PONG EVENTS ====================
  
  mainSocket.on('pong', (data) => {
    // Pong is handled locally, no need to forward
    console.log('Received pong from main server');
  });
}

// ==================== DEVICE SOCKET HANDLERS ====================
io.on("connection", (socket) => {
  console.log(`📱 New device connection: ${socket.id}`);

  // Device registration
  socket.on('device:register', async (data) => {
    const { 
      deviceId, 
      userId,
      userType, 
      frontendName,
      notificationToken,
      deviceInfo,
      socketServerUrl 
    } = data;

    if (!deviceId || !userId || !userType) {
      socket.emit('device:register:error', { message: 'Missing required fields' });
      return;
    }

    // Store device connection
    deviceConnections.set(deviceId, {
      socketId: socket.id,
      userId,
      userType,
      frontendName,
      notificationToken,
      deviceInfo,
      registeredAt: Date.now()
    });

    // Track user devices
    if (!userDevices.has(userId)) {
      userDevices.set(userId, new Set());
    }
    userDevices.get(userId).add(deviceId);

    console.log(`✅ Device ${deviceId} registered for user ${userId} (${userType})`);

    // Notify main socket server about device registration
    if (mainSocket && mainSocket.connected) {
      mainSocket.emit('device:registered', {
        deviceId,
        userId,
        userType,
        frontendName,
        notificationToken,
        deviceInfo
      });
    }

    // Send device info to backend API for storage
    try {
      await axios.post(`${process.env.BACKEND_URL || 'http://localhost:1343'}/api/devices/register`, {
        userId,
        devices: [{
          deviceId,
          notificationToken,
          deviceInfo,
          frontendName,
          registeredAt: new Date().toISOString()
        }]
      });
    } catch (error) {
      logger.error('Error saving device to backend:', error.message);
    }

    socket.emit('device:register:success', { deviceId, userId });

    // Subscribe to main socket server with user credentials
    if (mainSocket && mainSocket.connected) {
      const joinEvent = `${userType}:join`;
      mainSocket.emit(joinEvent, {
        [`${userType}Id`]: userId,
        metadata: deviceInfo
      });
    }
  });

  // Location update from device
  socket.on('device:location:update', async(data) => {
    const { deviceId, location, heading, speed } = data;
    const device = deviceConnections.get(deviceId);
    if (!device) {
      logger.warn(`Location update from unregistered device: ${deviceId}`);
      return;
    }
    try {
      await axios.post(`${process.env.BACKEND_URL || 'http://localhost:1343'}/api/devices/updatecurrentloc`, {
        deviceId,
        location: {
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy,
          altitude: location.altitude,
          altitudeAccuracy: location.altitudeAccuracy,
          heading: location.heading,
          speed: location.speed,
          location: location.location
        }
      })
    } catch (error) {
      console.log(error)
      logger.error('Error saving current location to backend:', error.message);
    }
    

    // Forward to main socket server
    if (mainSocket && mainSocket.connected) {
      if(device?.userType){
        const locationEvent = `${device.userType}:location:update`;
        mainSocket.emit(locationEvent, {
          [`${device.userType}Id`]: device.userId,
          location,
          heading,
          speed
        })
       }
    }

    logger.debug(`Location update from device ${deviceId}`);
  })

  // Notification acknowledgment
  socket.on('device:notification:acknowledged', (data) => {
    const { deviceId, notificationId } = data;
    
    const device = deviceConnections.get(deviceId);
    if (device && mainSocket && mainSocket.connected) {
      mainSocket.emit('device:notification:acknowledged', {
        userId: device.userId,
        notificationId
      });
    }
  });

  // Draw-over dismissed
  socket.on('device:drawover:dismissed', (data) => {
    const { deviceId, overlayId } = data;
    
    const device = deviceConnections.get(deviceId);
    if (device && mainSocket && mainSocket.connected) {
      mainSocket.emit('device:drawover:dismissed', {
        userId: device.userId,
        overlayId
      });
    }
  });

  // Permission status update
  socket.on('device:permissions:update', async (data) => {
    const { deviceId, permissions } = data;
    
    const device = deviceConnections.get(deviceId);
    if (!device) return;

    // Update backend
    try {
      await axios.patch(
        `${process.env.BACKEND_URL || 'http://localhost:1343'}/api/devices/${device.userId}/${deviceId}`,
        { permissions }
      );
    } catch (error) {
      logger.error('Error updating device permissions:', error.message);
    }
  });

  // Generic message forwarding to main server
  socket.on('forward:to:main', (data) => {
    const { event, payload } = data;
    
    if (mainSocket && mainSocket.connected) {
      mainSocket.emit(event, payload);
    }
  });

  // Ping/Pong for keepalive
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Disconnect handler
  socket.on('disconnect', (reason) => {
    console.log(`📱 Device disconnected: ${socket.id}, reason: ${reason}`);

    // Find and remove device
    for (const [deviceId, device] of deviceConnections.entries()) {
      if (device.socketId === socket.id) {
        // Remove from user devices
        const userDeviceSet = userDevices.get(device.userId);
        if (userDeviceSet) {
          userDeviceSet.delete(deviceId);
          if (userDeviceSet.size === 0) {
            userDevices.delete(device.userId);
          }
        }

        // Remove device connection
        deviceConnections.delete(deviceId);
        
        console.log(`Cleaned up device ${deviceId}`);
        break;
      }
    }
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
        devices: deviceConnections.size,
        users: userDevices.size,
        mainServerConnected: mainSocket?.connected || false
      },
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const devicesByType = {};
    deviceConnections.forEach(device => {
      devicesByType[device.userType] = (devicesByType[device.userType] || 0) + 1;
    });

    res.end(JSON.stringify({
      connections: {
        totalDevices: deviceConnections.size,
        uniqueUsers: userDevices.size,
        devicesByType
      },
      mainServer: {
        connected: mainSocket?.connected || false,
        url: MAIN_SOCKET_URL
      },
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// ==================== SERVER START ====================
connectToMainServer();

httpServer.listen(PORT, () => {
  console.log(`🚀 Device Socket Server started`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🔓 CORS: Allow ALL origins (for native devices)`);
  console.log(`🔗 Main Socket Server: ${MAIN_SOCKET_URL}`);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  if (mainSocket) mainSocket.disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  if (mainSocket) mainSocket.disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});