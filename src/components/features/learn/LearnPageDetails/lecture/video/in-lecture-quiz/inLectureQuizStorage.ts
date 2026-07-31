'use client'

/**
 * Persisted outcome of an in-lecture popup quiz, keyed per lecture in
 * localStorage.
 * - `auto_submitted` — the 7s client-side countdown ran out; suppresses re-show.
 * - `stopped` — user stopped the countdown; recorded but still re-shows on revisit.
 * - `submitted` — the Assess Platform confirmed (via webhook) the student
 *   actually submitted the quiz; suppresses re-show, same as `auto_submitted`.
 */
export type StoredQuizStatus = 'auto_submitted' | 'stopped' | 'submitted'

export type LectureQuizStatuses = Record<string, StoredQuizStatus>

const KEY_PREFIX = 'masai:in-lecture-quiz:'

function storageKey(lectureId: number): string {
  return `${KEY_PREFIX}${lectureId}`
}

/** All stored quiz statuses for a lecture (`{ [quizId]: status }`). */
export function loadLectureQuizStatuses(lectureId: number): LectureQuizStatuses {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(storageKey(lectureId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed == null || typeof parsed !== 'object') return {}
    const result: LectureQuizStatuses = {}
    for (const [id, status] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        status === 'auto_submitted' ||
        status === 'stopped' ||
        status === 'submitted'
      ) {
        result[id] = status
      }
    }
    return result
  } catch {
    return {}
  }
}

/** Merge a single quiz's outcome into the lecture's stored map. */
export function saveLectureQuizStatus(
  lectureId: number,
  quizId: string,
  status: StoredQuizStatus,
): void {
  if (typeof window === 'undefined') return
  try {
    const current = loadLectureQuizStatuses(lectureId)
    current[quizId] = status
    window.localStorage.setItem(storageKey(lectureId), JSON.stringify(current))
  } catch {
    /* storage unavailable (private mode / quota) — non-fatal */
  }
}
