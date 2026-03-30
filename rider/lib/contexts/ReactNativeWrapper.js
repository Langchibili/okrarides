// rider/lib/contexts/ReactNativeWrapper.js
'use client';
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const ReactNativeContext = createContext(null);

export const useReactNative = () => {
  const context = useContext(ReactNativeContext);
  if (!context) throw new Error('useReactNative must be used within ReactNativeWrapper');
  return context;
};

// ─── Per-type timeouts ────────────────────────────────────────────────────────
const REQUEST_TIMEOUTS = {
  GET_CURRENT_LOCATION:    10_000,
  START_LOCATION_TRACKING: 10_000,
  STOP_LOCATION_TRACKING:   5_000,
  REQUEST_PERMISSION:      60_000,
  CHECK_PERMISSION:         5_000,
  INITIALIZE_SERVICES:     20_000,
  SHOW_NOTIFICATION:        5_000,
  DEFAULT:                 30_000,
};

// Fire-and-forget: native never replies, never open a pending slot
const FIRE_AND_FORGET_TYPES = new Set(['LOG_DATA', 'ANALYTICS_EVENT']);

const getTimeout = (type) => REQUEST_TIMEOUTS[type] ?? REQUEST_TIMEOUTS.DEFAULT;


export function ReactNativeWrapper({ children }) {
  const [isNative,            setIsNative]            = useState(false);
  const [isChecking,          setIsChecking]          = useState(true);
  const [permissions,         setPermissions]         = useState({ location: null, notification: null, drawOver: null });
  const [deviceInfo,          setDeviceInfo]          = useState(null);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [currentFrontend,     setCurrentFrontend]     = useState(null);

  const checkTimeoutRef     = useRef(null);
  const messageHandlersRef  = useRef(new Map());
  const pendingRequestsRef  = useRef(new Map());
  const requestIdCounterRef = useRef(0);
  const deviceIdRef         = useRef(null);
  const userIdRef           = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════
  // CHECKPOINT 1 — wrapper mounted
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
  }, []);

  // ============================================
  // Native Environment Detection
  // ============================================
  useEffect(() => {
    let checkCount = 0;
    const maxChecks = 180;

    const checkNativeEnvironment = () => {
      const isRNWebView = typeof window !== 'undefined' && !!window.ReactNativeWebView;
      if (isRNWebView) {
        // ═══════════════════════════════════════════════════════════════
        // CHECKPOINT 2a — RN WebView detected
        // ═══════════════════════════════════════════════════════════════
        setIsNative(true);
        setIsChecking(false);
        clearInterval(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
        detectCurrentFrontend();
      } else {
        checkCount++;
        if (checkCount === 1) {
          // Alert only on the first miss so we don't spam every second
        }
        if (checkCount >= maxChecks) {
          setIsNative(false);
          setIsChecking(false);
          clearInterval(checkTimeoutRef.current);
          checkTimeoutRef.current = null;
        }
      }
    };

    checkNativeEnvironment();
    if (!window.ReactNativeWebView) {
      checkTimeoutRef.current = setInterval(checkNativeEnvironment, 1000);
    }
    return () => clearInterval(checkTimeoutRef.current);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // CHECKPOINT 3 — isNative state changed
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
  }, [isNative]);

  // ============================================
  // Frontend Detection
  // ============================================
  const detectCurrentFrontend = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const { hostname, pathname } = window.location;
    const frontendMap = [
      { test: () => hostname.includes('driver.')    || pathname.includes('/driver'),    name: 'driver' },
      { test: () => hostname.includes('book.')      || hostname.includes('rider.') || pathname.includes('/rider'), name: 'rider' },
      { test: () => hostname.includes('conductor.') || pathname.includes('/conductor'), name: 'conductor' },
      { test: () => hostname.includes('delivery.')  || pathname.includes('/delivery'),  name: 'delivery' },
      { test: () => hostname.includes('admin.')     || pathname.includes('/admin'),     name: 'admin' },
    ];
    const detected = frontendMap.find(f => f.test());
    const name = detected ? detected.name : 'landing';
    setCurrentFrontend(name);
    return name;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isNative) return;
    const id = setInterval(detectCurrentFrontend, 1000);
    return () => clearInterval(id);
  }, [isNative, detectCurrentFrontend]);

  // ============================================
  // Message Handling
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ═══════════════════════════════════════════════════════════════════
    // CHECKPOINT 4 — message listeners registered
    // ═══════════════════════════════════════════════════════════════════

    const handleMessage = (event) => {
      // ═════════════════════════════════════════════════════════════════
      // CHECKPOINT 5 — a raw message arrived
      // ═════════════════════════════════════════════════════════════════

      let data;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch (e) {
        return;
      }

      const { type, requestId, payload, error } = data ?? {};

      // ═════════════════════════════════════════════════════════════════
      // CHECKPOINT 6 — message parsed successfully
      // ═════════════════════════════════════════════════════════════════

      // ── Request / response path ───────────────────────────────────────
      if (requestId && pendingRequestsRef.current.has(requestId)) {
        const { resolve, reject, timeoutId } = pendingRequestsRef.current.get(requestId);
        if (timeoutId) clearTimeout(timeoutId);
        pendingRequestsRef.current.delete(requestId);
        if (error) {
          reject(new Error(typeof error === 'string' ? error : JSON.stringify(error)));
        } else {
          resolve(payload);
        }
        return;
      }

      // ── Event broadcast path ──────────────────────────────────────────
      const handlers = messageHandlersRef.current.get(type);

      // ═════════════════════════════════════════════════════════════════
      // CHECKPOINT 7 — handler lookup result
      // ═════════════════════════════════════════════════════════════════

      if (handlers?.size) {
        handlers.forEach(h => h(payload));
      } else {
      }

      // Built-in state side-effects
      switch (type) {
        case 'PERMISSION_RESULT':
          if (payload?.permissionType) {
            setPermissions(prev => ({ ...prev, [payload.permissionType]: payload.status }));
          }
          break;
        case 'DEVICE_INFO':
          setDeviceInfo(payload);
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage); // Android fires on document, not window
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage);
    };
  }, []);

  // ============================================
  // Core Communication: sendToNative
  // ============================================
  const sendToNative = useCallback((type, payload = {}) => {
    if (FIRE_AND_FORGET_TYPES.has(type)) {
      try {
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
        }
      } catch (e) {
        console.warn('[RNWrapper] fire-and-forget send failed:', type, e);
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (!isNative || !window.ReactNativeWebView) {
        reject(new Error('Not running in React Native environment'));
        return;
      }

      const requestId = `req_${++requestIdCounterRef.current}_${Date.now()}`;

      // Store entry FIRST, attach timeoutId AFTER (prevents race)
      pendingRequestsRef.current.set(requestId, { resolve, reject, timeoutId: null });

      const duration = getTimeout(type);
      const timeoutId = setTimeout(() => {
        if (pendingRequestsRef.current.has(requestId)) {
          pendingRequestsRef.current.delete(requestId);
          reject(new Error(`Request timeout after ${duration}ms: ${type}`));
        }
      }, duration);

      // Attach timeoutId so message handler can clear it on response
      pendingRequestsRef.current.get(requestId).timeoutId = timeoutId;

      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, requestId, payload }));
      } catch (err) {
        clearTimeout(timeoutId);
        pendingRequestsRef.current.delete(requestId);
        reject(err);
      }
    });
  }, [isNative]);

  // ============================================
  // Event Subscription
  // ============================================
  const on = useCallback((type, handler) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, new Set());
    }
    messageHandlersRef.current.get(type).add(handler);

    // ═══════════════════════════════════════════════════════════════════
    // CHECKPOINT 8 — a handler was registered via on()
    // ═══════════════════════════════════════════════════════════════════

    return () => {
      const handlers = messageHandlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }, []);

  // ============================================
  // Permission Management
  // ============================================
  const loadPermissionsFromBackend = useCallback(async (userId, deviceId) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { devices = [] } = await res.json();
        const device = devices.find(d => d.deviceId === deviceId);
        if (device?.permissions) setPermissions(device.permissions);
      }
    } catch (err) {
      console.error('[RNWrapper] loadPermissionsFromBackend:', err);
    }
  }, []);

  const updatePermissionsInBackend = useCallback(async (userId, deviceId, permissionType, status) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${userId}/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permissions: { ...permissions, [permissionType]: status } }),
      });
    } catch (err) {
      console.error('[RNWrapper] updatePermissionsInBackend:', err);
    }
  }, [permissions]);

  const requestPermission = useCallback(async (permissionType) => {
    if (permissions[permissionType] === 'granted') return 'granted';
    if (isNative) {
      try {
        const result = await sendToNative('REQUEST_PERMISSION', { permissionType });
        setPermissions(prev => ({ ...prev, [permissionType]: result.status }));
        if (userIdRef.current && deviceIdRef.current) {
          await updatePermissionsInBackend(userIdRef.current, deviceIdRef.current, permissionType, result.status);
        }
        return result.status;
      } catch (err) {
        console.error('[RNWrapper] requestPermission:', err);
        return 'denied';
      }
    }
    if (permissionType === 'location') {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'granted' || result.state === 'prompt') {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => { setPermissions(p => ({ ...p, location: 'granted' })); resolve('granted'); },
              () => { setPermissions(p => ({ ...p, location: 'denied'  })); resolve('denied');  },
            );
          });
        }
        return result.state;
      } catch { return 'denied'; }
    }
    if (permissionType === 'notification') {
      try {
        const status = await Notification.requestPermission();
        setPermissions(p => ({ ...p, notification: status }));
        return status;
      } catch { return 'denied'; }
    }
    return 'unsupported';
  }, [isNative, sendToNative, permissions, updatePermissionsInBackend]);

  const checkPermission = useCallback(async (permissionType) => {
    if (isNative) {
      try {
        const result = await sendToNative('CHECK_PERMISSION', { permissionType });
        setPermissions(p => ({ ...p, [permissionType]: result.status }));
        return result.status;
      } catch { return 'denied'; }
    }
    if (permissionType === 'location') {
      try { return (await navigator.permissions.query({ name: 'geolocation' })).state; } catch { return 'prompt'; }
    }
    if (permissionType === 'notification') return Notification.permission;
    return 'unsupported';
  }, [isNative, sendToNative]);

  // ============================================
  // Service Initialization
  // ============================================
  
  const initializeNativeServices = useCallback(async (userId, frontendName, socketServerUrl) => {
    if (!isNative)           return { success: false, reason: 'not_native' };
    if (servicesInitialized) return { success: true,  reason: 'already_initialized' };
    try {
      const result = await sendToNative('INITIALIZE_SERVICES', {
        userId, frontendName,
        socketServerUrl: socketServerUrl || process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL,
      });
      userIdRef.current   = userId;
      deviceIdRef.current = result.deviceId;
      setServicesInitialized(true);
      setCurrentFrontend(frontendName);
      await loadPermissionsFromBackend(userId, result.deviceId);
      return { success: true, ...result };
    } catch (err) {
      console.error('[RNWrapper] initializeNativeServices:', err);
      return { success: false, error: err.message };
    }
    
  }, [isNative, servicesInitialized, sendToNative, loadPermissionsFromBackend]);
  
  const reconnectDeviceSocket = useCallback(async (userId, frontendName, socketServerUrl) => {
    if (!isNative) return { success: false, reason: 'not_native' };
    try {
      const result = await sendToNative('RECONNECT_SOCKET', {
        userId, frontendName,
        socketServerUrl: socketServerUrl || process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL,
      })
      userIdRef.current   = userId;
      deviceIdRef.current = result.deviceId;
      setCurrentFrontend(frontendName);
      return { success: true, ...result };
    } catch (err) {
      console.error('[RECONNECT SOCKET] reconnectDeviceSocket:', err);
      return { success: false, error: err.message };
    }
    
  }, [isNative, sendToNative]);

  const disconnectDeviceSocket = useCallback(async (userId, frontendName) => {
    if (!isNative) return { success: false, reason: 'not_native' };
    try {
      const result = await sendToNative('DISCONNECT_SOCKET', {
        userId, frontendName
      })
      userIdRef.current   = null;
      setCurrentFrontend(null);
      return { success: true, ...result };
    } catch (err) {
      console.error('[RECONNECT SOCKET] reconnectDeviceSocket:', err);
      return { success: false, error: err.message };
    }
  }, [isNative, sendToNative])

  // ============================================
  // Location Services
  // ============================================

  const getCurrentLocation = useCallback(async (runAfterLocationUpdate = ()=>{},userId=null) => {
    if (isNative) {
      try {
        const location = await sendToNative('GET_CURRENT_LOCATION', {});
        const locationData = {
          lat: location?.coords?.latitude, lng: location?.coords?.longitude,
          accuracy: location?.coords?.accuracy, heading: location?.coords?.heading,
          speed: location?.coords?.speed, timestamp: location?.timestamp,
        };
         if(location && userId){
          runAfterLocationUpdate(userId)
        }
        return locationData;
      } catch (err) {
        throw err;
      }
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy, heading: pos.coords.heading,
          speed: pos.coords.speed, timestamp: pos.timestamp,
        }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, [isNative, sendToNative]);

  const startLocationTracking = useCallback(async (interval = 20000) => {
    if (isNative) return sendToNative('START_LOCATION_TRACKING', { interval });
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const handlers = messageHandlersRef.current.get('LOCATION_UPDATE');
          if (handlers?.size) {
            const loc = {
              lat: pos.coords.latitude, lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy, heading: pos.coords.heading,
              speed: pos.coords.speed, timestamp: pos.timestamp,
            };
            handlers.forEach(h => h(loc));
          }
        },
        (err) => console.error('[RNWrapper] watchPosition error:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
      resolve({ watchId });
    });
  }, [isNative, sendToNative]);

  const stopLocationTracking = useCallback(async () => {
    if (isNative) return sendToNative('STOP_LOCATION_TRACKING', {});
    return Promise.resolve();
  }, [isNative, sendToNative])


  const handleChangeThemeMode  = useCallback(async ({ color, mode } ) => {
    if (isNative) return await sendToNative('THEME_MODE_CHANGE', { color, mode } );
    return { success: true };
  }, [isNative, sendToNative])
  // ============================================
  // Notification Services
  // ============================================
  const showNotification = useCallback(async (notification) => {
    if (isNative) return sendToNative('SHOW_NOTIFICATION', notification);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body, icon: notification.icon,
        badge: notification.badge, data: notification.data,
      });
      return { shown: true };
    }
    return { shown: false, reason: 'permission_denied' };
  }, [isNative, sendToNative]);

  // ============================================
  // Context Value
  // ============================================
  const value = {
    isNative, isChecking, permissions, deviceInfo,
    servicesInitialized, currentFrontend,
    sendToNative, on,
    requestPermission, checkPermission,
    initializeNativeServices,
    handleChangeThemeMode,
    reconnectDeviceSocket,
    disconnectDeviceSocket,
    getCurrentLocation, 
    startLocationTracking, 
    stopLocationTracking,
    showNotification,
  };

  return (
    <ReactNativeContext.Provider value={value}>
      {children}
    </ReactNativeContext.Provider>
  );
}

export default ReactNativeWrapper