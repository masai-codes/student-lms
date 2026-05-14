import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'

const MASAI_SOURCE = 'operations@masaischool.com'
const IHUB_SOURCE = 'notify-lms@ihubiitrcourses.org'

function getAwsRegion(): string {
  return process.env.AWS_REGION?.trim() || 'ap-south-1'
}

function resolveSourceEmail(portal: EmailPortal): string {
  return portal === 'ihub' ? IHUB_SOURCE : MASAI_SOURCE
}

export function getStudentPasswordResetBaseUrl(portal: EmailPortal): string {
  if (portal === 'ihub') {
    return (process.env.IHUB_STUDENT_FRONTEND_URL || 'https://courses.ihubiitrcourses.org').replace(/\/$/, '')
  }
  return (process.env.FRONTEND_URL || '').replace(/\/$/, '')
}

function buildHtml(name: string, link: string, portal: EmailPortal): string {
  const isIhub = portal === 'ihub'
  const intro = isIhub
    ? "You've recently made a request to reset your password on the IHub IITR Courses platform. Please click on the following button to reset your password:"
    : "You've recently made a request to reset your password on the Masai Platform. Please click on the following button to reset your password:"
  const signature = isIhub ? 'IHub IITR Courses' : 'Masai School | Course'

  return `<div style="background-color: #008CBA; padding: 20px;">
              <div style="background-color: #f2f2f2; padding: 20px; border: 1px solid #ddd;">
                <p style="color: #008CBA; font-size: 18px;">Hi ${name},</p>
                <p style="color: #333; font-size: 16px;">${intro}</p>
                <button style="background-color: #fff; color: #008CBA; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                  <a href="${link}" style="color: #008CBA; text-decoration: none;">Reset Password</a>
                </button>
                <p style="color: #333; font-size: 14px;">Regards,<br>
                ${signature}</p>
                <hr>
                <p style="color: #333; font-size: 16px;">If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:</p>
                <p style="color: #333; font-size: 16px;"><a href="${link}" style="color: #008CBA; text-decoration: none;">${link}</a></p>
              </div>
            </div>`
}

export type SendResetPasswordEmailArgs = {
  toEmail: string
  toName: string
  resetLink: string
  portal: EmailPortal
}

export async function sendResetPasswordEmail({
  toEmail,
  toName,
  resetLink,
  portal,
}: SendResetPasswordEmailArgs): Promise<void> {
  const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2')
  const client = new SESv2Client({ region: getAwsRegion() })

  await client.send(
    new SendEmailCommand({
      FromEmailAddress: resolveSourceEmail(portal),
      Destination: { ToAddresses: [toEmail] },
      Content: {
        Simple: {
          Subject: { Charset: 'UTF-8', Data: 'Request for Password Reset' },
          Body: {
            Html: { Charset: 'UTF-8', Data: buildHtml(toName, resetLink, portal) },
          },
        },
      },
    }),
  )
}
