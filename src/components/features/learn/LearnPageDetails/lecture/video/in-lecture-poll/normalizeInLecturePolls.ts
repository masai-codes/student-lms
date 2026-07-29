import type { InLecturePopupPollElement } from '@/server/learn/lectureDetailTypes'

/**
 * A validated popup poll derived from the API's already-second-based element.
 * `id` is the element's stable DB id (from `zef_lms_polls_questions`), so
 * per-poll trigger state can be keyed by it instead of by array index.
 */
export type NormalizedInLecturePoll = {
  id: string
  startSec: number
  endSec: number
  question: string
  options: Array<string>
}

/** `options` is stored as JSON; only a non-empty array of strings is usable. */
function parseOptions(options: unknown): Array<string> | null {
  if (!Array.isArray(options)) return null
  const strings = options.filter(
    (option): option is string =>
      typeof option === 'string' && option.trim().length > 0,
  )
  return strings.length >= 2 ? strings : null
}

/**
 * Validate + clamp the API's popup poll elements against the loaded video —
 * mirrors {@link normalizeInLectureQuizzes}:
 * - `startSec` / `endSec` come pre-converted from the server (video-relative
 *   seconds); here we only enforce a sane window and the real duration.
 * - dropped when the window is malformed (`startSec < 0`, `startSec >= endSec`)
 * - dropped when the window starts at/after the video's end (when known)
 * - dropped when `question` is blank or `options` isn't a usable string list
 * - `endSec` clamped to the real duration so "skip to lecture" can't seek past
 *   the end once metadata is known
 * - sorted by `startSec` so "one active at a time" queueing is deterministic
 */
export function normalizeInLecturePolls(
  polls: Array<InLecturePopupPollElement>,
  totalDuration: number,
): Array<NormalizedInLecturePoll> {
  const hasDuration = Number.isFinite(totalDuration) && totalDuration > 0
  const normalized: Array<NormalizedInLecturePoll> = []

  for (const poll of polls) {
    const { startSec, endSec, question } = poll
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) continue
    if (startSec < 0) continue
    if (startSec >= endSec) continue
    if (hasDuration && startSec >= totalDuration) continue
    if (!question || !question.trim()) continue

    const options = parseOptions(poll.options)
    if (!options) continue

    normalized.push({
      id: String(poll.id),
      startSec,
      endSec: hasDuration ? Math.min(endSec, totalDuration) : endSec,
      question,
      options,
    })
  }

  normalized.sort((a, b) => a.startSec - b.startSec)
  return normalized
}
