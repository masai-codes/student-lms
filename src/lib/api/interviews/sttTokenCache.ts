import {
  fetchInterviewSttToken,
  type InterviewSttToken,
} from '@/lib/api/interviews/interviewsApi'

const COOKIE_PREFIX = 'interview_stt_token_'
/** Refuse a cached token this close to expiry — leaves enough runway to open
 * the WebRTC connection and record an answer with it. */
const EXPIRY_SAFETY_MARGIN_MS = 20_000

type CachedToken = {
  clientSecret: string
  /** Absolute local-clock deadline, derived from `expiresIn` at cache-write
   * time — avoids relying on clock sync with our server or OpenAI's. */
  expiresAtMs: number
}

function cookieName(sessionId: number | string): string {
  return `${COOKIE_PREFIX}${sessionId}`
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`,
    ),
  )
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${Math.max(0, maxAgeSeconds)}; SameSite=Lax`
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`
}

function readCache(sessionId: number | string): CachedToken | null {
  const name = cookieName(sessionId)
  const raw = readCookie(name)
  if (!raw) return null

  try {
    const cached = JSON.parse(raw) as Partial<CachedToken>
    if (!cached.clientSecret || !cached.expiresAtMs) return null
    if (cached.expiresAtMs - EXPIRY_SAFETY_MARGIN_MS <= Date.now()) {
      clearCookie(name)
      return null
    }
    return {
      clientSecret: cached.clientSecret,
      expiresAtMs: cached.expiresAtMs,
    }
  } catch {
    clearCookie(name)
    return null
  }
}

function writeCache(
  sessionId: number | string,
  token: InterviewSttToken,
): void {
  const expiresAtMs = Date.now() + token.expiresIn * 1000
  writeCookie(
    cookieName(sessionId),
    JSON.stringify({ clientSecret: token.clientSecret, expiresAtMs }),
    token.expiresIn,
  )
}

/**
 * Returns a still-valid cached STT client secret for this session if one
 * exists, otherwise mints a fresh one from the server and caches it — so a
 * single token is reused across turns instead of minting a new one per
 * recording.
 */
export async function getOrCreateInterviewSttToken(
  sessionId: number | string,
): Promise<{ clientSecret: string }> {
  const cached = readCache(sessionId)
  if (cached) return { clientSecret: cached.clientSecret }

  const token = await fetchInterviewSttToken(sessionId)
  writeCache(sessionId, token)
  return { clientSecret: token.clientSecret }
}
