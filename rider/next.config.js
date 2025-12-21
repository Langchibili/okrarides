// // rider/next.config.js
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
//   runtimeCaching: [
//     {
//       urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
//       handler: 'CacheFirst',
//       options: {
//         cacheName: 'google-fonts-webfonts',
//         expiration: {
//           maxEntries: 4,
//           maxAgeSeconds: 365 * 24 * 60 * 60,
//         },
//       },
//     },
//     {
//       urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
//       handler: 'StaleWhileRevalidate',
//       options: {
//         cacheName: 'google-fonts-stylesheets',
//         expiration: {
//           maxEntries: 4,
//           maxAgeSeconds: 7 * 24 * 60 * 60,
//         },
//       },
//     },
//     {
//       urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
//       handler: 'StaleWhileRevalidate',
//       options: {
//         cacheName: 'static-image-assets',
//         expiration: {
//           maxEntries: 64,
//           maxAgeSeconds: 24 * 60 * 60,
//         },
//       },
//     },
//     {
//       urlPattern: /\.(?:js)$/i,
//       handler: 'StaleWhileRevalidate',
//       options: {
//         cacheName: 'static-js-assets',
//         expiration: {
//           maxEntries: 32,
//           maxAgeSeconds: 24 * 60 * 60,
//         },
//       },
//     },
//     {
//       urlPattern: /\.(?:css)$/i,
//       handler: 'StaleWhileRevalidate',
//       options: {
//         cacheName: 'static-style-assets',
//         expiration: {
//           maxEntries: 32,
//           maxAgeSeconds: 24 * 60 * 60,
//         },
//       },
//     },
//     {
//       urlPattern: /\/api\/.*$/i,
//       handler: 'NetworkFirst',
//       method: 'GET',
//       options: {
//         cacheName: 'apis',
//         expiration: {
//           maxEntries: 16,
//           maxAgeSeconds: 24 * 60 * 60,
//         },
//         networkTimeoutSeconds: 10,
//       },
//     },
//   ],
// });

// module.exports = withPWA({
//   reactStrictMode: true,
//   swcMinify: true,
  
//   // Image optimization
//   images: {
//     domains: ['localhost', 'your-cdn-domain.com'],
//     formats: ['image/avif', 'image/webp'],
//   },
  
//   // Compiler options
//   compiler: {
//     removeConsole: process.env.NODE_ENV === 'production',
//   },
  
//   // Experimental features
//   experimental: {
//     optimizeCss: true,
//     optimizePackageImports: ['@mui/material', '@mui/icons-material'],
//   },
// })

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
    domains: ['localhost', 'your-cdn-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
});