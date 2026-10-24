# OkraRides Admin Panel — Implementation Plan and Design

## Purpose and scope

This approved plan describes the OkraRides admin experience in the `admin`
app, following the partner app's visual language and operational workflows.
It covers the admin frontend and the Strapi backend management API, whose API
namespace and controller are named `admn` (not `admin`).

## Partner app as the implementation baseline

The partner dashboard is the canonical reference for the admin dashboard's
visual design and user experience. Do not merely approximate its appearance:
inspect and reuse its existing layout, color palette, responsive behavior,
navigation patterns, shared UI components, and operational flows wherever
practical. Adapt the admin app in place so its pages feel like the partner
dashboard, including its page structure and interaction patterns.

The same principle applies to workflows. Admin driver creation should reuse
the partner's staged onboarding flow (account, profile, verification,
documents, vehicle, and submission) while applying admin authorization rather
than partner ownership. Rider creation remains the specifically requested
minimal phone-and-country flow.

The admin app's `dev` and production `start` scripts use port `3009`, matching
the requested port. This is also the partner app's configured port, so the two
apps cannot both bind that port at the same time; implementation and
verification must respect the user's no-development-server instruction.

## Identity, role, and authorization design

Strapi Admin users and Users & Permissions users are different identity
systems. The current ordinary-user `adminType` field must not be treated as
equivalent to Strapi Admin roles.

The implementation will:

1. Use Strapi's native Admin identity and role model for people who administer
   this dashboard. A user created through the admin frontend must be a genuine
   Strapi Admin user with a real Strapi Admin role, not only a
   `plugin::users-permissions.user` record marked as an admin.
2. Add a server-side `admn` API/controller/service for the dashboard's
   management operations. It will use supported Strapi Admin services and
   authorization checks; it will not expose passwords, internal credentials,
   or unrestricted direct database access to the browser.
3. Read the role and permissions from the backend as the source of truth.
   Built-in and backend-created custom roles must remain identifiable and
   usable by the UI with their actual permissions. The frontend must not rely
   on a hard-coded role enumeration or a UI-only permission check.
4. Enforce access on the backend for every protected operation as well as
   hiding/disabling unauthorized frontend navigation and actions. A hidden
   menu item is not an authorization boundary.
5. Confirm the supported Strapi 5.46.1 Admin user/role service and
   authentication flows before implementing user creation or login. Strapi
   Admin accounts are not automatically equivalent to phone-authenticated
   rider/driver accounts; the account identifier and sign-in behavior for
   staff must follow the native Admin identity constraints.

### Requested access baseline

| Role | Admin users and roles | Partners | Drivers, riders, deliveries, rides | Countries, currencies, `admn` settings |
|---|---|---|---|---|
| Super Admin | Full access; may create/manage admin users and assign roles | Full access | Full access | Full access |
| Admin | No admin-user creation unless the backend role explicitly grants it | Manage | Manage | Manage |
| Editor | No access | No access | Manage | No access |
| Author | No access | No access | View only | No access |
| Backend-created custom role | Determined by its actual backend permissions | Permission-driven | Permission-driven | Permission-driven |

This is the minimum requested baseline. The final permission matrix will map
the operations exposed by the actual dashboard and backend, including
view/list, view detail, create, update, delete, approve/block, and any
administrative actions that need separate grants. Strapi's native Super Admin
privilege remains distinct from the application-level Admin role.

## Frontend work

1. **Reuse the partner dashboard UI directly.** Treat the partner app's
   existing layout, colors, responsive behavior, navigation, components, and
   interaction patterns as the source of truth. Reuse or extract shared
   components where the architecture allows; do not create a visually
   separate admin design system. Apply that same shell and responsive design
   consistently to all admin dashboard pages.
2. **Use backend permissions throughout the UI.** Load the current Admin
   identity and its backend role/permissions, filter navigation accordingly,
   and gate page actions consistently. Route users without dashboard access to
   their first permitted operational resource. Show clear access-denied and
   request-failure states.
3. **Admin-user and role management.** Permit only authorized Super Admins to
   create and manage Strapi Admin users. Populate role choices from the
   backend, preserve custom role identity and grants, and prevent a client
   request from elevating its own privileges.
4. **Partner administration.** Add/retain partner listing, details, review,
   status, and management actions for roles granted partner access. Preserve
   the existing distinction whereby a partner's username may be a word.
5. **Driver creation.** Adapt the partner's staged onboarding experience
   rather than replacing it with a bare generic user form. Preserve the
   supported account, profile, required document, vehicle, and submission
   steps, including country-dependent requirements and validation.
6. **Rider creation.** Provide the minimal flow requested: phone number and
   country. The backend will create or initialize the rider's existing
   Users & Permissions account/profile in the same way used by the rest of the
   platform, enforce phone uniqueness, and leave the rider able to book rides.
   Driver and rider app accounts use phone-based usernames/identifiers as
   required by the existing account conventions; they are not Strapi Admin
   identities.
7. **Operations and settings.** Provide permission-gated administration for
   drivers, riders, deliveries/rides, partners, countries, currencies, and
   `admn-setting`. Country-specific configuration and global admin settings
   will be presented as separate scopes so changes are not applied to the
   wrong configuration record.
8. **Account activation and invitations.** Follow Strapi's supported
   authentication and account-lifecycle behavior for genuine Strapi Admin
   users. Authorized Super Admins can create and activate accounts without
   requiring the new user to complete an email-verification step first.
   Sending an invitation or verification email is an explicit, optional
   action—not an automatic side effect of account creation.

   Verification, invitation, reset, and authentication tokens are bearer
   credentials. Never persist them in readable admin-panel state or display
   them for another admin to copy/use. If the native Strapi flow requires a
   token to complete an optional invitation or verification, preserve the
   supported one-time flow and deliver it through its intended secure channel;
   account activation is handled through authorized backend state changes,
   not by exposing a token.

## Backend work (`backend`)

1. Add the `admn` API/controller/routes/services using the repository's
   existing Strapi conventions, with explicit server-side authentication,
   role/permission checks, input validation, and clear error responses.
2. Integrate dashboard actions with the existing profile system
   (`riderProfile`, `driverProfile`, delivery profiles, and related records)
   rather than creating an incompatible second representation of people.
3. Reuse or extract the partner driver's established domain workflow where
   possible, while removing partner-only ownership assumptions for authorized
   admins. Keep the partner API's existing authorization and behavior intact.
4. Implement the rider path around the existing user-creation/profile
   initialization behavior and country relationship. Require phone and
   country; validate duplicates and preserve the platform's existing
   confirmation, role, and profile conventions.
5. Ensure country records and `admn-setting` are separate permission-checked
   management surfaces. Do not infer country settings from global settings or
   silently fall back when a requested country is invalid.
6. Define how native Strapi Admin roles and custom roles are queried and
   assigned through supported services. Do not make the editable
   `admn-user-permission` catalog the authority for Strapi Admin roles unless
   the implementation proves and documents a safe synchronization strategy.
7. Implement account activation and optional invitation/verification sending
   through supported Strapi Admin services. Do not save verification,
   invitation, or login tokens in the dashboard or return them to the browser
   for display.
8. Add focused backend tests for role enforcement, forbidden operations,
   profile creation, phone uniqueness, country selection, and role assignment
   where the current project test setup allows.

## Validation and delivery

- Confirm role/access behavior on the backend, not only by checking which
  frontend links appear.
- Verify creation produces a genuine Strapi Admin user with the selected
  native role, and separately verify driver/rider creation produces the
  expected Users & Permissions account and profile.
- Exercise the access baseline above, including the editor restrictions on
  partners, countries, currencies, and admin settings, and the author
  view-only restriction.
- Build the admin frontend and backend using their existing build commands;
  run focused tests/lint available for touched code.
- Do not start a development server during implementation. The admin `dev`
  and production `start` scripts are configured for port `3009`.
- Do not create persistent test users or alter the production database during
  validation without explicit approval.

## Acceptance criteria

- Super Admins can manage admin accounts and assign native Strapi Admin roles;
  custom roles remain visible with the backend's actual grants.
- Admins can manage partners and operational resources, Editors can manage
  drivers, riders, deliveries, and rides without access to partner or platform
  settings, and Authors are limited to viewing operational resources.
- Country-specific and global `admn-setting` configuration remain distinct.
- Driver onboarding follows the partner workflow, and rider creation requires
  only the phone number and country.
- Admin account creation does not require email verification; bearer
  registration/verification tokens are never displayed or stored by the
  dashboard.
- The admin app's `dev` and `start` commands use port `3009`.
