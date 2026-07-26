import jwt from 'jsonwebtoken'

export interface AdmissionsSsoPayload {
  userId: string
  name: string
  email: string
  mobile: string
  platform: 'LMS'
  avatar: string
}

/** Signs the admissions SSO JWT (5-min expiry). Throws if the secret is unset. */
export function signAdmissionsSsoToken(payload: AdmissionsSsoPayload): string {
  const secret = process.env.ADMISSIONS_SSO_SECRET
  if (!secret) throw new Error('ADMISSIONS_SSO_SECRET is not configured')
  return jwt.sign(payload, secret, { expiresIn: '5m' })
}

export function buildAdmissionsSsoUrl(
  payload: AdmissionsSsoPayload,
  redirectUrl: string,
): string {
  const admissionsUrl = process.env.ADMISSIONS_SSO_BASE_URL
  if (!admissionsUrl)
    throw new Error('ADMISSIONS_SSO_BASE_URL is not configured')

  const token = signAdmissionsSsoToken(payload)
  return `${admissionsUrl}/lms-login?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`
}
