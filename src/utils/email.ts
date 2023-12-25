import { EmailFormat } from '@/types'
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import path from 'path'
import fs from 'fs'
import { configEnvs } from '@/config'

// Create SES service object.
const sesClient = new SESClient({
  region: configEnvs.awsRegion,
  credentials: {
    secretAccessKey: configEnvs.awsSecretKey as string,
    accessKeyId: configEnvs.awsAccessKey as string
  }
})

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: EmailFormat) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses:
      replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  })
}

export const sendEmail = async (
  toAddress: string | string[],
  subject: string,
  body: any
) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: configEnvs.awsFrom as string,
    toAddresses: toAddress,
    body,
    subject
  })

  try {
    await sesClient.send(sendEmailCommand)
    console.error('Send email succedd.')
  } catch (err: any) {
    console.error('Failed to send email.', err['message'])
    return err
  }
}

const verifiTemplates = fs.readFileSync(
  path.resolve('src/templates/email/verify.html'),
  'utf-8'
)

export const sendVerifyEmail = (
  toAddr: string | string[],
  link: string,
  tokens: string,
  templates = verifiTemplates
) => {
  return sendEmail(
    toAddr,
    'Verify your email',
    templates
      .replace(
        '{{title}}',
        'Verify your email to complete register our application'
      )
      .replace('{{content}}', 'Click the button bellow to verify your email')
      .replace('{{titleLink}}', 'Verify now')
      .replace('{{link}}', `${link}/verify-email?token=${tokens}`)
  )
}

export const sendEmaiLForgotPassword = (
  toAddr: string | string[],
  link: string,
  tokens: string,
  templates = verifiTemplates
) => {
  return sendEmail(
    toAddr,
    'Are you forgot password',
    templates
      .replace('{{title}}', "Forgor password, don't worry")
      .replace(
        '{{content}}',
        'We will create new password for you when you click this button'
      )
      .replace('{{titleLink}}', 'Reset password')
      .replace('{{link}}', `${link}/reset-password?token=${tokens}`)
  )
}
