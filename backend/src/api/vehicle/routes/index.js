// ============================================
// src/api/vehicle/routes/index.ts
// ============================================

import defaultRoutes from './vehicle';
import customRoutes from './custom-routes';

export default {
  routes: [
    ...defaultRoutes.routes,
    ...customRoutes.routes,
  ],
};