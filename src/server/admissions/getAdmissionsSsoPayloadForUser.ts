import { and, eq, isNull } from 'drizzle-orm'

import type { AdmissionsSsoPayload } from './createAdmissionsSsoToken'
import { db } from '@/db'
import { profiles, users } from '@/db/schema'

/**
 * Builds the admissions SSO payload (user identity + avatar) for a user, ready
 * to sign with {@link signAdmissionsSsoToken} — optionally with extra per-link
 * claims. Fetch it once and sign many tokens (e.g. one per enrolment). Returns
 * `null` (never throws) when SSO isn't configured or the user is missing, so
 * callers degrade gracefully.
 */
export async function getAdmissionsSsoPayloadForUser(
  userId: number,
): Promise<AdmissionsSsoPayload | null> {
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

    return {
      userId: String(user.id),
      name: user.name,
      email: user.email,
      mobile: user.mobile ?? '',
      platform: 'LMS',
      avatar,
    }
  } catch {
    return null // SSO not configured — feature degrades gracefully
  }
}
