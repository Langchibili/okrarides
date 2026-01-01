// ============================================
// src/api/ride/routes/index.ts
// ============================================

import defaultRoutes from './ride';
import customRoutes from './custom-routes';

export default {
  routes: [
    ...defaultRoutes.routes,
    ...customRoutes.routes,
  ],
};