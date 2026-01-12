// ============================================
// lib/services/realtimeService.js
// ============================================

import { io } from 'socket.io-client';

class RealtimeService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // ============================================
  // Initialize WebSocket Connection
  // ============================================
  connect(userId, token) {
    /*
      Connect to WebSocket server for real-time updates
      
      Events to listen for:
      - ride:status_changed
      - ride:driver_assigned
      - ride:driver_location_update
      - ride:driver_arrived
      - ride:trip_started
      - ride:trip_completed
      - notification:new
    */
    
    if (this.socket?.connected) {
      return;
    }
    
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:1343';
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.emit('connected');
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.emit('disconnected', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    });
    
    // Ride events
    this.socket.on('ride:status_changed', (data) => {
      /*
        data: {
          rideId: 123,
          status: 'accepted',
          timestamp: '2025-01-10T10:35:00Z'
        }
      */
      this.emit('rideStatusChanged', data);
    });
    
    this.socket.on('ride:driver_assigned', (data) => {
      /*
        data: {
          rideId: 123,
          driver: { id, name, phone, rating, ... },
          vehicle: { plate, model, color, ... },
          eta: 180,
          distance: 1.2
        }
      */
      this.emit('driverAssigned', data);
    });
    
    this.socket.on('ride:driver_location_update', (data) => {
      /*
        data: {
          rideId: 123,
          location: { lat, lng, heading, speed },
          eta: 150,
          distance: 0.8
        }
      */
      this.emit('driverLocationUpdate', data);
    });
    
    this.socket.on('ride:driver_arrived', (data) => {
      /*
        data: {
          rideId: 123,
          arrivedAt: '2025-01-10T10:38:00Z'
        }
      */
      this.emit('driverArrived', data);
    });
    
    this.socket.on('ride:trip_started', (data) => {
      /*
        data: {
          rideId: 123,
          tripStartedAt: '2025-01-10T10:40:00Z'
        }
      */
      this.emit('tripStarted', data);
    });
    
    this.socket.on('ride:trip_completed', (data) => {
      /*
        data: {
          rideId: 123,
          tripCompletedAt: '2025-01-10T10:55:00Z',
          finalFare: 28.50,
          actualDistance: 5.5,
          actualDuration: 15
        }
      */
      this.emit('tripCompleted', data);
    });
    
    // Notification events
    this.socket.on('notification:new', (data) => {
      /*
        data: {
          id: 456,
          type: 'promo_code',
          title: 'New Promo Code!',
          body: 'Get 50% off your next ride',
          data: { code: 'FRIDAY50' }
        }
      */
      this.emit('newNotification', data);
    });
  }

  // ============================================
  // Disconnect WebSocket
  // ============================================
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // ============================================
  // Event Emitter Methods
  // ============================================
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // ============================================
  // Join Ride Room (for tracking specific ride)
  // ============================================
  joinRideRoom(rideId) {
    if (this.socket?.connected) {
      this.socket.emit('ride:join', { rideId });
    }
  }

  // ============================================
  // Leave Ride Room
  // ============================================
  leaveRideRoom(rideId) {
    if (this.socket?.connected) {
      this.socket.emit('ride:leave', { rideId });
    }
  }
}

export default new RealtimeService();