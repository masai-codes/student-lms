import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batches, profiles, userBatchAdmissionData, users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getStudentCodesForUser } from '@/server/users/getStudentCode'
import type {
  ProfileOverview,
  ProfileStudentCode,
} from '@/server/api/profile/profile.types'

/** Reads `profiles.meta.profile_pic` without trusting the JSON's shape. */
function readProfilePic(meta: unknown): string | null {
  if (!meta || typeof meta !== 'object') return null
  const pic = (meta as Record<string, unknown>).profile_pic
  return typeof pic === 'string' && pic.trim() !== '' ? pic : null
}

/**
 * Student codes come from `batch_user` (via {@link getStudentCodesForUser}, the
 * shared source of truth) decorated with each batch's display name so the header
 * can link a code to its course page. `users.username` is stale and only a last
 * resort. A student can be enrolled in several batches, hence a list.
 */
async function loadStudentCodes(
  userId: number,
  fallbackUsername: string | null,
): Promise<Array<ProfileStudentCode>> {
  const codes = await getStudentCodesForUser(userId)

  if (codes.length === 0) {
    return fallbackUsername
      ? [{ code: fallbackUsername, batchId: null, batchName: null }]
      : []
  }

  const batchIds = [...new Set(codes.map((code) => code.batchId))]
  const batchRows = await db
    .select({ id: batches.id, name: batches.name })
    .from(batches)
    .where(inArray(batches.id, batchIds))

  const namesById = new Map(batchRows.map((row) => [row.id, row.name]))

  return codes.map((code) => ({
    code: code.code,
    batchId: code.batchId,
    batchName: namesById.get(code.batchId) ?? null,
  }))
}

/** Admission-journey flags that decide whether Kit / Invoices tabs exist. */
async function loadAdmissionFlags(
  userId: number,
): Promise<{ isNewUserJourney: boolean; hasFullFees: boolean }> {
  const rows = await db
    .select({ fullFeesPaid: userBatchAdmissionData.fullFeesPaid })
    .from(userBatchAdmissionData)
    .where(eq(userBatchAdmissionData.userId, userId))

  return {
    isNewUserJourney: rows.length > 0,
    hasFullFees: rows.some((row) => Boolean(row.fullFeesPaid)),
  }
}

/**
 * Everything the profile header renders, plus the two admission flags the tab
 * list is derived from — one round trip instead of the old page's three.
 *
 * Unlike the legacy `profile` GraphQL query this does **not** throw when the
 * user has no `profiles` row: those users still have a name, email and student
 * codes, and the old query blanking out for them was a bug.
 */
export async function getProfileOverview(
  userId: number,
): Promise<ProfileOverview> {
  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      username: users.username,
      profilePhotoPath: users.profilePhotoPath,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) throw new ApiError(404, 'USER_NOT_FOUND')

  const [profile] = await db
    .select({ meta: profiles.meta, secondaryMobile: profiles.secondaryMobile })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  const [studentCodes, admissionFlags] = await Promise.all([
    loadStudentCodes(userId, user.username),
    loadAdmissionFlags(userId),
  ])

  const phone = profile?.secondaryMobile?.trim()

  return {
    name: user.name,
    email: user.email,
    avatarUrl: readProfilePic(profile?.meta) ?? user.profilePhotoPath ?? null,
    phone: phone ? phone : null,
    studentCodes,
    ...admissionFlags,
  }
}
