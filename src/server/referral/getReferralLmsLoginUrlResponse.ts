import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { users, profiles } from '@/db/schema'
import { getCurrentUserId } from '@/server/auth/getCurrentSessionUserId'
import { buildAdmissionsSsoUrl } from '@/server/admissions/createAdmissionsSsoToken'

export type ReferralLmsLoginUrlSuccessBody = {
  success: true
  url: string
}

type ReferralLmsLoginUrlErrorBody = {
  success: false
  error: string
  message?: string
}

export type ReferralLmsLoginUrlResult =
  | { status: 200; body: ReferralLmsLoginUrlSuccessBody }
  | { status: 401; body: ReferralLmsLoginUrlErrorBody }
  | { status: 500; body: ReferralLmsLoginUrlErrorBody }

export async function getReferralLmsLoginUrlResult(): Promise<ReferralLmsLoginUrlResult> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { status: 401, body: { success: false, error: 'Unauthorized' } }
    }

    const [userRows, profileRows] = await Promise.all([
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

    const user = userRows[0]
    if (!user) {
      return { status: 401, body: { success: false, error: 'Unauthorized' } }
    }

    const admissionsUrl = process.env.ADMISSIONS_SSO_BASE_URL
    if (!admissionsUrl)
      throw new Error('ADMISSIONS_SSO_BASE_URL is not configured')

    const profileMeta = (profileRows.at(0)?.meta ?? {}) as Record<
      string,
      unknown
    >
    const avatar =
      typeof profileMeta['profile_pic'] === 'string'
        ? profileMeta['profile_pic']
        : ''

    const url = buildAdmissionsSsoUrl(
      {
        userId: user.id.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile ?? '',
        platform: 'LMS',
        avatar,
      },
      `${admissionsUrl}/refer-and-earn`,
    )

    return { status: 200, body: { success: true, url } }
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
