export default {
  routes: [
    {
      method: 'POST',
      path: '/reverse-geocode',
      handler: 'reverse-geocode.reverseGeocode',
      config: {
        policies: [],
        middlewares: [],
      },
    }
 ]
}