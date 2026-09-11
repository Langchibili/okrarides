export default  {
    routes: [ {
      method: 'GET',
      path: '/vehicles/owner',
      handler: 'vehicle.findOwn',
      config: { policies: [] }
    }]
}