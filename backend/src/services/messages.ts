//Okrarides\backend\src\services\messages.ts
import axios from 'axios'
import nodemailer from 'nodemailer'

const returnNineDigitNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, '').slice(-9)
}

export const getPhoneDigits = (phoneNumber, phoneNumberDigitLength = 9) => {
  if (!phoneNumber) return '';
  let numberLength = phoneNumberDigitLength? phoneNumberDigitLength : 9 
  const digits = String(phoneNumber).replace(/\D/g, '');
  return digits.slice(-numberLength)
}

export const SendSmsNotification = async (phoneNumber: string, notificationBody: string ): Promise<void> => {
  let user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { username: String(phoneNumber).replace(/\D/g, '') },
        populate: {
          country: true
        }
  })
  if(!user){ // if not found, try using the number to check the account phoneNumber
    user  = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { phoneNumber: String(phoneNumber).replace(/\D/g, '') },
        populate: {
          country: true
        }
  })
  }
  const phoneCode = (user?.country?.phoneCode  || "+260")
  const validPhoneNumber = phoneCode + getPhoneDigits(phoneNumber,user?.country?.phoneNumberDigitLength)    
  axios.post(process.env.SMSGATEWAYURL + "/send-sms", {
    apiKey: process.env.SMSGATEWAYAPIKEY,
    username: process.env.SMSGATEWAYAPIUSERNAME,
    recipients: [validPhoneNumber],
    message: notificationBody,
    from: process.env.SMSGATEWAYAPICALLERID
  }, {
    headers: { 'Content-Type': 'application/json' }
  })
    .then(response => console.log('SMS sent:', response.data))
    .catch(error => console.error('Error sending SMS:', error))

  console.log('sending sms notification', validPhoneNumber, notificationBody)
}

export const SendEmailNotification = (email: string, notificationBody: string): void => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAILSERVICENAME,
    auth: {
      user: process.env.EMAILSERVICEUSERNAME,
      pass: process.env.EMAILSERVICEPASSWORD
    }
  })

  transporter.sendMail({
    from: process.env.EMAILSERVICEUSERNAME,
    to: email,
    subject: 'Message from Vector Finance Limited',
    text: notificationBody
  }, (error, info) => {
    if (error) console.log('Error sending email:', error)
    else console.log('Email sent:', info.response)
  })

  console.log('sending email notification', email, notificationBody)
}
