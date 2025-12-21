const returnNineDigitNumber = (phoneNumber: string): string =>
  phoneNumber.replace(/\D/g, '').slice(-9)

const updateClientNumbers = async (strapi: any, phoneNumber: string, identifierType: string) => {
  if (identifierType === 'email') return

  const normalized = "+260" + returnNineDigitNumber(phoneNumber)
  const entry = await strapi.db.query("api::phone-numbers-list.phone-numbers-list").findOne()
  if (!entry.clientNumbers || entry.clientNumbers.includes(normalized)) {
    await strapi.db.query("api::phone-numbers-list.phone-numbers-list").update({
      where: { id: entry.id },
      data: { clientNumbers: [normalized, ...entry.clientNumbers] }
    })
  }
}

const updateClientEmails = async (strapi: any, email: string, identifierType: string) => {
  if (identifierType === 'phoneNumber') return

  const entry = await strapi.db.query("api::email-addresses-list.email-addresses-list").findOne()
  if (!entry.clientEmailAddresses || !entry.clientEmailAddresses.includes(email)) {
    await strapi.db.query("api::email-addresses-list.email-addresses-list").update({
      where: { id: entry.id },
      data: { clientEmailAddresses: [email, ...entry.clientEmailAddresses] }
    })
  }
}

const verifyOtp = async (
  strapi: any,
  identifier: string,
  identifierType: string,
  otp: string | number
): Promise<boolean> => {
  let otpEntry = await strapi.db.query("api::otp-verification.otp-verification").findOne({
      where: { email: identifier }
  })

  if (identifierType === "phoneNumber") {
      otpEntry = await strapi.db.query("api::otp-verification.otp-verification").findOne({
        where: { phoneNumber: identifier.replace(/\D/g, '') }
      })
  }

  if (!otpEntry) return false
  if (parseInt(otpEntry.otp) !== parseInt(otp as string)) return false

  await strapi.db.query("api::otp-verification.otp-verification").delete({
        where: { id: otpEntry.id }
  })

  await updateClientNumbers(strapi, identifier, identifierType)
  await updateClientEmails(strapi, identifier, identifierType)

  return true
}

export default verifyOtp