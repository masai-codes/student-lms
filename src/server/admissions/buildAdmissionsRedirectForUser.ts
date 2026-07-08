import { and, eq, isNull } from 'drizzle-orm'
import { buildAdmissionsSsoUrl } from './createAdmissionsSsoToken'
import { db } from '@/db'
import { profiles, users } from '@/db/schema'

/**
 * Builds an admissions-portal SSO redirect for a user (reused by the student-kit
 * "fill details" and document-upload flows). Fetches the user + avatar and mints
 * the JWT link via {@link buildAdmissionsSsoUrl}, landing back on `redirectUrl`.
 * Returns `null` (never throws) when SSO isn't configured or the user is
 * missing, so callers degrade gracefully.
 */
export async function buildAdmissionsRedirectForUser(userId: number, redirectUrl: string): Promise<string | null> {
  try {
    const [[user], [profile]] = await Promise.all([
      db.select({ id: users.id, name: users.name, email: users.email, mobile: users.mobile })
        .from(users).where(eq(users.id, userId)).limit(1),
      db.select({ meta: profiles.meta })
        .from(profiles).where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt))).limit(1),
    ])
    if (!user) return null

    const meta = (profile?.meta ?? {}) as Record<string, unknown>
    const avatar = typeof meta['profile_pic'] === 'string' ? meta['profile_pic'] : ''

    return buildAdmissionsSsoUrl(
      { userId: String(user.id), name: user.name, email: user.email, mobile: user.mobile ?? '', platform: 'LMS', avatar },
      redirectUrl,
    )
  } catch {
    return null // SSO secret/base URL not configured — feature degrades gracefully
  }
}
