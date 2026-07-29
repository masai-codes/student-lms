import { createServerFn } from '@tanstack/react-start'
import { getCurrentUserId } from '@/server/auth/getCurrentSessionUserId'
import { loadUserWithStatusById } from '@/server/auth/loadUserById'
import { isUserDeactivated } from '@/server/restrictions/deactivatedUser'

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
 *
 * Client callers must go through the cached `meQuery` (`src/query/me/meQuery.ts`)
 * instead of calling this on every navigation — see issue #354.
 */
export const fetchCurrentUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const sessionUserId = await getCurrentUserId()
    if (!sessionUserId) return null

    const user = await loadUserWithStatusById(sessionUserId)
    if (!user) return null

    // Deactivated mid-session: treat as logged-out so the layout redirects to
    // login (where sign-in is also blocked), cutting off the active session.
    if (isUserDeactivated(user.status)) return null

    const { status: _status, ...publicUser } = user
    return publicUser
  },
)

/** Same handler as {@link fetchCurrentUser}; use whichever name fits the caller. */
export const fetchMe = fetchCurrentUser

export type MeUser = NonNullable<Awaited<ReturnType<typeof fetchCurrentUser>>>
