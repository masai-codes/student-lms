import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'

const MASAI_SOURCE = 'operations@masaischool.com'
const IHUB_SOURCE = 'notify-lms@ihubiitrcourses.org'

function getAwsRegion(): string {
  return process.env.AWS_REGION?.trim() || 'ap-south-1'
}

function resolveSourceEmail(portal: EmailPortal): string {
  return portal === 'ihub' ? IHUB_SOURCE : MASAI_SOURCE
}

function buildHtml(otp: string, portal: EmailPortal): string {
  const isIhub = portal === 'ihub'
  const signature = isIhub ? 'IHub IITR Courses' : 'Masai School | Course'

  return `<div style="background-color: #008CBA; padding: 20px;">
            <div style="background-color: #f2f2f2; padding: 20px; border: 1px solid #ddd;">
              <p style="color: #008CBA; font-size: 18px;">Your one-time password</p>
              <p style="color: #333; font-size: 16px;">Use the following code to sign in. It expires in 10 minutes.</p>
              <p style="color: #008CBA; font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
              <p style="color: #333; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
              <hr>
              <p style="color: #333; font-size: 14px;">Regards,<br>${signature}</p>
            </div>
          </div>`
}

export type SendOtpEmailArgs = {
  toEmail: string
  otp: string
  portal: EmailPortal
}

export async function sendOtpEmail({ toEmail, otp, portal }: SendOtpEmailArgs): Promise<void> {
  const client = new SESv2Client({ region: getAwsRegion() })

  await client.send(
    new SendEmailCommand({
      FromEmailAddress: resolveSourceEmail(portal),
      Destination: { ToAddresses: [toEmail] },
      Content: {
        Simple: {
          Subject: { Charset: 'UTF-8', Data: 'Your one-time password' },
          Body: {
            Html: { Charset: 'UTF-8', Data: buildHtml(otp, portal) },
          },
        },
      },
    }),
  )
}
