import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getEmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import {
  getStudentPasswordResetBaseUrl,
  sendResetPasswordEmail,
} from '@/server/auth/v2/passwordResetEmail'

const JWT_ALGORITHM = 'HS256'
const TOKEN_TTL = '1h'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) throw new Error('JWT_SECRET_KEY env var is not set')
  return secret
}

function buildResetLink(role: string | null, token: string, portal: 'masai' | 'ihub'): string | undefined {
  if (role === 'admin') {
    const base = (process.env.ADMIN_FRONTEND_URL ?? '').replace(/\/$/, '')
    return base ? `${base}/reset-password/?token=${token}` : undefined
  }
  if (role === 'student') {
    const base = getStudentPasswordResetBaseUrl(portal)
    return base ? `${base}/reset-password/${token}` : undefined
  }
  return undefined
}

export type SendForgotPasswordEmailInput = {
  email: string
  request: Request
}

export async function sendForgotPasswordEmail({
  email,
  request,
}: SendForgotPasswordEmailInput): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()

  const rows = await db
    .select({ email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  const user = rows[0]
  if (!user) {
    console.warn(
      `[forgot-password] no user for email "${normalizedEmail}" — returning generic success without sending`,
    )
    return
  }

  const token = jwt.sign({ email: user.email }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: TOKEN_TTL,
  })

  const portal = getEmailPortal(request)
  const resetLink = buildResetLink(user.role, token, portal)

  if (!resetLink) {
    console.warn(
      `[forgot-password] could not build reset link for "${normalizedEmail}" ` +
        `(role="${user.role}", portal="${portal}"). ` +
        `Check role is admin/student and the matching base URL env var is set ` +
        `(ADMIN_FRONTEND_URL / FRONTEND_URL / IHUB_STUDENT_FRONTEND_URL).`,
    )
    return
  }

  await sendResetPasswordEmail({
    toEmail: user.email,
    toName: user.name,
    resetLink,
    portal,
  })
}
