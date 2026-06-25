import { asc, eq, sql } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import { db } from '@/db'
import { lectures } from '@/db/schema'

const JWT_ALGORITHM = 'HS256'

export type ZoomRedirectionUser = {
  id?: number | string | null
  role?: string | null
  name?: string | null
  email?: string | null
}

export type ZoomRedirectionTokenResult =
  | { ok: true; token: string }
  | { ok: false; status: number; message: string }

function parseZoomDetails(raw: unknown): Record<string, unknown> | null {
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

async function readZoomDetails(
  lectureId: number,
): Promise<Record<string, unknown> | null> {
  const rows = await db
    .select({ zoomDetails: lectures.zoomDetails })
    .from(lectures)
    .where(eq(lectures.id, lectureId))
    .limit(1)
  return parseZoomDetails(rows[0]?.zoomDetails)
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

/** For admins, map the dashboard email to the licensed/alternative host email. */
function resolveAdminEmail(
  details: Record<string, unknown> | null,
  normalizedEmail: string,
): string {
  const dashboardEmail = String(details?.hostAdminDashboardEmailId ?? '')
    .trim()
    .toLowerCase()
  const licenseEmail = String(details?.license_email_id ?? '')
    .trim()
    .toLowerCase()
  const mapping = Array.isArray(details?.alternativeHostEmailMapping)
    ? (details.alternativeHostEmailMapping as Array<Record<string, unknown>>)
    : []

  if (normalizedEmail && normalizedEmail === dashboardEmail && licenseEmail) {
    return licenseEmail
  }
  const matched = mapping.find(
    (entry) =>
      normalizedEmail ===
      String(entry.alternativehostAdminDashboardEmailId ?? '')
        .trim()
        .toLowerCase(),
  )
  return matched
    ? String(matched.alternativehostAdminZoomLicenseEmailId ?? '')
        .trim()
        .toLowerCase()
    : ''
}

/**
 * Mints the JWT the ZEF platform (zoom.masaischool.com / zoom.ihubiitrcourses.org)
 * expects, signed with `ZOOM_REDIRECTION_JWT_SECRET`. Ported from experience-api
 * so the new LMS no longer proxies for token minting.
 */
export async function generateZoomRedirectionToken(input: {
  lectureId: string
  user: ZoomRedirectionUser | null | undefined
}): Promise<ZoomRedirectionTokenResult> {
  const { lectureId, user } = input
  if (typeof lectureId !== 'string' || lectureId.trim().length === 0) {
    return { ok: false, status: 400, message: 'Invalid lectureId' }
  }

  const effectiveLectureId = await resolveEffectiveLectureId(lectureId.trim())

  const userIdT = user?.id != null ? String(user.id) : ''
  const roleT = user?.role ? String(user.role).trim() : ''
  const usernameT = String(user?.name ?? '').trim()
  const normalizedEmail = String(user?.email ?? '')
    .trim()
    .toLowerCase()
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

  let jwtEmail = normalizedEmail
  if (roleT.toLowerCase() === 'admin') {
    const idN = Number(effectiveLectureId)
    if (!Number.isFinite(idN)) {
      return { ok: false, status: 400, message: 'Invalid lectureId' }
    }
    const adminEmail = resolveAdminEmail(await readZoomDetails(idN), normalizedEmail)
    if (!adminEmail) {
      return {
        ok: false,
        status: 403,
        message: 'Admin email is not authorized for this lecture',
      }
    }
    jwtEmail = adminEmail
  } else if (!normalizedEmail) {
    return { ok: false, status: 401, message: 'Unauthorized user' }
  }

  const token = jwt.sign(
    {
      lectureId: effectiveLectureId,
      role: roleT,
      userId: userIdT,
      username: usernameT,
      email: jwtEmail,
    },
    secret,
    {
      algorithm: JWT_ALGORITHM,
      header: { typ: 'JWT', alg: JWT_ALGORITHM },
      expiresIn: '2h',
    },
  )

  return { ok: true, token }
}
