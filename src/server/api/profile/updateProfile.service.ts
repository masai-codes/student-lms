import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { toDigits, validateMobile } from '@/lib/profile/validateMobile'

const MAX_NAME_LENGTH = 255

export interface UpdateProfileInput {
  name?: string
  secondaryMobile?: string
}

export interface UpdateProfileResult {
  name: string
  phone: string | null
}

/**
 * Updates the signed-in user's display name (`users.name`) and/or phone number
 * (`profiles.secondary_mobile`).
 *
 * Unlike the legacy `updateProfile` mutation this takes **no user id** — the
 * caller's session is the only identity, so one student can't edit another's
 * profile by passing a different `user_id`. Email and gender are deliberately
 * not editable here (email is an auth identifier; the gender field was already
 * commented out of the old UI).
 */
export async function updateProfile(
  userId: number,
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const name = input.name?.trim()
  const rawMobile = input.secondaryMobile

  if (name === undefined && rawMobile === undefined) {
    throw new ApiError(400, 'NO_PROFILE_FIELDS_TO_UPDATE')
  }

  if (name !== undefined) {
    if (name === '') throw new ApiError(400, 'INVALID_NAME')
    if (name.length > MAX_NAME_LENGTH) throw new ApiError(400, 'INVALID_NAME')
  }

  let mobile: string | undefined
  if (rawMobile !== undefined) {
    const validation = validateMobile(rawMobile)
    if (!validation.isValid) {
      throw new ApiError(400, 'INVALID_MOBILE', validation.message)
    }
    mobile = toDigits(rawMobile)
  }

  if (name !== undefined) {
    await db.update(users).set({ name }).where(eq(users.id, userId))
  }

  if (mobile !== undefined) {
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
      .limit(1)

    if (profile) {
      await db
        .update(profiles)
        .set({ secondaryMobile: mobile })
        .where(eq(profiles.id, profile.id))
    } else {
      // Students with no profiles row can still set a phone number.
      await db.insert(profiles).values({ userId, secondaryMobile: mobile })
    }
  }

  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) throw new ApiError(404, 'USER_NOT_FOUND')

  const [profile] = await db
    .select({ secondaryMobile: profiles.secondaryMobile })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  const phone = profile?.secondaryMobile?.trim()
  return { name: user.name, phone: phone ? phone : null }
}
