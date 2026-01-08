// /**
//  * verifyotp controller
//  */

// import { factories } from '@strapi/strapi';

// import verifyOtp from "../../../services/verifyOtp"

// module.exports = factories.createCoreController('api::verifyotp.verifyotp', ({ strapi }) => ({
//   async create(ctx) {
//     const { data } = ctx.request.body
//     const { identifier, identifierType, otp, purpose } = data
//     const isValid = await verifyOtp(strapi, identifier, identifierType, otp)

//     if (isValid) {
//       // i want to fire a create request to /auth/local and return the jwt as part of my response in here  return { message: "OTP verified", status: true, jwt:the returned jwt from the response }
//       return { message: "OTP verified", status: true }
//     }
//     return { message: "Invalid OTP", status: false }
//   }
// }))


/**
 * verifyotp controller
 */

import { factories } from '@strapi/strapi'
import verifyOtp from "../../../services/verifyOtp"

module.exports = factories.createCoreController(
  'api::verifyotp.verifyotp',
  ({ strapi }) => ({

    async create(ctx) {
      const { data } = ctx.request.body
      const { identifier, identifierType, otp, purpose } = data

      const isValid = await verifyOtp(strapi, identifier, identifierType, otp)

      if (!isValid) {
        return { message: "Invalid OTP", status: false }
      }
      console.log('identifier',identifier)
      // 1. Find user
      const user = await strapi
        .query('plugin::users-permissions.user')
        .findOne({
          where:
            identifierType === 'email'
              ? { email: identifier }
              : { username: identifier }
        })

      if (!user) {
        return { message: "User not found", status: false }
      }

      // 2. Issue JWT (same thing /auth/local does)
      const jwt = purpose === "registration" || purpose === "login"? strapi
        .plugin('users-permissions')
        .service('jwt')
        .issue({ id: user.id }) : null

      // 3. Return response
      return {
        message: "OTP verified",
        status: true,
        jwt,
        user
      }
    }

  })
)
