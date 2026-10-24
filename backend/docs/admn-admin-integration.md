# `admn` native Admin API

The local `admn` server plugin exposes authenticated Strapi Admin routes under
`/admn`. It uses the native Strapi Admin identity (`admin::user`) and
Admin JWT, not the Users & Permissions `adminType` field. It does not create
roles, change role permissions, send invitations, or send verification email.
The plugin's server entry is `src/plugins/admn/strapi-server.js`; its
TypeScript implementation is compiled into `dist/src/plugins/admn` by the
backend build. Keep that build output current before starting/redeploying the
backend.

## Manual role setup

1. Sign in to Strapi's Admin panel as a native Super Admin.
2. Open **Settings → Administration Panel → Roles** and edit the intended
   native role. Do not use the app's `plugin::users-permissions.role`.
3. In the `admn` plugin permissions, grant only the action IDs listed below.
   Save each role; there is no startup permission seeding or automatic grant.
4. Use the native `strapi-super-admin` role for `/admin-users`. The API's
   controller also verifies that role, even if a different role is granted an
   action accidentally.

Each category has two native Admin permission actions:

| Category | View action | Manage action |
| --- | --- | --- |
| Panel identity | `plugin::admn.me.view` | `plugin::admn.me.manage` |
| Admin users | `plugin::admn.admin-users.view` | `plugin::admn.admin-users.manage` |
| Dashboard statistics | `plugin::admn.dashboard.view` | `plugin::admn.dashboard.manage` |
| Users | `plugin::admn.users.view` | `plugin::admn.users.manage` |
| Partners | `plugin::admn.partners.view` | `plugin::admn.partners.manage` |
| Drivers | `plugin::admn.drivers.view` | `plugin::admn.drivers.manage` |
| Riders | `plugin::admn.riders.view` | `plugin::admn.riders.manage` |
| Rides | `plugin::admn.rides.view` | `plugin::admn.rides.manage` |
| Deliveries | `plugin::admn.deliveries.view` | `plugin::admn.deliveries.manage` |
| Vehicles | `plugin::admn.vehicles.view` | `plugin::admn.vehicles.manage` |
| Countries | `plugin::admn.countries.view` | `plugin::admn.countries.manage` |
| Currencies | `plugin::admn.currencies.view` | `plugin::admn.currencies.manage` |
| Finance | `plugin::admn.finance.view` | `plugin::admn.finance.manage` |
| Affiliates | `plugin::admn.affiliates.view` | `plugin::admn.affiliates.manage` |
| Global settings | `plugin::admn.settings.view` | `plugin::admn.settings.manage` |

Suggested grant policy (assign explicitly in the native role manager):

* **Super Admin:** Strapi's native `strapi-super-admin` role retains its
  built-in all-actions ability. Strapi's own Admin bootstrap synchronizes its
  permissions to registered actions; this plugin does not assign permissions.
* **Admin:** grant only the desired view/manage categories, commonly partners,
  drivers, riders, rides, deliveries, vehicles, finance, currencies, countries,
  affiliates, and global settings. Grant `dashboard.view` only to roles allowed
  to see aggregate financial and operational statistics. Admin-user endpoints
  remain Super Admin-only.
* **Editor:** grant both view and manage for drivers, riders, and deliveries.
  Do not grant partner, country, currency, admin-user, or global-settings
  management or dashboard statistics unless policy changes.
* **Author:** grant view actions for drivers, riders, rides, and deliveries,
  plus only other specifically approved read scopes. Do not grant dashboard
  statistics by default.
* **Custom roles:** grant exactly the action IDs needed for that role.

The `/me` endpoint needs `plugin::admn.me.view`. The country projections used by
driver/rider registration additionally require `drivers.manage` or
`riders.manage`; they do not grant country management. Dynamic generic resource
routes enforce their mapped category's view/manage action in both route policy
and controller. User profile filters and updates are attributed to the matching
driver, rider, affiliate, or general-user category.

Admin-user creation uses Strapi's native Admin user service. Its generated
registration token is immediately cleared; the dashboard never returns it,
logs it, sends it, or offers a token/invitation endpoint. Country field editing
is separate from the global `admn-setting` resource and excludes identity,
private, relation/media (except explicitly supported global settings), and
secret fields including `overideOtpCode`.

## Login and route troubleshooting

1. Sign in through Strapi's native Admin API: `POST /admin/login` with
   `{ "email": "...", "password": "..." }`. Use the returned native Admin
   `data.token` as `Authorization: Bearer <token>`; do not use a rider/driver
   Users & Permissions JWT or `SERVERJWTTOKEN`.
2. Call `GET /admn/me` with that Bearer token. A loaded route returns JSON
   shaped as `{ "data": { "id": ..., "roles": [...], "permissions": [...],
   "isSuperAdmin": ... } }`.
3. If `/admn/me` returns the Admin HTML shell with HTTP 200, the running
   process has not registered the plugin route. Confirm it is running this
   backend checkout, run `npm run build`, then restart/redeploy that backend
   process normally. The build does not hot-register plugin routes into an
   already-running Strapi process. Do not troubleshoot this response as a
   permission failure; authorization failures are JSON 401/403 responses.
4. Check startup output for plugin resolution/entry errors. The plugin is
   declared as `admn` in `config/plugins.ts`, includes its local plugin
   `package.json`, and its JS entry loads the compiled server implementation.
   After build, verify `dist/src/plugins/admn/server/index.js` exists. Plugin
   paths use `/admn` (plugin name prefix) + the route path; native login and
   roles APIs remain under `/admin`.
5. If `/me` is JSON but a resource returns 403, grant that exact
   `plugin::admn.<category>.view` or `.manage` action in the native Admin role
   manager; panel login alone does not grant resource access.

## Current generic resource allowlist

The controller maps only `users`, `countries`, `currencies`, `rides`,
`deliveries`, `vehicles`, `transactions`, `affiliates`, `admn-setting`,
`geofence-zones`, `subscription-plans`, `affiliate-points-conversions`,
`affiliate-points-allocation-rules`, and `affiliate-promotions`. The mapping is
deliberately not an arbitrary UID/query proxy. Add a resource only after adding
its category, field/filter/populate allowlists, route permission checks, and
response sanitization here and in `server/resources.ts`.
