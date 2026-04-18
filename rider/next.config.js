const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable font optimization to avoid timeout
  optimizeFonts: false,
  
  images: {
    domains: ['localhost', 'driver.okrarides.com','172.31.156.23'],
    formats: ['image/avif', 'image/webp'],
  },
  allowedDevOrigins: [process.env.NEXT_PUBLIC_RIDER_APP_URL],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  turbopack: {}
});