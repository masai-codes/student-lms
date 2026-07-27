import jwt from 'jsonwebtoken'

export interface AdmissionsSsoPayload {
  userId: string
  name: string
  email: string
  mobile: string
  platform: 'LMS'
  avatar: string
}

/**
 * Signs the admissions SSO JWT (5-min expiry). `extraClaims` are merged into the
 * token payload (e.g. `{ enrolment_id }` for enrolment-payment links). Throws if
 * the secret is unset.
 */
export function signAdmissionsSsoToken(
  payload: AdmissionsSsoPayload,
  extraClaims: Record<string, unknown> = {},
): string {
  const secret = process.env.ADMISSIONS_SSO_SECRET
  if (!secret) throw new Error('ADMISSIONS_SSO_SECRET is not configured')
  return jwt.sign({ ...payload, ...extraClaims }, secret, { expiresIn: '5m' })
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
