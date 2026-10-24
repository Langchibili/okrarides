import controller from './controllers/admn';
import adminRoutes from './routes/admin';
import { permissionActions } from './resources';

export default {
  async register({ strapi }: { strapi: any }) {
    await strapi.admin.services.permission.actionProvider.registerMany(permissionActions);
  },
  controllers: { admn: controller },
  routes: { admin: adminRoutes },
};
