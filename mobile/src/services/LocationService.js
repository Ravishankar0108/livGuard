// ─────────────────────────────────────────
//  FamTrack Mobile — Background GPS Service
//  File: mobile/src/services/LocationService.js
// ─────────────────────────────────────────
// Install: npm install react-native-background-geolocation

import BackgroundGeolocation from 'react-native-background-geolocation';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config';

let socket = null;

export async function initLocationTracking() {
  const token = await AsyncStorage.getItem('token');
  if (!token) return;

  // ── WebSocket connection ─────────────────
  socket = io(API_BASE, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 3000
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));

  // ── Background Geolocation config ────────
  await BackgroundGeolocation.ready({
    // Geolocation
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    distanceFilter: 20,          // meters moved before new point
    stopTimeout: 5,              // minutes before "stationary" mode

    // HTTP (direct ping to server)
    url: `${API_BASE}/api/location/ping`,
    httpRootProperty: '.',
    locationTemplate: JSON.stringify({
      lat: '<%= latitude %>',
      lng: '<%= longitude %>',
      speed: '<%= speed %>',
      accuracy: '<%= accuracy %>',
      bearing: '<%= heading %>',
      altitude: '<%= altitude %>',
      battery: '<%= battery.level * 100 %>'
    }),
    headers: { Authorization: `Bearer ${token}` },
    autoSync: true,
    batchSync: false,

    // Activity Recognition
    stopDetectionDelay: 1,
    disableMotionActivityUpdates: false,

    // iOS specific
    activityType: BackgroundGeolocation.ACTIVITY_TYPE_OTHER,
    pausesLocationUpdatesAutomatically: false,

    // Android
    enableHeadless: true,
    foregroundService: true,
    notification: {
      title: 'FamTrack is active',
      text: 'Sharing location with family',
      smallIcon: 'mipmap/ic_launcher',
    },

    // Logging
    logLevel: BackgroundGeolocation.LOG_LEVEL_WARNING,
    debug: false
  });

  // ── Location event listener ──────────────
  BackgroundGeolocation.onLocation(async (location) => {
    // Also broadcast via socket for real-time updates
    if (socket?.connected) {
      socket.emit('location_update', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        speed: location.coords.speed,
        battery: location.battery.level * 100,
        timestamp: location.timestamp
      });
    }
  });

  BackgroundGeolocation.onMotionChange((event) => {
    console.log('Motion change:', event.isMoving);
  });

  // Start tracking
  await BackgroundGeolocation.start();
  console.log('Background location tracking started');
}

export async function stopTracking() {
  await BackgroundGeolocation.stop();
  socket?.disconnect();
}

export async function triggerSOS(lat, lng, message) {
  socket?.emit('sos', { lat, lng, message });
}

export function getSocket() {
  return socket;
}
