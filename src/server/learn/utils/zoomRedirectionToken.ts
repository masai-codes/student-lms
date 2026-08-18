import { asc, eq, sql } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import { db } from '@/db'
import { batches, lectures, users } from '@/db/schema'

const JWT_ALGORITHM = 'HS256'

// Destination platforms for the ZEF join redirect.
const ZOOM_MASAI_BASE_URL = 'https://zoom.masaischool.com'
const ZOOM_IHUB_BASE_URL = 'https://zoom.ihubiitrcourses.org'
const ZEF_IVS_MASAI_BASE_URL = 'https://classroom.masaischool.com'
const ZEF_IVS_IHUB_BASE_URL = 'https://classroom.ihubiitrcourses.org'

export type ZoomRedirectionUser = {
  id?: number | string | null
  role?: string | null
  name?: string | null
  email?: string | null
}

export type ZoomRedirectionUrlResult =
  | { ok: true; url: string }
  | { ok: false; status: number; message: string }

type LectureRow = {
  zoomDetails: Record<string, unknown> | null
  hostId: number | null
  settings: Record<string, unknown> | null
  batchId: number | null
  title: string | null
}

function parseJsonObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return null
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, unknown>) : null
}

function lower(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
}

async function readZoomDetails(
  lectureId: number,
): Promise<Record<string, unknown> | null> {
  const rows = await db
    .select({ zoomDetails: lectures.zoomDetails })
    .from(lectures)
    .where(eq(lectures.id, lectureId))
    .limit(1)
  return parseJsonObject(rows[0]?.zoomDetails)
}

/**
 * A single ZEF meeting can back a group of lectures. When `zoom_details` carries
 * a `groupLectureIdentifier`, resolve the lecture id the suffix points at
 * (1-based), falling back to the first lecture in the group.
 */
async function resolveEffectiveLectureId(lectureId: string): Promise<string> {
  const idN = Number(lectureId)
  if (!Number.isFinite(idN)) return lectureId

  const details = await readZoomDetails(idN)
  const groupId = String(details?.groupLectureIdentifier ?? '').trim()
  if (!groupId) return lectureId

  const matching = await db
    .select({ id: lectures.id })
    .from(lectures)
    .where(
      sql`JSON_UNQUOTE(JSON_EXTRACT(${lectures.zoomDetails}, '$.groupLectureIdentifier')) = ${groupId}`,
    )
    .orderBy(asc(lectures.id))
  if (matching.length === 0) return lectureId

  const suffix = groupId.split('-').pop()
  const rowIndex = suffix ? parseInt(suffix, 10) : NaN
  const target =
    Number.isFinite(rowIndex) && rowIndex > 0
      ? (matching[rowIndex - 1] ?? matching[0])
      : matching[0]
  return String(target.id)
}

/**
 * ZEF with IVS: authorization is by user id, not email — only the lecture's
 * primary host (`lectures.host_id`) and secondary hosts
 * (`settings.secondary_host_ids`) may join as admin. The primary host is the
 * instructor.
 */
function resolveIvsAdmin(
  lecture: LectureRow | undefined,
  userIdT: string,
): { ok: true; isInstructor: boolean } | { ok: false } {
  const primaryHostId = lecture?.hostId != null ? String(lecture.hostId) : null

  const settings = parseJsonObject(lecture?.settings)
  const secondaryHostIds = Array.isArray(settings?.secondary_host_ids)
    ? settings.secondary_host_ids.map((sid) => String(sid))
    : []

  const isPrimaryHost = primaryHostId != null && primaryHostId === userIdT
  const isSecondaryHost = secondaryHostIds.includes(userIdT)

  if (!isPrimaryHost && !isSecondaryHost) return { ok: false }
  return { ok: true, isInstructor: isPrimaryHost }
}

/**
 * ZEF with ZOOM: the lecture stores its primary host as a user id. Resolve that
 * user's current email and compare it against the joining admin's. The primary
 * host joins on the shared Zoom license with host privileges; any other admin
 * joins with their own email and no privileges, exactly like a student.
 */
async function resolveZoomAdmin(
  zoomDetails: Record<string, unknown> | null,
  normalizedEmail: string,
): Promise<{ roleZoom: string; jwtEmail: string }> {
  const hostUserIdN = Number(zoomDetails?.hostAdminDashboardUserId)
  let hostAdminDashboardEmail = ''
  if (Number.isInteger(hostUserIdN) && hostUserIdN > 0) {
    const hostRows = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, hostUserIdN))
      .limit(1)
    hostAdminDashboardEmail = lower(hostRows[0]?.email)
  }

  if (
    !normalizedEmail ||
    !hostAdminDashboardEmail ||
    normalizedEmail !== hostAdminDashboardEmail
  ) {
    return { roleZoom: 'student', jwtEmail: normalizedEmail }
  }

  const licenseEmailId = lower(zoomDetails?.license_email_id)
  return {
    roleZoom: 'admin',
    jwtEmail: licenseEmailId || normalizedEmail,
  }
}

/**
 * Both platforms split masai / iHub by `batches.duration === 'ihub'`:
 *   ZEF with IVS  → classroom.ihubiitrcourses.org | classroom.masaischool.com
 *   ZEF with ZOOM → zoom.ihubiitrcourses.org      | zoom.masaischool.com
 * A lecture with no batch can't be an iHub lecture, so it falls back to masai.
 */
async function resolveBaseUrl(
  redirectionType: 'zoom' | 'ivs',
  batchId: number | null | undefined,
): Promise<string> {
  const masaiBaseUrl =
    redirectionType === 'ivs' ? ZEF_IVS_MASAI_BASE_URL : ZOOM_MASAI_BASE_URL
  const ihubBaseUrl =
    redirectionType === 'ivs' ? ZEF_IVS_IHUB_BASE_URL : ZOOM_IHUB_BASE_URL

  if (batchId == null) return masaiBaseUrl

  const batchRows = await db
    .select({ duration: batches.duration })
    .from(batches)
    .where(eq(batches.id, batchId))
    .limit(1)

  return lower(batchRows[0]?.duration) === 'ihub' ? ihubBaseUrl : masaiBaseUrl
}

/**
 * Mints the join JWT (signed with `ZOOM_REDIRECTION_JWT_SECRET`) and returns the
 * full redirect URL for it — callers should not need to know which platform a
 * lecture uses or how the token gets attached to it. Kept in parity with
 * experience-api's `generateZoomRedirectionUrl`:
 *  - resolves the effective lectureId via `zoom_details.groupLectureIdentifier`
 *  - for ZEF with ZOOM admins, maps the dashboard email to the licensed host email
 *  - for ZEF with IVS admins, only the lecture's primary/secondary hosts get a
 *    token, and the primary host gets `isInstructor: true`
 *  - signs a per-flow payload:
 *      ZEF with IVS  → lectureId, lectureTitle, userId, username, role, isInstructor (no iat/exp)
 *      ZEF with ZOOM → lectureId, role, role_zoom, userId, username, email (+ iat/exp, 4h)
 *  - picks the destination platform from `zoom_details.redirectionType`
 */
export async function generateZoomRedirectionUrl(input: {
  lectureId: string
  user: ZoomRedirectionUser | null | undefined
}): Promise<ZoomRedirectionUrlResult> {
  const { lectureId, user } = input
  if (typeof lectureId !== 'string' || lectureId.trim().length === 0) {
    return { ok: false, status: 400, message: 'Invalid lectureId' }
  }

  const effectiveLectureId = await resolveEffectiveLectureId(lectureId.trim())

  const userIdT = user?.id != null ? String(user.id) : ''
  const roleT = user?.role ? String(user.role).trim() : ''
  const usernameT = String(user?.name ?? '').trim()
  const normalizedEmail = lower(user?.email)
  const roleLower = roleT.toLowerCase()
  if (!userIdT || !roleT || !usernameT) {
    return { ok: false, status: 401, message: 'Unauthorized user' }
  }

  const secret = process.env.ZOOM_REDIRECTION_JWT_SECRET
  if (!secret) {
    return {
      ok: false,
      status: 500,
      message: 'ZOOM_REDIRECTION_JWT_SECRET is not configured',
    }
  }

  const effectiveLectureIdN = Number(effectiveLectureId)
  if (!Number.isFinite(effectiveLectureIdN)) {
    return { ok: false, status: 400, message: 'Invalid lectureId' }
  }

  // Fetched once, for every role — the destination platform (ZEF with IVS vs ZEF
  // with ZOOM) depends on this too, not just the admin logic below.
  const lectureRows = await db
    .select({
      zoomDetails: lectures.zoomDetails,
      hostId: lectures.hostId,
      settings: lectures.settings,
      batchId: lectures.batchId,
      title: lectures.title,
    })
    .from(lectures)
    .where(eq(lectures.id, effectiveLectureIdN))
    .limit(1)

  const lecture = lectureRows.at(0)
  const zoomDetails = parseJsonObject(lecture?.zoomDetails)
  const redirectionType: 'zoom' | 'ivs' =
    zoomDetails?.redirectionType === 'ivs' ? 'ivs' : 'zoom'

  // role mirrors the users-table role: admin stays admin, everyone else is student.
  const payloadRole = roleLower === 'admin' ? 'admin' : 'student'
  // role_zoom is 'admin' only when the user is the lecture's primary host.
  let roleZoom = 'student'
  // Set only for ZEF-with-IVS admin tokens: true for the primary host, false for
  // a secondary host.
  let isInstructor: boolean | undefined
  let jwtEmail = normalizedEmail

  if (roleLower === 'admin') {
    if (redirectionType === 'ivs') {
      // ZEF with IVS: role_zoom is not part of the IVS payload, but keep it in sync
      // with role so the "Admin " username prefix (a ZOOM affordance) stays off.
      const ivs = resolveIvsAdmin(lecture, userIdT)
      if (!ivs.ok) {
        return {
          ok: false,
          status: 403,
          message: 'Admin is not a host for this lecture',
        }
      }
      roleZoom = 'admin'
      isInstructor = ivs.isInstructor
    } else {
      const zoomAdmin = await resolveZoomAdmin(zoomDetails, normalizedEmail)
      roleZoom = zoomAdmin.roleZoom
      jwtEmail = zoomAdmin.jwtEmail
    }
  }

  if (!jwtEmail) {
    return { ok: false, status: 401, message: 'Unauthorized user' }
  }

  // An admin who is not the primary host (role admin, role_zoom student) joins as
  // a participant — prefix their display name with "Admin " so they stay identifiable.
  const payloadUsername =
    payloadRole === 'admin' && roleZoom === 'student'
      ? `Admin ${usernameT}`
      : usernameT

  // The two flows carry different payloads:
  //  - ZEF with IVS: exactly lectureId, lectureTitle, userId, username, role,
  //    isInstructor — no email/role_zoom, and no iat/exp (noTimestamp, no expiry).
  //  - ZEF with ZOOM: email/role_zoom plus the standard iat/exp, 4h expiry.
  const token =
    redirectionType === 'ivs'
      ? jwt.sign(
          {
            lectureId: effectiveLectureId,
            lectureTitle: String(lecture?.title ?? ''),
            userId: userIdT,
            username: payloadUsername,
            role: payloadRole,
            // Students are never instructors; for admins this was set by the host check above.
            isInstructor: isInstructor === true,
          },
          secret,
          {
            algorithm: JWT_ALGORITHM,
            header: { typ: 'JWT', alg: JWT_ALGORITHM },
            noTimestamp: true,
          },
        )
      : jwt.sign(
          {
            lectureId: effectiveLectureId,
            role: payloadRole,
            role_zoom: roleZoom,
            userId: userIdT,
            username: payloadUsername,
            email: jwtEmail,
          },
          secret,
          {
            algorithm: JWT_ALGORITHM,
            header: { typ: 'JWT', alg: JWT_ALGORITHM },
            expiresIn: '4h',
          },
        )

  const baseUrl = await resolveBaseUrl(redirectionType, lecture?.batchId)
  return { ok: true, url: `${baseUrl}/?token=${encodeURIComponent(token)}` }
}
