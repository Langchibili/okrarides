// ============================================
// src/api/ride/supportTicket/index.ts
// ============================================

import defaultRoutes from './support-ticket';
import customRoutes from './custom-routes';

export default {
  routes: [
    ...defaultRoutes.routes,
    ...customRoutes.routes,
  ],
};