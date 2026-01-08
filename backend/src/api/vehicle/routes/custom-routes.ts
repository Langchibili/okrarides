//============================================
// src/api/vehicle/routes/vehicle.ts
//============================================
export default {
  routes: [
    {
      method: 'GET',
      path: '/users/vehicle',
      handler: 'vehicle.findOwn',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/driver/vehicle',
      handler: 'vehicle.findDriverVehicle',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/driver/vehicles',
      handler: 'vehicle.findDriverVehicles',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/driver/vehicles',
      handler: 'vehicle.addVehicle',
      config: { policies: [] }
    },
    {
      method: 'PUT',
      path: '/driver/vehicles/assigned-vehicle',
      handler: 'vehicle.updateDriverVehicle',
      config: { policies: [] }
    },
  ]
};