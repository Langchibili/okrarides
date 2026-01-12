// driver/components/RideRequestOverlay.jsx
/**
 * This component shows over other apps when driver receives a ride request
 * Requires react-native-draw-overlay permission
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRide } from '@/lib/hooks/useRide';

export function RideRequestOverlay({ rideRequest, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds to respond
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(); // Auto-decline when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>New Ride Request!</Text>
          <Text style={styles.timer}>{timeLeft}s</Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.distance}>{rideRequest.distance.toFixed(1)} km away</Text>
          <Text style={styles.fare}>K{rideRequest.estimatedFare.toFixed(2)}</Text>
          <Text style={styles.location}>
            From: {rideRequest.pickupLocation.address}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.declineButton]}
            onPress={onDecline}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]}
            onPress={onAccept}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  timer: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444'
  },
  details: {
    marginBottom: 24
  },
  distance: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8
  },
  fare: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 12
  },
  location: {
    fontSize: 14,
    color: '#888'
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  declineButton: {
    backgroundColor: '#ef4444'
  },
  acceptButton: {
    backgroundColor: '#10b981'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});