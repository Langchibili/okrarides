import axios from 'axios'
import nodemailer from 'nodemailer'

const returnNineDigitNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, '').slice(-9)
}

export const SendSmsNotification = (phoneNumber: string, notificationBody: string): void => {
  const validPhoneNumber = "+260" + returnNineDigitNumber(phoneNumber)

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
