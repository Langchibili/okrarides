// 'use client';
// import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

// const ReactNativeContext = createContext(null);

// export const useReactNative = () => {
//   const context = useContext(ReactNativeContext);
//   if (!context) {
//     throw new Error('useReactNative must be used within ReactNativeWrapper');
//   }
//   return context;
// };

// export function ReactNativeWrapper({ children }) {
//   // State
//   const [isNative, setIsNative] = useState(false);
//   const [isChecking, setIsChecking] = useState(true);
//   const [permissions, setPermissions] = useState({
//     location: null,
//     notification: null,
//     drawOver: null
//   });
//   const [deviceInfo, setDeviceInfo] = useState(null);
//   const [servicesInitialized, setServicesInitialized] = useState(false);
//   const [currentFrontend, setCurrentFrontend] = useState(null);

//   // Refs
//   const checkTimeoutRef = useRef(null);
//   const messageHandlersRef = useRef(new Map());
//   const pendingRequestsRef = useRef(new Map());
//   const requestIdCounterRef = useRef(0);
//   const deviceIdRef = useRef(null);
//   const userIdRef = useRef(null);

//   // ============================================
//   // Native Environment Detection
//   // ============================================
//   useEffect(() => {
//     let checkCount = 0;
//     const maxChecks = 180; // 3 minutes at 1 second intervals

//     const checkNativeEnvironment = () => {
//       const isRNWebView = typeof window !== 'undefined' && !!window.ReactNativeWebView;

//       if (isRNWebView) {
//         setIsNative(true);
//         setIsChecking(false);
//         if (checkTimeoutRef.current) {
//           clearInterval(checkTimeoutRef.current);
//           checkTimeoutRef.current = null;
//         }
//         detectCurrentFrontend();
//       } else {
//         checkCount++;
//         if (checkCount >= maxChecks) {
//           setIsNative(false);
//           setIsChecking(false);
//           if (checkTimeoutRef.current) {
//             clearInterval(checkTimeoutRef.current);
//             checkTimeoutRef.current = null;
//           }
//         }
//       }
//     };

//     // Initial check
//     checkNativeEnvironment();

//     // Continue checking if not found yet
//     if (!isNative && isChecking) {
//       checkTimeoutRef.current = setInterval(checkNativeEnvironment, 1000);
//     }

//     return () => {
//       if (checkTimeoutRef.current) {
//         clearInterval(checkTimeoutRef.current);
//       }
//     };
//   }, []);

//   // ============================================
//   // Frontend Detection
//   // ============================================
//   const detectCurrentFrontend = useCallback(() => {
//     if (typeof window === 'undefined') return null;

//     const hostname = window.location.hostname;
//     const pathname = window.location.pathname;

//     const frontendMap = [
//       { test: () => hostname.includes('driver.') || pathname.includes('/driver'), name: 'driver' },
//       { test: () => hostname.includes('book.') || hostname.includes('rider.') || pathname.includes('/rider'), name: 'rider' },
//       { test: () => hostname.includes('conductor.') || pathname.includes('/conductor'), name: 'conductor' },
//       { test: () => hostname.includes('delivery.') || pathname.includes('/delivery'), name: 'delivery' },
//       { test: () => hostname.includes('admin.') || pathname.includes('/admin'), name: 'admin' },
//     ];

//     const detected = frontendMap.find(f => f.test());
//     const frontendName = detected ? detected.name : 'landing';
    
//     setCurrentFrontend(frontendName);
//     return frontendName;
//   }, []);

//   // Listen for URL changes
//   useEffect(() => {
//     if (typeof window === 'undefined' || !isNative) return;

//     const urlCheckInterval = setInterval(() => {
//       detectCurrentFrontend();
//     }, 1000);

//     return () => clearInterval(urlCheckInterval);
//   }, [isNative, detectCurrentFrontend]);

//   // ============================================
//   // Message Handling
//   // ============================================
//   useEffect(() => {
//     if (typeof window === 'undefined') return;

//     const handleMessage = (event) => {
//       try {
//         const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
//         const { type, requestId, payload, error } = data;

//         // Handle pending request responses
//         if (requestId && pendingRequestsRef.current.has(requestId)) {
//           const { resolve, reject } = pendingRequestsRef.current.get(requestId);
//           pendingRequestsRef.current.delete(requestId);

//           if (error) {
//             reject(new Error(error));
//           } else {
//             resolve(payload);
//           }
//           return;
//         }

//         // Handle event-based messages
//         const handlers = messageHandlersRef.current.get(type);
//         if (handlers) {
//           handlers.forEach(handler => handler(payload));
//         }

//         // Handle specific message types
//         switch (type) {
//           case 'PERMISSION_RESULT':
//             setPermissions(prev => ({
//               ...prev,
//               [payload.permissionType]: payload.status
//             }));
//             break;
//           case 'DEVICE_INFO':
//             setDeviceInfo(payload);
//             break;
//           case 'LOCATION_UPDATE':
//             // Handled by registered handlers
//             break;
//           default:
//             // Silent - only log errors
//             break;
//         }
//       } catch (error) {
//         console.error('Error handling message from native:', error);
//       }
//     };

//     window.addEventListener('message', handleMessage);
//     return () => window.removeEventListener('message', handleMessage);
//   }, []);

//   // ============================================
//   // Core Communication Functions
//   // ============================================
//   const sendToNative = useCallback((type, payload = {}) => {
//     return new Promise((resolve, reject) => {
//       if (!isNative || !window.ReactNativeWebView) {
//         reject(new Error('Not running in React Native environment'));
//         return;
//       }

//       const requestId = `req_${++requestIdCounterRef.current}_${Date.now()}`;

//       // Store promise handlers
//       pendingRequestsRef.current.set(requestId, { resolve, reject });

//       // Set timeout for request
//       setTimeout(() => {
//         if (pendingRequestsRef.current.has(requestId)) {
//           pendingRequestsRef.current.delete(requestId);
//           reject(new Error(`Request timeout: ${type}`));
//         }
//       }, 30000);

//       // Send to native
//       window.ReactNativeWebView.postMessage(
//         JSON.stringify({ type, requestId, payload })
//       );
//     });
//   }, [isNative]);

//   const on = useCallback((type, handler) => {
//     if (!messageHandlersRef.current.has(type)) {
//       messageHandlersRef.current.set(type, new Set());
//     }
//     messageHandlersRef.current.get(type).add(handler);

//     // Return unsubscribe function
//     return () => {
//       const handlers = messageHandlersRef.current.get(type);
//       if (handlers) {
//         handlers.delete(handler);
//       }
//     };
//   }, []);

//   // ============================================
//   // Permission Management
//   // ============================================
//   const loadPermissionsFromBackend = useCallback(async (userId, deviceId) => {
//     try {
//       const authToken = localStorage.getItem('auth_token');
//       if (!authToken) return;

//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/devices/${userId}`, {
//         headers: { 'Authorization': `Bearer ${authToken}` }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         const devices = data.devices || [];
//         const currentDevice = devices.find(d => d.deviceId === deviceId);

//         if (currentDevice?.permissions) {
//           setPermissions(currentDevice.permissions);
//         }
//       }
//     } catch (error) {
//       console.error('Error loading permissions from backend:', error);
//     }
//   }, []);

//   const updatePermissionsInBackend = useCallback(async (userId, deviceId, permissionType, status) => {
//     try {
//       const authToken = localStorage.getItem('auth_token');
//       if (!authToken) return;

//       await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/devices/${userId}/${deviceId}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${authToken}`
//         },
//         body: JSON.stringify({
//           permissions: {
//             ...permissions,
//             [permissionType]: status
//           }
//         })
//       });
//     } catch (error) {
//       console.error('Error updating permissions in backend:', error);
//     }
//   }, [permissions]);

//   const requestPermission = useCallback(async (permissionType) => {
//     // Check if already granted
//     if (permissions[permissionType] === 'granted') {
//       return 'granted';
//     }

//     if (isNative) {
//       // Native permission request
//       try {
//         const result = await sendToNative('REQUEST_PERMISSION', { permissionType });

//         // Update local state
//         setPermissions(prev => ({
//           ...prev,
//           [permissionType]: result.status
//         }));

//         // Update backend
//         if (userIdRef.current && deviceIdRef.current) {
//           await updatePermissionsInBackend(
//             userIdRef.current,
//             deviceIdRef.current,
//             permissionType,
//             result.status
//           );
//         }

//         return result.status;
//       } catch (error) {
//         console.error(`Error requesting ${permissionType}:`, error);
//         return 'denied';
//       }
//     } else {
//       // Web permission request
//       if (permissionType === 'location') {
//         try {
//           const result = await navigator.permissions.query({ name: 'geolocation' });
//           if (result.state === 'granted' || result.state === 'prompt') {
//             return new Promise((resolve) => {
//               navigator.geolocation.getCurrentPosition(
//                 () => {
//                   setPermissions(prev => ({ ...prev, location: 'granted' }));
//                   resolve('granted');
//                 },
//                 () => {
//                   setPermissions(prev => ({ ...prev, location: 'denied' }));
//                   resolve('denied');
//                 }
//               );
//             });
//           }
//           return result.state;
//         } catch (error) {
//           console.error('Error requesting location permission:', error);
//           return 'denied';
//         }
//       } else if (permissionType === 'notification') {
//         try {
//           const permission = await Notification.requestPermission();
//           setPermissions(prev => ({ ...prev, notification: permission }));
//           return permission;
//         } catch (error) {
//           console.error('Error requesting notification permission:', error);
//           return 'denied';
//         }
//       }
//       return 'unsupported';
//     }
//   }, [isNative, sendToNative, permissions, updatePermissionsInBackend]);

//   const checkPermission = useCallback(async (permissionType) => {
//     if (isNative) {
//       try {
//         const result = await sendToNative('CHECK_PERMISSION', { permissionType });
//         setPermissions(prev => ({
//           ...prev,
//           [permissionType]: result.status
//         }));
//         return result.status;
//       } catch (error) {
//         return 'denied';
//       }
//     } else {
//       // Web permission check
//       if (permissionType === 'location') {
//         try {
//           const result = await navigator.permissions.query({ name: 'geolocation' });
//           return result.state;
//         } catch {
//           return 'prompt';
//         }
//       } else if (permissionType === 'notification') {
//         return Notification.permission;
//       }
//       return 'unsupported';
//     }
//   }, [isNative, sendToNative]);

//   // ============================================
//   // Service Initialization
//   // ============================================
//   const initializeNativeServices = useCallback(async (userId, frontendName, socketServerUrl) => {
//     if (!isNative) {
//       return { success: false, reason: 'not_native' };
//     }

//     if (servicesInitialized) {
//       return { success: true, reason: 'already_initialized' };
//     }

//     try {
//       const result = await sendToNative('INITIALIZE_SERVICES', {
//         userId,
//         frontendName,
//         socketServerUrl: socketServerUrl || process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL
//       });

//       // Store refs
//       userIdRef.current = userId;
//       deviceIdRef.current = result.deviceId;

//       setServicesInitialized(true);
//       setCurrentFrontend(frontendName);

//       // Load permissions from backend
//       await loadPermissionsFromBackend(userId, result.deviceId);

//       return { success: true, ...result };
//     } catch (error) {
//       console.error('Error initializing native services:', error);
//       return { success: false, error: error.message };
//     }
//   }, [isNative, servicesInitialized, sendToNative, loadPermissionsFromBackend]);

//   // ============================================
//   // Location Services
//   // ============================================
//   const getCurrentLocation = useCallback(async () => {
//     if (isNative) {
//         // callback-style wrapper
// function getCurrentLocationWithCallback(options = {}, timeout = 5000) {
//   return new Promise((resolve, reject) => {
//     let finished = false
//     const timer = setTimeout(() => {
//       if (!finished) {
//         finished = true
//         reject(new Error('GET_CURRENT_LOCATION timeout'))
//       }
//     }, timeout)

//     // assume sendToNative(method, payload, callback)
//     sendToNative('GET_CURRENT_LOCATION', options, (err, result) => {
//       if (finished) return
//       finished = true
//       clearTimeout(timer)
//       if (err) reject(err)
//       else resolve(result)
//     })
//   })
// }

// // usage
// try {
//   const loc = await getCurrentLocationWithCallback({})
//   alert('got location', loc)
// } catch (err) {
//   alert(err)
// }

//       return await sendToNative('GET_CURRENT_LOCATION', {});
//     } else {
//       return new Promise((resolve, reject) => {
//         if (!navigator.geolocation) {
//           reject(new Error('Geolocation not supported'));
//           return;
//         }

//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             resolve({
//               lat: position.coords.latitude,
//               lng: position.coords.longitude,
//               accuracy: position.coords.accuracy,
//               heading: position.coords.heading,
//               speed: position.coords.speed,
//               timestamp: position.timestamp
//             });
//           },
//           (error) => reject(error),
//           {
//             enableHighAccuracy: true,
//             timeout: 10000,
//             maximumAge: 0
//           }
//         );
//       });
//     }
//   }, [isNative, sendToNative]);

//   const startLocationTracking = useCallback(async (interval = 5000) => {
//     if (isNative) {
//       return sendToNative('START_LOCATION_TRACKING', { interval });
//     } else {
//       return new Promise((resolve, reject) => {
//         if (!navigator.geolocation) {
//           reject(new Error('Geolocation not supported'));
//           return;
//         }

//         const watchId = navigator.geolocation.watchPosition(
//           (position) => {
//             const handlers = messageHandlersRef.current.get('LOCATION_UPDATE');
//             if (handlers) {
//               const locationData = {
//                 lat: position.coords.latitude,
//                 lng: position.coords.longitude,
//                 accuracy: position.coords.accuracy,
//                 heading: position.coords.heading,
//                 speed: position.coords.speed,
//                 timestamp: position.timestamp
//               };
//               handlers.forEach(handler => handler(locationData));
//             }
//           },
//           (error) => console.error('Location tracking error:', error),
//           {
//             enableHighAccuracy: true,
//             timeout: 10000,
//             maximumAge: 0
//           }
//         );

//         resolve({ watchId });
//       });
//     }
//   }, [isNative, sendToNative]);

//   const stopLocationTracking = useCallback(async () => {
//     if (isNative) {
//       return sendToNative('STOP_LOCATION_TRACKING', {});
//     } else {
//       return Promise.resolve();
//     }
//   }, [isNative, sendToNative]);

//   // ============================================
//   // Notification Services
//   // ============================================
//   const showNotification = useCallback(async (notification) => {
//     if (isNative) {
//       return sendToNative('SHOW_NOTIFICATION', notification);
//     } else {
//       if ('Notification' in window && Notification.permission === 'granted') {
//         new Notification(notification.title, {
//           body: notification.body,
//           icon: notification.icon,
//           badge: notification.badge,
//           data: notification.data
//         });
//         return Promise.resolve({ shown: true });
//       }
//       return Promise.resolve({ shown: false, reason: 'permission_denied' });
//     }
//   }, [isNative, sendToNative]);

//   // ============================================
//   // Context Value
//   // ============================================
//   const value = {
//     isNative,
//     isChecking,
//     permissions,
//     deviceInfo,
//     servicesInitialized,
//     currentFrontend,
//     sendToNative,
//     on,
//     requestPermission,
//     initializeNativeServices,
//     getCurrentLocation,
//     startLocationTracking,
//     stopLocationTracking,
//     showNotification,
//     checkPermission
//   };

//   return (
//     <ReactNativeContext.Provider value={value}>
//       {children}
//     </ReactNativeContext.Provider>
//   );
// }

// export default ReactNativeWrapper;
'use client';
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const ReactNativeContext = createContext(null);

export const useReactNative = () => {
  const context = useContext(ReactNativeContext);
  if (!context) {
    throw new Error('useReactNative must be used within ReactNativeWrapper');
  }
  return context;
};

export function ReactNativeWrapper({ children }) {
  // State
  const [isNative, setIsNative] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [permissions, setPermissions] = useState({
    location: null,
    notification: null,
    drawOver: null
  });
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [currentFrontend, setCurrentFrontend] = useState(null);

  // Refs
  const checkTimeoutRef = useRef(null);
  const messageHandlersRef = useRef(new Map());
  const pendingRequestsRef = useRef(new Map());
  const requestIdCounterRef = useRef(0);
  const deviceIdRef = useRef(null);
  const userIdRef = useRef(null);

  // ============================================
  // Native Environment Detection
  // ============================================
  useEffect(() => {
    let checkCount = 0;
    const maxChecks = 180; // 3 minutes at 1 second intervals

    const checkNativeEnvironment = () => {
      const isRNWebView = typeof window !== 'undefined' && !!window.ReactNativeWebView;

      if (isRNWebView) {
        setIsNative(true);
        setIsChecking(false);
        if (checkTimeoutRef.current) {
          clearInterval(checkTimeoutRef.current);
          checkTimeoutRef.current = null;
        }
        detectCurrentFrontend();
      } else {
        checkCount++;
        if (checkCount >= maxChecks) {
          setIsNative(false);
          setIsChecking(false);
          if (checkTimeoutRef.current) {
            clearInterval(checkTimeoutRef.current);
            checkTimeoutRef.current = null;
          }
        }
      }
    };

    // Initial check
    checkNativeEnvironment();

    // Continue checking if not found yet
    if (!isNative && isChecking) {
      checkTimeoutRef.current = setInterval(checkNativeEnvironment, 1000);
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearInterval(checkTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // Frontend Detection
  // ============================================
  const detectCurrentFrontend = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    const frontendMap = [
      { test: () => hostname.includes('driver.') || pathname.includes('/driver'), name: 'driver' },
      { test: () => hostname.includes('book.') || hostname.includes('rider.') || pathname.includes('/rider'), name: 'rider' },
      { test: () => hostname.includes('conductor.') || pathname.includes('/conductor'), name: 'conductor' },
      { test: () => hostname.includes('delivery.') || pathname.includes('/delivery'), name: 'delivery' },
      { test: () => hostname.includes('admin.') || pathname.includes('/admin'), name: 'admin' },
    ];

    const detected = frontendMap.find(f => f.test());
    const frontendName = detected ? detected.name : 'landing';
    
    setCurrentFrontend(frontendName);
    return frontendName;
  }, []);

  // Listen for URL changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isNative) return;

    const urlCheckInterval = setInterval(() => {
      detectCurrentFrontend();
    }, 1000);

    return () => clearInterval(urlCheckInterval);
  }, [isNative, detectCurrentFrontend]);

  // ============================================
  // Message Handling
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const { type, requestId, payload, error } = data;

        console.log('[ReactNativeWrapper] Received message:', { type, requestId, hasPayload: !!payload, hasError: !!error });

        // Handle pending request responses
        if (requestId && pendingRequestsRef.current.has(requestId)) {
          console.log('[ReactNativeWrapper] Resolving pending request:', requestId);
          const { resolve, reject } = pendingRequestsRef.current.get(requestId);
          pendingRequestsRef.current.delete(requestId);

          if (error) {
            console.error('[ReactNativeWrapper] Request failed:', error);
            reject(new Error(error));
          } else {
            console.log('[ReactNativeWrapper] Request succeeded with payload:', payload);
            resolve(payload);
          }
          return;
        }

        // Handle event-based messages
        const handlers = messageHandlersRef.current.get(type);
        if (handlers) {
          handlers.forEach(handler => handler(payload));
        }

        // Handle specific message types
        switch (type) {
          case 'PERMISSION_RESULT':
            setPermissions(prev => ({
              ...prev,
              [payload.permissionType]: payload.status
            }));
            break;
          case 'DEVICE_INFO':
            setDeviceInfo(payload);
            break;
          case 'LOCATION_UPDATE':
            // Handled by registered handlers
            break;
          default:
            // Silent - only log in development
            if (process.env.NODE_ENV === 'development') {
              console.log('[ReactNativeWrapper] Unhandled message type:', type);
            }
            break;
        }
      } catch (error) {
        console.error('[ReactNativeWrapper] Error handling message from native:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage); // For Android

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage);
    };
  }, []);

  // ============================================
  // Core Communication Functions
  // ============================================
  const sendToNative = useCallback((type, payload = {}) => {
    return new Promise((resolve, reject) => {
      if (!isNative || !window.ReactNativeWebView) {
        reject(new Error('Not running in React Native environment'));
        return;
      }

      const requestId = `req_${++requestIdCounterRef.current}_${Date.now()}`;

      console.log('[ReactNativeWrapper] Sending to native:', { type, requestId, payload });

      // Store promise handlers
      pendingRequestsRef.current.set(requestId, { resolve, reject });

      // Set timeout for request (increased to 10 seconds for location)
      const timeoutDuration = type === 'GET_CURRENT_LOCATION' ? 10000 : 30000;
      const timeoutId = setTimeout(() => {
        if (pendingRequestsRef.current.has(requestId)) {
          pendingRequestsRef.current.delete(requestId);
          console.error('[ReactNativeWrapper] Request timeout:', { type, requestId });
          reject(new Error(`Request timeout: ${type}`));
        }
      }, timeoutDuration);

      // Store timeout ID so we can clear it if response comes
      pendingRequestsRef.current.get(requestId).timeoutId = timeoutId;

      // Send to native
      try {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type, requestId, payload })
        );
        console.log('[ReactNativeWrapper] Message sent to native successfully');
      } catch (error) {
        console.error('[ReactNativeWrapper] Error sending message to native:', error);
        pendingRequestsRef.current.delete(requestId);
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }, [isNative]);

  const on = useCallback((type, handler) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, new Set());
    }
    messageHandlersRef.current.get(type).add(handler);

    // Return unsubscribe function
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
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const devices = data.devices || [];
        const currentDevice = devices.find(d => d.deviceId === deviceId);

        if (currentDevice?.permissions) {
          setPermissions(currentDevice.permissions);
        }
      }
    } catch (error) {
      console.error('Error loading permissions from backend:', error);
    }
  }, []);

  const updatePermissionsInBackend = useCallback(async (userId, deviceId, permissionType, status) => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${userId}/${deviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          permissions: {
            ...permissions,
            [permissionType]: status
          }
        })
      });
    } catch (error) {
      console.error('Error updating permissions in backend:', error);
    }
  }, [permissions]);

  const requestPermission = useCallback(async (permissionType) => {
    // Check if already granted
    if (permissions[permissionType] === 'granted') {
      return 'granted';
    }

    if (isNative) {
      // Native permission request
      try {
        const result = await sendToNative('REQUEST_PERMISSION', { permissionType });

        // Update local state
        setPermissions(prev => ({
          ...prev,
          [permissionType]: result.status
        }));

        // Update backend
        if (userIdRef.current && deviceIdRef.current) {
          await updatePermissionsInBackend(
            userIdRef.current,
            deviceIdRef.current,
            permissionType,
            result.status
          );
        }

        return result.status;
      } catch (error) {
        console.error(`Error requesting ${permissionType}:`, error);
        return 'denied';
      }
    } else {
      // Web permission request
      if (permissionType === 'location') {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          if (result.state === 'granted' || result.state === 'prompt') {
            return new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(
                () => {
                  setPermissions(prev => ({ ...prev, location: 'granted' }));
                  resolve('granted');
                },
                () => {
                  setPermissions(prev => ({ ...prev, location: 'denied' }));
                  resolve('denied');
                }
              );
            });
          }
          return result.state;
        } catch (error) {
          console.error('Error requesting location permission:', error);
          return 'denied';
        }
      } else if (permissionType === 'notification') {
        try {
          const permission = await Notification.requestPermission();
          setPermissions(prev => ({ ...prev, notification: permission }));
          return permission;
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          return 'denied';
        }
      }
      return 'unsupported';
    }
  }, [isNative, sendToNative, permissions, updatePermissionsInBackend]);

  const checkPermission = useCallback(async (permissionType) => {
    if (isNative) {
      try {
        const result = await sendToNative('CHECK_PERMISSION', { permissionType });
        setPermissions(prev => ({
          ...prev,
          [permissionType]: result.status
        }));
        return result.status;
      } catch (error) {
        return 'denied';
      }
    } else {
      // Web permission check
      if (permissionType === 'location') {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          return result.state;
        } catch {
          return 'prompt';
        }
      } else if (permissionType === 'notification') {
        return Notification.permission;
      }
      return 'unsupported';
    }
  }, [isNative, sendToNative]);

  // ============================================
  // Service Initialization
  // ============================================
  const initializeNativeServices = useCallback(async (userId, frontendName, socketServerUrl) => {
    if (!isNative) {
      return { success: false, reason: 'not_native' };
    }

    if (servicesInitialized) {
      return { success: true, reason: 'already_initialized' };
    }

    try {
      const result = await sendToNative('INITIALIZE_SERVICES', {
        userId,
        frontendName,
        socketServerUrl: socketServerUrl || process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL
      });

      // Store refs
      userIdRef.current = userId;
      deviceIdRef.current = result.deviceId;

      setServicesInitialized(true);
      setCurrentFrontend(frontendName);

      // Load permissions from backend
      await loadPermissionsFromBackend(userId, result.deviceId);

      return { success: true, ...result };
    } catch (error) {
      console.error('Error initializing native services:', error);
      return { success: false, error: error.message };
    }
  }, [isNative, servicesInitialized, sendToNative, loadPermissionsFromBackend]);

  // ============================================
  // Location Services
  // ============================================
  const getCurrentLocation = useCallback(async () => {
    console.log('[ReactNativeWrapper] getCurrentLocation called, isNative:', isNative);
    if (isNative) {
      try {
        const location = await sendToNative('GET_CURRENT_LOCATION', {});
        const locationData = {
            lat: location?.coords?.latitude,
            lng: location?.coords?.longitude,
            accuracy: location?.coords?.accuracy,
            heading: location?.coords?.heading,
            speed: location?.coords?.speed,
            timestamp: location?.timestamp,
        }
        sendToNative('LOG_DATA', {info: 'structured location data',locationData})
        sendToNative('LOG_DATA', location)
       
        return locationData;
      } catch (error) {
        sendToNative('LOG_DATA', {msg:'error obtaining current location',error})
        throw error;
      }
    } else {
      // Web fallback
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp
            });
          },
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
    }
  }, [isNative, sendToNative]);

  const startLocationTracking = useCallback(async (interval = 5000) => {
    if (isNative) {
      return sendToNative('START_LOCATION_TRACKING', { interval });
    } else {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const handlers = messageHandlersRef.current.get('LOCATION_UPDATE');
            if (handlers) {
              const locationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp
              };
              handlers.forEach(handler => handler(locationData));
            }
          },
          (error) => console.error('Location tracking error:', error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );

        resolve({ watchId });
      });
    }
  }, [isNative, sendToNative]);

  const stopLocationTracking = useCallback(async () => {
    if (isNative) {
      return sendToNative('STOP_LOCATION_TRACKING', {});
    } else {
      return Promise.resolve();
    }
  }, [isNative, sendToNative]);

  // ============================================
  // Notification Services
  // ============================================
  const showNotification = useCallback(async (notification) => {
    if (isNative) {
      return sendToNative('SHOW_NOTIFICATION', notification);
    } else {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon,
          badge: notification.badge,
          data: notification.data
        });
        return Promise.resolve({ shown: true });
      }
      return Promise.resolve({ shown: false, reason: 'permission_denied' });
    }
  }, [isNative, sendToNative]);

  // ============================================
  // Context Value
  // ============================================
  const value = {
    isNative,
    isChecking,
    permissions,
    deviceInfo,
    servicesInitialized,
    currentFrontend,
    sendToNative,
    on,
    requestPermission,
    initializeNativeServices,
    getCurrentLocation,
    startLocationTracking,
    stopLocationTracking,
    showNotification,
    checkPermission
  };

  return (
    <ReactNativeContext.Provider value={value}>
      {children}
    </ReactNativeContext.Provider>
  );
}

export default ReactNativeWrapper;