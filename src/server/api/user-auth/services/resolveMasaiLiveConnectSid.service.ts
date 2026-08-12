import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import {
  MASAI_LIVE_DEFAULT_REDIRECT,
  extractCookieValue,
} from './masaiLiveLoginCookies'
import { db } from '@/db'
import { batchUser, users } from '@/db/schema'
import { logger } from '@/lib/logger'

const FN = 'resolveMasaiLiveConnectSid'
const ADMISSIONS_SSO_TOKEN_EXPIRY = '5m'

export type MasaiLiveUser = {
  id: number
  /**
   * `users.username` — stale/null for most users. NOT a student code: the code sent to
   * admissions is read off the learner's `batch_user` row inside
   * {@link resolveMasaiLiveConnectSid}.
   */
  username?: string | null
  email?: string | null
  meta?: unknown
}

export type MasaiLiveConnectSidResult =
  | { ok: true; connectSid: string }
  | {
      ok: false
      kind: 'not_found' | 'config' | 'admissions' | 'no_cookie'
      status: number
      message: string
    }

function istNowSqlString(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')
}

async function flagMasaiLiveEnrolmentNotFound(
  user: MasaiLiveUser,
): Promise<void> {
  const existingMeta = (user.meta as Record<string, unknown>) || {}
  await db
    .update(users)
    .set({
      meta: { ...existingMeta, masai_live_enrolment_not_found: true },
      updatedAt: istNowSqlString(),
    })
    .where(eq(users.id, user.id))
}

/**
 * Resolve admissions `connect.sid` for the given LMS user via enrolment_id +
 * admissions `/auth/lms-auto-login`. Port of experience-api `userAuth.ts`.
 */
export async function resolveMasaiLiveConnectSid(
  user: MasaiLiveUser,
  redirect: string = MASAI_LIVE_DEFAULT_REDIRECT,
): Promise<MasaiLiveConnectSidResult> {
  // The student code is read off the same batch_user row as the enrolment id — it is
  // the source of truth per enrolment, whereas users.username is stale/null.
  const rows = await db
    .select({
      enrolmentId: batchUser.enrolmentId,
      username: batchUser.username,
    })
    .from(batchUser)
    .where(
      and(
        eq(batchUser.userId, user.id),
        isNotNull(batchUser.enrolmentId),
        isNull(batchUser.deletedAt),
      ),
    )
    .orderBy(desc(batchUser.id))
    .limit(1)

  const enrolmentId = rows.at(0)?.enrolmentId
  const studentCode = rows.at(0)?.username?.trim() || ''
  if (enrolmentId == null) {
    await flagMasaiLiveEnrolmentNotFound(user)
    return {
      ok: false,
      kind: 'not_found',
      status: 404,
      message: 'User enrolment not found',
    }
  }

  const secret = process.env.ADMISSIONS_SSO_SECRET || ''
  const baseUrl = (process.env.ADMISSIONS_API_BASE_URL || '').replace(/\/$/, '')

  if (!secret || !baseUrl) {
    logger.error({
      msg: 'Masai Live login: ADMISSIONS_SSO_SECRET or ADMISSIONS_API_BASE_URL not configured',
      fn: FN,
    })
    return {
      ok: false,
      kind: 'config',
      status: 503,
      message: 'Admissions login is not available right now',
    }
  }

  const token = jwt.sign(
    {
      student_code: studentCode,
      email: user.email || '',
      enrolment_id: Number(enrolmentId),
    },
    secret,
    { expiresIn: ADMISSIONS_SSO_TOKEN_EXPIRY },
  )

  const admissionsResponse = await fetch(`${baseUrl}/auth/lms-auto-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, redirect }),
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
  })

  if (admissionsResponse.status >= 400) {
    const data = (await admissionsResponse.json().catch(() => null)) as {
      error?: unknown
    } | null
    const admissionsError = data?.error
    const admissionsLooksLikeNotFound =
      admissionsResponse.status === 404 ||
      admissionsError === 'User not found' ||
      (typeof admissionsError === 'string' &&
        admissionsError.toLowerCase().includes('not found'))

    if (admissionsLooksLikeNotFound) {
      await flagMasaiLiveEnrolmentNotFound(user)
      return {
        ok: false,
        kind: 'not_found',
        status: 404,
        message: 'User enrolment not found',
      }
    }

    logger.error({
      msg: 'Masai Live login: admissions returned error',
      fn: FN,
      status: admissionsResponse.status,
      data,
    })
    return {
      ok: false,
      kind: 'admissions',
      status: admissionsResponse.status,
      message:
        (typeof admissionsError === 'string' && admissionsError) ||
        'Admissions authentication failed',
    }
  }

  const setCookieHeaders =
    typeof admissionsResponse.headers.getSetCookie === 'function'
      ? admissionsResponse.headers.getSetCookie()
      : (() => {
          const single = admissionsResponse.headers.get('set-cookie')
          return single ? [single] : undefined
        })()

  const connectSid = extractCookieValue(setCookieHeaders, 'connect.sid')

  if (!connectSid) {
    logger.error({
      msg: 'Masai Live login: connect.sid cookie missing from admissions response',
      fn: FN,
    })
    return {
      ok: false,
      kind: 'no_cookie',
      status: 502,
      message: 'Failed to obtain session from admissions',
    }
  }

  return { ok: true, connectSid }
}

/** Load the fields `resolveMasaiLiveConnectSid` needs from `users`. */
export async function loadMasaiLiveUser(
  userId: number,
): Promise<MasaiLiveUser | null> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      meta: users.meta,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return rows.at(0) ?? null
}
