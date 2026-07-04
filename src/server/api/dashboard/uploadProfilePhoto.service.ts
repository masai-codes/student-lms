import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { uploadImageToS3 } from '@/server/storage/s3Upload'

const DATA_URL_RE = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i

export interface UploadProfilePhotoResult {
  url: string
}

/**
 * Stores a captured profile photo: uploads the data-URL image to S3, then
 * writes the public URL to `profiles.meta.profile_pic` (upserting the profile
 * row — this is what the T0 guided-tour progress check reads) and to
 * `users.profile_photo_path` (read by other surfaces). Mirrors the student
 * branch of experience-api's `uploadProfilePicture` mutation.
 *
 * TODO(t0): also mirror to the Supabase avatar (experience-api calls the
 * `update_profile_avatar_by_email` RPC, best-effort). Needs a Supabase client +
 * credentials in student-lms, which don't exist yet.
 */
export async function uploadProfilePhoto(userId: number, dataUrl: string): Promise<UploadProfilePhotoResult> {
  const match = DATA_URL_RE.exec(dataUrl.trim())
  if (!match) throw new ApiError(400, 'INVALID_IMAGE')

  const contentType = match[1]
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length === 0) throw new ApiError(400, 'INVALID_IMAGE')
  const ext = contentType.split('/')[1] ?? 'jpg'

  const url = await uploadImageToS3({ buffer, contentType, ext })

  const [profile] = await db
    .select({ id: profiles.id, meta: profiles.meta })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  if (profile) {
    const meta = (profile.meta ?? {}) as Record<string, unknown>
    await db.update(profiles).set({ meta: { ...meta, profile_pic: url } }).where(eq(profiles.id, profile.id))
  } else {
    await db.insert(profiles).values({ userId, meta: { profile_pic: url } })
  }

  await db.update(users).set({ profilePhotoPath: url }).where(eq(users.id, userId))

  return { url }
}
