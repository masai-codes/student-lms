import { cacheGetJson, cacheSetJson } from '@/server/redis/cache'

/**
 * Tracks which in-lecture popup quiz attempts (`uniqueID`s) have been graded,
 * so the polling status endpoint can tell an open quiz modal to react. Backed
 * by Redis for cross-worker correctness in prod, with an in-process Map as a
 * fallback so it still works when Redis is disabled (e.g. local dev) — same
 * "optimisation, never a hard dependency" shape as the other redis/* helpers,
 * except here the in-memory fallback is a real (single-process) source of
 * truth rather than a pure no-op, since there's no DB row for this signal.
 */

const GRADED_TTL_SECONDS = 6 * 60 * 60 // 6 hours — comfortably covers a rewatch session

const localGraded = new Map<string, number>() // uniqueId -> expiry epoch ms

function pruneLocal(): void {
  const now = Date.now()
  for (const [key, expiresAt] of localGraded) {
    if (expiresAt <= now) localGraded.delete(key)
  }
}

function gradedCacheKey(uniqueId: string): string {
  return `in-lecture-quiz:graded:${uniqueId}`
}

export async function markInLectureQuizGraded(uniqueId: string): Promise<void> {
  localGraded.set(uniqueId, Date.now() + GRADED_TTL_SECONDS * 1000)
  await cacheSetJson(gradedCacheKey(uniqueId), true, GRADED_TTL_SECONDS)
}

async function isInLectureQuizGraded(uniqueId: string): Promise<boolean> {
  pruneLocal()
  if (localGraded.has(uniqueId)) return true
  return (await cacheGetJson<boolean>(gradedCacheKey(uniqueId))) === true
}
