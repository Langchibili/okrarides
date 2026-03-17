// ============================================
// src/api/delivery/routes/index.ts
// ============================================

import defaultRoutes from './delivery';
import customRoutes  from './custom-routes';
 
export default {
  routes: [...defaultRoutes.routes, ...customRoutes.routes]
}