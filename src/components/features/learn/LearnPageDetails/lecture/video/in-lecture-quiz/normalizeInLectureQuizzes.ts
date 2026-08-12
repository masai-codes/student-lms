import type { InLecturePopupQuizElement } from '@/server/learn/lectureDetailTypes'

/**
 * A validated popup quiz derived from the API's already-second-based element.
 * `id` is the element's stable DB id (from `zef_lms_quiz`), so per-quiz trigger
 * state can be keyed by it instead of by array index.
 */
export type NormalizedInLectureQuiz = {
  id: string
  startSec: number
  endSec: number
  assessmentId: string
}

/**
 * Validate + clamp the API's popup quiz elements against the loaded video:
 * - `startSec` / `endSec` come pre-converted from the server (video-relative
 *   seconds); here we only enforce a sane window and the real duration.
 * - dropped when the window is malformed (`startSec < 0`, `startSec >= endSec`)
 * - dropped when the window starts at/after the video's end (when known)
 * - `endSec` clamped to the real duration so "skip to lecture" can't seek past
 *   the end once metadata is known
 * - sorted by `startSec` so "one active at a time" queueing is deterministic
 */
export function normalizeInLectureQuizzes(
  quizzes: Array<InLecturePopupQuizElement>,
  totalDuration: number,
): Array<NormalizedInLectureQuiz> {
  const hasDuration = Number.isFinite(totalDuration) && totalDuration > 0
  const normalized: Array<NormalizedInLectureQuiz> = []

  for (const quiz of quizzes) {
    const { startSec, endSec, assessmentId } = quiz
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) continue
    if (startSec < 0) continue
    if (startSec >= endSec) continue
    if (hasDuration && startSec >= totalDuration) continue

    normalized.push({
      id: String(quiz.id),
      startSec,
      endSec: hasDuration ? Math.min(endSec, totalDuration) : endSec,
      assessmentId,
    })
  }

  normalized.sort((a, b) => a.startSec - b.startSec)
  return normalized
}
