import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import nodemailer from 'nodemailer'
import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'

const MASAI_SOURCE = 'operations@masaischool.com'
const IHUB_SOURCE = 'notify-lms@ihubiitrcourses.org'

function getAwsRegion(): string {
  return process.env.AWS_REGION?.trim() || 'ap-south-1'
}

function resolveSourceEmail(portal: EmailPortal): string {
  return portal === 'ihub' ? IHUB_SOURCE : MASAI_SOURCE
}

function brandName(portal: EmailPortal): string {
  return portal === 'ihub' ? 'IHub IITR Courses' : 'Masai School'
}

function buildSubject(portal: EmailPortal): string {
  return `Your login verification code for ${brandName(portal)}`
}

function buildHtml(otp: string, portal: EmailPortal): string {
  const isIhub = portal === 'ihub'
  const signature = isIhub ? 'IHub IITR Courses' : 'Masai School'
  const brand = brandName(portal)

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brand} verification code</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #eef1f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #eef1f5; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(16, 24, 40, 0.08);">
            <tr>
              <td style="background-color: rgb(237, 3, 49); padding: 24px 32px;">
                <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">${brand}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <p style="margin: 0 0 8px; color: #101828; font-size: 20px; font-weight: 600;">Verify your sign-in</p>
                <p style="margin: 0 0 24px; color: #475467; font-size: 15px; line-height: 1.5;">Use the code below to complete your sign-in. This code is valid for the next 10 minutes.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="background-color: #f2f7fb; border: 1px solid #d6e8f2; border-radius: 8px; padding: 20px;">
                      <span style="color: rgb(237, 3, 49); font-size: 32px; font-weight: 700; letter-spacing: 8px;">${otp}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 0; color: #667085; font-size: 13px; line-height: 1.5;">If you didn't request this code, you can safely ignore this email &mdash; no action is needed.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #eaecf0;">
                <p style="margin: 0; color: #667085; font-size: 13px;">Regards,<br>${signature}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function buildText(otp: string, portal: EmailPortal): string {
  const isIhub = portal === 'ihub'
  const signature = isIhub ? 'IHub IITR Courses' : 'Masai School | Program'

  return [
    `Your verification code is: ${otp}`,
    '',
    "This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.",
    '',
    'Regards,',
    signature,
  ].join('\n')
}

export type SendOtpEmailArgs = {
  toEmail: string
  otp: string
  portal: EmailPortal
}

export async function sendOtpEmail({
  toEmail,
  otp,
  portal,
}: SendOtpEmailArgs): Promise<void> {
  const subject = buildSubject(portal)
  const htmlBody = buildHtml(otp, portal)
  const textBody = buildText(otp, portal)
  if (process.env.NODE_ENV === 'development') {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
    })
    await transporter.sendMail({
      from: resolveSourceEmail(portal),
      to: toEmail,
      subject,
      html: htmlBody,
      text: textBody,
    })
    return
  }
  const client = new SESv2Client({ region: getAwsRegion() })

  await client.send(
    new SendEmailCommand({
      FromEmailAddress: resolveSourceEmail(portal),
      Destination: { ToAddresses: [toEmail] },
      Content: {
        Simple: {
          Subject: { Charset: 'UTF-8', Data: subject },
          Body: {
            Html: { Charset: 'UTF-8', Data: htmlBody },
            Text: { Charset: 'UTF-8', Data: textBody },
          },
        },
      },
    }),
  )
}
