import jwt from 'jsonwebtoken'

/**
 * Mirrors `getLevelupSsoRedirectUrl` in `experience-api/src/features/profile/profileController.ts`.
 * JWT must match Levelup's `LMS_JWT_SECRET_KEY` (same value as `SSO_JWT_SECRET` here).
 */
export function buildLevelupSsoRedirectUrl(input: {
  userId: string
  email: string | undefined
  name: string | undefined
}): { url: string; token: string } {
  const secretKey = process.env.SSO_JWT_SECRET?.trim()
  if (!secretKey) {
    throw new Error('SSO_JWT_SECRET is missing in environment')
  }

  const token = jwt.sign(
    {
      userId: input.userId,
      email: input.email,
      name: input.name,
    },
    secretKey,
    { expiresIn: '5m' },
  )

  const levelupBase = (process.env.LEVELUP_APP_URL || 'https://levelup.masaischool.com').replace(/\/$/, '')
  const ssoPath = '/jobseeker/auth/signin'
  const url = `${levelupBase}${ssoPath}?token=${encodeURIComponent(token)}`

  return { url, token }
}
