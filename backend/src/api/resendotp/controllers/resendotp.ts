
/**
 * resendotp controller
 */

import { SendSmsNotification, SendEmailNotification } from "../../../services/messages"
import { factories } from '@strapi/strapi'

const returnNineDigitNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, '').slice(-9)
}

module.exports = factories.createCoreController(
  'api::resendotp.resendotp',
  ({ strapi }) => ({

     async create(ctx) {
        const { data } = ctx.request.body
        const { identifier, identifierType, purpose } = data
        let otpEntry = await strapi.db.query("api::otp-verification.otp-verification").findOne({
            where: { email: identifier }
        })

        if (identifierType === "phoneNumber") {
            otpEntry = await strapi.db.query("api::otp-verification.otp-verification").findOne({
              where: { phoneNumber: identifier.replace(/\D/g, '') }
            })
        }
        const message = `Your Okrarides ${purpose.replace('_', ' ')} OTP is: ${otpEntry.otp}`
        if (identifierType === "phoneNumber") {
            const normalized = "+260" + returnNineDigitNumber(identifier)
            SendSmsNotification(normalized, message)
        }
        else{
            SendEmailNotification(identifier, message)
        }
        // 3. Return response
        return {
            message: "OTP resent"
        }
    }

  })
)
