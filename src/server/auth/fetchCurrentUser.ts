import { eq, sql } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '@/db'
import { clubMembers } from '@/db/schema'
import { getCurrentUserId } from '@/server/auth/getCurrentSessionUserId'
import { getPortalRedirectForUser } from '@/server/auth/v2/portalGate'
import { isUserDeactivated } from '@/server/restrictions/deactivatedUser'

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    if (result.length > 0 && Array.isArray(result[0])) {
      return result[0] as Array<T>
    }
    return result as Array<T>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

/** Ambient request, or `null` when there is none (background jobs, tests). */
function currentRequest(): Request | null {
  try {
    return getRequest()
  } catch {
    return null
  }
}

function pickProfileImageUrl(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s.length > 0 ? s : null
}

/**
 * JSON_EXTRACT of a boolean can surface as true/1/"true" depending on the
 * driver; treat any of those truthy encodings as set. Anything else (including
 * an absent key → null) is false.
 */
function isMetaFlagTrue(value: number | boolean | string | null): boolean {
  return value === true || value === 1 || value === 'true'
}

/**
 * Current session user for layouts and client calls.
 */
export const fetchCurrentUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const sessionUserId = await getCurrentUserId()
    if (!sessionUserId) return null

    const rows = normalizeRows<{
      id: number
      name: string
      email: string
      mobile: string | null
      role: string | null
      client: string | null
      status: string | null
      profileImage: string | null
      newLmsPagesEnabled: number | boolean | string | null
      tryNewTourSeen: number | boolean | string | null
      hideSwitchOption: number | boolean | string | null
    }>(
      await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.mobile,
        u.role,
        u.client,
        u.status,
        JSON_EXTRACT(u.meta, '$.new_lms_pages_enabled') AS newLmsPagesEnabled,
        JSON_EXTRACT(u.meta, '$.new_lms_try_new_tour_seen') AS tryNewTourSeen,
        JSON_EXTRACT(u.meta, '$.hide_switch_option') AS hideSwitchOption,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(pr.meta, '$.profile_pic')),
          JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.profile_pic')),
          u.profile_photo_path
        ) AS profileImage
      FROM users u
      LEFT JOIN (
        SELECT p.user_id AS userId, p.meta
        FROM profiles p
        INNER JOIN (
          SELECT user_id, MAX(id) AS latestProfileId
          FROM profiles
          WHERE deleted_at IS NULL
          GROUP BY user_id
        ) latestProfile ON latestProfile.latestProfileId = p.id
      ) pr ON pr.userId = u.id
      WHERE u.id = ${sessionUserId}
      LIMIT 1
    `),
    )

    const row = rows.at(0)
    if (row === undefined) return null

    // Deactivated mid-session: treat as logged-out so the layout redirects to
    // login (where sign-in is also blocked), cutting off the active session.
    if (isUserDeactivated(row.status)) return null

    // A student holding a session for one portal can still land on another
    // portal's domain (bookmark, shared link, old app handoff). Resolve where
    // they belong here — the app shell redirects on it (see the protected
    // layout's `beforeLoad`). `null` = they're on the right domain, are an
    // admin, or no distinct target URL is configured.
    const request = currentRequest()
    const portalRedirectUrl = request
      ? ((
          await getPortalRedirectForUser({
            user: { id: row.id, role: row.role, client: row.client ?? 'masai' },
            request,
          })
        )?.redirectUrl ?? null)
      : null

    const membershipRows = await db
      .select({ clubId: clubMembers.clubId })
      .from(clubMembers)
      .where(eq(clubMembers.userId, sessionUserId))
      .limit(1)

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      mobile: row.mobile,
      role: row.role,
      portalRedirectUrl,
      profileImageUrl: pickProfileImageUrl(row.profileImage),
      newLmsPagesEnabled: isMetaFlagTrue(row.newLmsPagesEnabled),
      hasSeenTryNewTour: isMetaFlagTrue(row.tryNewTourSeen),
      // Hides the old↔new switch CTA everywhere (iitj students — see
      // HIDE_SWITCH_OPTION_META_KEY).
      hideSwitchOption: isMetaFlagTrue(row.hideSwitchOption),
      joinedClubId:
        membershipRows[0]?.clubId != null
          ? String(membershipRows[0].clubId)
          : null,
    }
  },
)

/** Same handler as {@link fetchCurrentUser}; use whichever name fits the caller. */
export const fetchMe = fetchCurrentUser

export type MeUser = NonNullable<Awaited<ReturnType<typeof fetchCurrentUser>>>
