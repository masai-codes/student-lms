import type { InLecturePopupQuiz } from '@/server/learn/lectureDetailTypes'

/**
 * A validated, second-based popup quiz derived from the raw `HH:MM:SS` payload.
 * `id` is stable across renders (template + start) so per-quiz trigger state can
 * be keyed by it instead of by array index.
 */
export type NormalizedInLectureQuiz = {
  id: string
  startSec: number
  endSec: number
  assessmentTemplate: string
}

/** Parse `HH:MM:SS` (or `MM:SS`) into whole seconds, or `null` when malformed. */
export function parseTimestampToSeconds(value: string): number | null {
  const parts = value.split(':')
  if (parts.length < 2 || parts.length > 3) return null
  let seconds = 0
  for (const part of parts) {
    const n = Number(part)
    if (!Number.isFinite(n) || n < 0) return null
    seconds = seconds * 60 + n
  }
  return seconds
}

/**
 * Convert the raw payload into validated, sorted quizzes:
 * - start/end parsed from `HH:MM:SS`, `start < end`, both finite and >= 0
 * - dropped when the window starts at/after the video's end (when known)
 * - sorted by `startSec` so "one active at a time" queueing is deterministic
 */
export function normalizeInLectureQuizzes(
  quizzes: Array<InLecturePopupQuiz>,
  totalDuration: number,
): Array<NormalizedInLectureQuiz> {
  const hasDuration = Number.isFinite(totalDuration) && totalDuration > 0
  const normalized: Array<NormalizedInLectureQuiz> = []

  for (const quiz of quizzes) {
    const startSec = parseTimestampToSeconds(quiz.timeStamp.start)
    const endSec = parseTimestampToSeconds(quiz.timeStamp.end)
    if (startSec === null || endSec === null) continue
    if (startSec >= endSec) continue
    if (hasDuration && startSec >= totalDuration) continue

    normalized.push({
      id: `${quiz.assessmentTemplate}@${startSec}`,
      startSec,
      // Clamp the resume point to the real duration so "skip to lecture" can
      // never seek past the end once metadata is known.
      endSec: hasDuration ? Math.min(endSec, totalDuration) : endSec,
      assessmentTemplate: quiz.assessmentTemplate,
    })
  }

  normalized.sort((a, b) => a.startSec - b.startSec)
  return normalized
}
