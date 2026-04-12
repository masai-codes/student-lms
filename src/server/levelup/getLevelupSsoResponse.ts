import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { users } from '@/db/schema'
import { getUserIdFromCookieHeader } from '@/server/auth/getCurrentSessionUserId'

import { buildLevelupSsoRedirectUrl } from './buildLevelupSsoRedirectUrl'

/** Same JSON shape as `experience-api` `GET /levelup-sso`. */
export type LevelupSsoSuccessBody = {
  success: true
  data: { url: string; token: string }
  message: string
}

export type LevelupSsoErrorBody =
  | { error: string }
  | { success: false; error: string; message: string }

export type LevelupSsoResult =
  | { status: 200; body: LevelupSsoSuccessBody }
  | { status: 401; body: { error: string } }
  | { status: 500; body: { success: false; error: string; message: string } }

/**
 * Shared by TanStack `createServerFn` and Nitro `GET /levelup-sso`.
 */
export async function getLevelupSsoResult(cookieHeader: string | null): Promise<LevelupSsoResult> {
  try {
    const userId = await getUserIdFromCookieHeader(cookieHeader)
    if (!userId) {
      return { status: 401, body: { error: 'Unauthorized' } }
    }

    const rows = await db
      .select({
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const user = rows[0]
    if (!user) {
      return { status: 401, body: { error: 'Unauthorized' } }
    }

    const { url, token } = buildLevelupSsoRedirectUrl({
      userId: String(userId),
      email: user.email,
      name: user.name,
    })

    return {
      status: 200,
      body: {
        success: true,
        data: { url, token },
        message: 'Levelup SSO redirect URL has been successfully generated',
      },
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Something went wrong while redirecting to Levelup'
    return {
      status: 500,
      body: {
        success: false,
        error: 'Internal Server Error',
        message,
      },
    }
  }
}
