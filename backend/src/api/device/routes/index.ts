// ============================================
// src/api/device/routes/index.ts
// ============================================

import defaultRoutes from './device';
import customRoutes from './custom-routes';

export default {
  routes: [
     ...customRoutes.routes,
    ...defaultRoutes.routes
  ],
};