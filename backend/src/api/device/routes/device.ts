// src/api/device/routes/custom-routes.ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/devices/:id',
      handler: 'device.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/devices',
      handler: 'device.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    
    {
      method: 'POST',
      path: '/devices',
      handler: 'device.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/devices/:id',
      handler: 'device.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/devices/:id',
      handler: 'device.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/devices/register',
      handler: 'device.registerDevices',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/devices/updatecurrentloc',
      handler: 'device.updateUserCurrentLocation',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/devices/:userId/:deviceId',
      handler: 'device.updateDevice',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/devices/user/:userId',
      handler: 'device.getUserDevices',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/devices/activeride/:deviceId',
      handler: 'device.getActiveRideByDevice',
      config: {
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'POST',
      path: '/devices/acceptride/:deviceId',
      handler: 'device.acceptRideByDevice',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/devices/:userId/:deviceId',
      handler: 'device.removeDevice',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/device/:deviceId/permissions',
      handler: 'device.checkDevicePermissions',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};