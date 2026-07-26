import { and, eq, isNull } from 'drizzle-orm'

import { signAdmissionsSsoToken } from './createAdmissionsSsoToken'
import { db } from '@/db'
import { profiles, users } from '@/db/schema'

/**
 * Mints the admissions SSO JWT for a user (the same token
 * {@link buildAdmissionsSsoUrl} uses) without wrapping it in a redirect URL, so
 * callers can embed it in their own admissions link. Fetches the user + avatar
 * like {@link buildAdmissionsRedirectForUser}. Returns `null` (never throws)
 * when SSO isn't configured or the user is missing, so callers degrade
 * gracefully. Note: the token expires in 5 minutes.
 */
export async function getAdmissionsSsoTokenForUser(
  userId: number,
): Promise<string | null> {
  try {
    if (!process.env.ADMISSIONS_SSO_SECRET) return null

    const [[user], [profile]] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          mobile: users.mobile,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({ meta: profiles.meta })
        .from(profiles)
        .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
        .limit(1),
    ])
    if (!user) return null

    const meta = (profile?.meta ?? {}) as Record<string, unknown>
    const avatar =
      typeof meta['profile_pic'] === 'string' ? meta['profile_pic'] : ''

    return signAdmissionsSsoToken({
      userId: String(user.id),
      name: user.name,
      email: user.email,
      mobile: user.mobile ?? '',
      platform: 'LMS',
      avatar,
    })
  } catch {
    return null // SSO not configured — feature degrades gracefully
  }
}
