import jwt from 'jsonwebtoken'

import { getJwtSecret } from '@/server/auth/v2/sessionConfig'

const JWT_ALGORITHM = 'HS256'
// Matches experience-api's JOIN_TOKEN_EXPIRY so the fallback window is identical.
const JOIN_TOKEN_EXPIRY = '2h'

/**
 * Mint the cookie-less fallback JWT that the experience-api adaptive-lecture
 * ("SAL") join handler accepts (`verifyAdaptiveJoinToken`): payload `{ userId }`,
 * HS256, signed with the shared `JWT_SECRET_KEY`. App users (and iHub users whose
 * session cookie is scoped to a different domain than the join URL) authenticate
 * via this `?token=` param instead of the cookie. Ported from experience-api's
 * `mintAdaptiveJoinToken` so the new LMS mints locally rather than proxying.
 */
export function mintAdaptiveJoinToken(userId: number): string {
  return jwt.sign({ userId: Number(userId) }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: JOIN_TOKEN_EXPIRY,
  })
}
