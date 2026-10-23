# Affiliate, coupon, and country-settings flows

This document describes the affiliate and country-settings APIs and runtime
flows. The content-type schemas are maintained under `src/api/**/content-types`
and are intentionally not duplicated here.

## Country settings resolution

`GET /api/admn-setting/resolved` returns admin settings with explicitly
overridden values from the authenticated user's active country. Country
settings that are unset inherit the current admin value. For public
clients that do not have an authenticated user yet, select a country with one
of `countryId`, `countryCode`, or `countryName`. Country fields fall back
individually to admin settings when not set; an inactive or missing country
uses admin settings only.

Country settings no longer rely on copied schema defaults to indicate an
override. The country lifecycle tracks fields explicitly edited by admins;
legacy country values equal to their former schema defaults are treated as
inherited, while non-default legacy values remain overrides. Effective values
therefore still begin with the admin defaults until an individual country
setting is changed.

The endpoint omits the OTP override value from its response. OTP verification
uses the same resolver internally after identifying the user, so the override
is never exposed to the client.

Rider, driver, delivery, and partner frontends load settings through the
custom `/admn-setting/resolved` endpoint. Their caches are country/user-scoped
and settings are fetched after authentication establishes the user's country.
Country currency and affiliate points conversion are available as
country metadata in the resolved response. The affiliate dashboard's
`conversionRate` is the authoritative display conversion and can use a currency
override from the country's affiliate-points-conversion record.

## Driver and delivery partner settings

`allowOrdersWithoutPartner` and `allowPartnerSwitching` are available in both
the admin settings and country settings. The active country's non-null value
takes precedence; otherwise the settings resolver uses the admin value. Both
default to `false`.

When `allowOrdersWithoutPartner` is false, ride and delivery dispatch exclude
drivers without an approved partner, and the accept-order checks enforce the
same requirement. Direct driver float top-ups are blocked through the finance,
float-top-up intent, and OkraPay initiation endpoints. Drivers must contact
their partner to add float. When the setting is true, the existing self-service
float top-up and partner-free order eligibility behavior remain available.

When `allowPartnerSwitching` is false, the authenticated driver partner-switch
endpoint rejects changes. Driver and delivery clients show the 48-hour support
message and configured support phone/WhatsApp contacts instead of the switch
flow. Setting it to true retains the existing self-service switch flow.

## Referral codes and points

An affiliate profile's `affiliateCode` and QR code are referral identifiers;
they are not promotion coupons. The public lookup endpoint is
`GET /api/affiliate/:code`. Impressions can be recorded with
`POST /api/affiliate/track-impression` (`affiliateCode`, optional `userAgent`)
and looked up with `GET /api/affiliate/check-impression`. After a referral is
attributed to a user, ride and delivery events call the points-allocation
service.

The signed-in user can attach a missed referral code with
`POST /api/affiliate/apply-code`:

```json
{ "affiliateCode": "OKRAA8E8" }
```

The referral allocation service resolves the triggering user's country,
requires the affiliate system to be enabled there, and evaluates only active
rules linked to that active country. Rules can target riders, drivers, or
both; cap awards per referred user; and award at configured volume milestones.
Ride-booking referral rules are evaluated after a ride has completed, while
ride-completion rules apply to the driver. Delivery booking/completion rules
follow the corresponding sender/deliverer events.

At backend bootstrap, `ensureDefaultAffiliateAllocationRules()` creates
ride-booking and ride-completion rules when missing and links the rules to
country entries. Existing rules are retained and linked to any newly available
countries. Admins can configure the rules in the content manager.

Authenticated dashboard and reporting endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/affiliate/dashboard` | Affiliate profile, point balance, referrals, and country conversion |
| GET | `/api/affiliate/transactions?page=1&pageSize=20` | Paginated point and redemption history |
| GET | `/api/affiliate/conversion-rate` | Points-to-currency conversion for the signed-in affiliate's country |
| POST | `/api/affiliate/request-withdrawal` | Redeem eligible affiliate balance |

## Admin promotions and affiliate coupons

Promotions are created and administered by platform admins. Affiliates do not
own or create promotions. An affiliate can view the active, published
promotions available in their active country with `GET /api/affiliate/promotions`.

An authenticated affiliate creates a coupon linked to one of those promotions
with `POST /api/affiliate/coupons`:

```json
{
  "name": "Weekend rides",
  "promotionId": 42,
  "code": "WEEKEND-RIDES"
}
```

`code` is optional; when omitted, a code is generated from the coupon name and
made unique. Coupon expiry is calculated using the country-level
`affiliateCouponExpiryDays` setting, falling back to admin settings and then
30 days. `GET /api/affiliate/coupons` lists the signed-in user's coupons.
The `affiliate` controller is registered as a Strapi core controller so its
custom actions, including `getCoupons` and `createCoupon`, are exposed in the
Users & Permissions role action list and can be granted independently.

Coupons are explicitly entered during a ride or delivery booking. Include
`affiliateCouponCode` (or `couponCode`) in the booking `data` object. The
server validates the coupon, expiry, promotion status, applicable booking type,
country, user-type scope, and per-user usage limit before calculating the
discount. Percentage promotions use `amount` as a percentage; flat-rate
promotions use `amount` as a currency value. Invalid coupon submissions return
a client error and do not silently book at the undiscounted fare.

The booking stores the applied coupon, code, promotion, and discount on the
ride/delivery record and records a usage entry keyed to that booking. The usage
ledger prevents duplicate usage entries for the same booking and is used to
enforce a coupon's per-user limit.

## Data model locations

The relevant collection and component schemas are under:

- `src/api/affiliate-points-allocation-rule/content-types/affiliate-points-allocation-rule/`
- `src/api/affiliate-points-conversion/content-types/affiliate-points-conversion/`
- `src/api/affiliate-promotion/content-types/affiliate-promotion/`
- `src/api/affiliate-coupon/content-types/affiliate-coupon/`
- `src/api/affiliate-coupon-usage/content-types/affiliate-coupon-usage/`
- `src/api/affiliate-transaction/content-types/affiliate-transaction/`
- `src/api/country/content-types/country/`
- `src/api/admn-setting/content-types/admn-setting/`

Ride and delivery booking records contain the applied coupon and promotion
references. The affiliate transaction collection is the points-award ledger;
the coupon-usage collection is the coupon-redemption ledger.
