import { eq } from 'drizzle-orm'

import { buildReferralLmsLoginRedirectUrl } from './buildReferralLmsLoginRedirectUrl'

import { db } from '@/db'
import { users } from '@/db/schema'
import { getUserIdFromCookieHeader } from '@/server/auth/getCurrentSessionUserId'

export type ReferralLmsLoginUrlSuccessBody = {
  success: true
  url: string
}

export type ReferralLmsLoginUrlErrorBody = {
  success: false
  error: string
  message?: string
}

export type ReferralLmsLoginUrlResult =
  | { status: 200; body: ReferralLmsLoginUrlSuccessBody }
  | { status: 401; body: ReferralLmsLoginUrlErrorBody }
  | { status: 500; body: ReferralLmsLoginUrlErrorBody }

export async function getReferralLmsLoginUrlResult(
  cookieHeader: string | null,
): Promise<ReferralLmsLoginUrlResult> {
  try {
    const userId = await getUserIdFromCookieHeader(cookieHeader)
    if (!userId) {
      return { status: 401, body: { success: false, error: 'Unauthorized' } }
    }

    const rows = await db
      .select({
        email: users.email,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const user = rows[0]

    const { url } = buildReferralLmsLoginRedirectUrl({
      email: user.email,
      username: user.username ?? '',
    })

    return {
      status: 200,
      body: {
        success: true,
        url,
      },
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to generate LMS login URL'
    return {
      status: 500,
      body: {
        success: false,
        error: 'Failed to generate LMS login URL',
        message,
      },
    }
  }
}
