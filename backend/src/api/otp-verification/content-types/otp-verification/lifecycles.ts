import { SendSmsNotification, SendEmailNotification } from "../../../../services/messages"

interface OTPVerification {
  id: number
  phoneNumber?: string
  email?: string
  purpose: string
  otp?: string
  expiresAt?: Date
}

const generateOTP = (): number => {
  const length = 6
  const chars = '0123456789'
  let otp = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    otp += chars[randomIndex]
  }

  const otpNum = parseInt(otp)
  if (otpNum.toString().length !== 6) return generateOTP()
  return otpNum
}

const returnNineDigitNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, '').slice(-9)
}

export default {
  async afterCreate(event: any) {
      const { result } = event as { result: OTPVerification }

      const { id, phoneNumber, email, purpose } = result

      // Generate OTP
      const otp = generateOTP()

      // 10-minute expiry
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      // Update record with new OTP + expiry timestamp
      await strapi.db.query('api::otp-verification.otp-verification').update({
        where: { id },
        data: {
          otp: otp.toString(),
          expiresAt,
        },
      })


      // Format message
      const message = `Your Okrarides ${purpose.replace('_', ' ')} OTP is: ${otp}`

      // --- SEND SMS ---
      if (phoneNumber) {
        try {
          const normalized = "+260" + returnNineDigitNumber(phoneNumber)
          SendSmsNotification(normalized, message)
        } catch (err) {
          strapi.log.error("Failed to send OTP SMS:", err)
        }
      }

      // --- SEND EMAIL ---
      if (email) {
        try {
          SendEmailNotification(email, message)
        } catch (err) {
          strapi.log.error("Failed to send OTP Email:", err)
        }
      }

      if (!phoneNumber && !email) {
        strapi.log.warn("OTP created but no phoneNumber or email was provided")
      }
    }
}