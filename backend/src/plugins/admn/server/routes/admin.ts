import { resources } from '../resources';

const authPolicies = ['admin::isAuthenticatedAdmin'];
const gate = (actionId: string) => [
  ...authPolicies,
  { name: 'admin::hasPermissions', config: { actions: [actionId] } },
];

const routes: any[] = [
  { method: 'GET', path: '/me', handler: 'admn.me', config: { policies: gate('plugin::admn.me.view') } },
  { method: 'GET', path: '/platform-stat', handler: 'admn.platformStats', config: { policies: gate('plugin::admn.dashboard.view') } },
  { method: 'GET', path: '/resource-fields/:resource', handler: 'admn.resourceFields', config: { policies: authPolicies } },
  { method: 'PUT', path: '/admn-setting', handler: 'admn.updateSingleSetting', config: { policies: gate('plugin::admn.settings.manage') } },
  { method: 'GET', path: '/admin-users', handler: 'admn.listAdminUsers', config: { policies: gate('plugin::admn.admin-users.view') } },
  { method: 'POST', path: '/admin-users', handler: 'admn.createAdminUser', config: { policies: gate('plugin::admn.admin-users.manage') } },
  { method: 'PUT', path: '/admin-users/:id', handler: 'admn.updateAdminUser', config: { policies: gate('plugin::admn.admin-users.manage') } },
  { method: 'GET', path: '/country-options', handler: 'admn.countryOptions', config: { policies: authPolicies } },
  { method: 'GET', path: '/otp-verifications', handler: 'admn.otpVerifications', config: { policies: authPolicies } },
  { method: 'GET', path: '/drivers/countries', handler: 'admn.driverCountries', config: { policies: gate('plugin::admn.drivers.manage') } },
  { method: 'GET', path: '/drivers/partners', handler: 'admn.driverPartners', config: { policies: gate('plugin::admn.drivers.manage') } },
  { method: 'GET', path: '/drivers/vehicles', handler: 'admn.driverVehicles', config: { policies: gate('plugin::admn.drivers.manage') } },
  { method: 'GET', path: '/drivers/requirements', handler: 'admn.driverRequirements', config: { policies: gate('plugin::admn.drivers.manage') } },
  { method: 'POST', path: '/drivers/register', handler: 'admn.registerDriver', config: { policies: gate('plugin::admn.drivers.manage') } },
  { method: 'PUT', path: '/drivers/:id', handler: 'admn.updateDriver', config: { policies: gate('plugin::admn.drivers.manage') } },
  { method: 'POST', path: '/drivers/:id/float', handler: 'admn.addDriverFloat', config: { policies: gate('plugin::admn.drivers.manage') } },
  { method: 'POST', path: '/drivers/:id/documents', handler: 'admn.uploadDriverDocument', config: { policies: gate('plugin::admn.drivers.manage') } },
  { method: 'GET', path: '/riders/countries', handler: 'admn.riderCountries', config: { policies: gate('plugin::admn.riders.manage') } },
  { method: 'POST', path: '/riders/register', handler: 'admn.registerRider', config: { policies: gate('plugin::admn.riders.manage') } },
  { method: 'GET', path: '/countries/:id/settings', handler: 'admn.getCountrySettings', config: { policies: gate('plugin::admn.countries.view') } },
  { method: 'PUT', path: '/countries/:id/settings', handler: 'admn.updateCountrySettings', config: { policies: gate('plugin::admn.countries.manage') } },
  { method: 'GET', path: '/partners', handler: 'admn.listPartners', config: { policies: gate('plugin::admn.partners.view') } },
  { method: 'PUT', path: '/partners/:id/status', handler: 'admn.updatePartnerStatus', config: { policies: gate('plugin::admn.partners.manage') } },
];

for (const [resource, definition] of Object.entries(resources)) {
  const view = `plugin::admn.${definition.category}.view`;
  const manage = `plugin::admn.${definition.category}.manage`;
  // `/users` is shared by user, driver, rider, and affiliate pages; its
  // controller derives the real category from profile filters/update shape.
  const routePolicies = resource === 'users' ? authPolicies : null;
  routes.push(
    { method: 'GET', path: `/${resource}`, handler: 'admn.listResource', config: { policies: routePolicies ?? gate(view) } },
    { method: 'GET', path: `/${resource}/:id`, handler: 'admn.getResource', config: { policies: routePolicies ?? gate(view) } },
    { method: 'POST', path: `/${resource}`, handler: 'admn.createResource', config: { policies: routePolicies ?? gate(manage) } },
    { method: 'PUT', path: `/${resource}/:id`, handler: 'admn.updateResource', config: { policies: routePolicies ?? gate(manage) } },
    { method: 'DELETE', path: `/${resource}/:id`, handler: 'admn.deleteResource', config: { policies: routePolicies ?? gate(manage) } },
  );
}

export default { type: 'admin', routes };
