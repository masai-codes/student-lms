import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { zefLmsMetaData, zefLmsPollsQuestions, zefLmsQuiz } from '@/db/schema'
import type { InLecturePopupElements } from '@/server/learn/lectureDetailTypes'

/**
 * Parse a ZEF timestamp to epoch-ms *on its own wall clock*, deliberately
 * discarding any zone designator.
 *
 * The two sides of the offset subtraction reach us stamped differently:
 * `zef_lms_*.start_timestamp` / `end_timestamp` / `scheduled_at` are DATETIME
 * columns read through the `istDatetime` type, so they arrive as
 * `2026-08-14T12:13:48+05:30`, while `meta.effectiveScheduledAt.value` is
 * written by ZEF as `2026-08-14T12:11:16.006Z`. Those suffixes describe the
 * writer, not a shared clock — the `effectiveScheduledAt` rows sourced from
 * `schedule` carry the DATETIME's exact wall-clock digits restamped as `Z`,
 * which is only self-consistent if the two are compared digit-for-digit.
 * Trusting the suffixes instead would inject a fixed 5h30m error and push every
 * element to a negative `startSec`.
 *
 * Since only the *difference* between two of these values is ever used,
 * stripping the zone from both sides is exact — and leaves the `scheduledAt`
 * fallback path byte-identical to its previous behaviour, where both operands
 * carried the same `+05:30` stamp.
 */
function toWallClockMs(timestamp: string | null | undefined): number | null {
  if (!timestamp) return null
  const trimmed = timestamp.trim()
  if (trimmed === '') return null
  const naive = trimmed
    .replace(' ', 'T')
    .replace(/(?:[zZ]|[+-]\d{2}:?\d{2})$/, '')
  const ms = new Date(`${naive}Z`).getTime()
  return Number.isFinite(ms) ? ms : null
}

/**
 * The recording-aware video t=0 recorded on the meta row, or `null` when the
 * lecture predates the sync or the value is unusable.
 *
 * `scheduled_at` is when the session was *meant* to start; a recording that
 * actually rolled late (or was trimmed at the head) makes it a wrong origin,
 * shifting every popup by the difference. ZEF backfills the corrected origin
 * into `meta.effectiveScheduledAt`, which is already post-trim — its sibling
 * `leadingTrimSeconds` is a record of what was cut, not a further adjustment to
 * apply here.
 */
function readEffectiveScheduledAt(meta: unknown): string | null {
  const parsed =
    typeof meta === 'string'
      ? ((): unknown => {
          try {
            return JSON.parse(meta)
          } catch {
            return null
          }
        })()
      : meta

  if (!parsed || typeof parsed !== 'object') return null
  const effective = (parsed as Record<string, unknown>).effectiveScheduledAt
  if (!effective || typeof effective !== 'object') return null
  const value = (effective as Record<string, unknown>).value
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

/** IST is a fixed UTC+05:30 (India has no DST). */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

/**
 * Whether a meta row's ZEF-sourced timestamps are stored as IST wall clock.
 *
 * Mirrors `isIstStored` in the admin's `zefQuizTimestampTz.ts`, deliberately: the
 * two apps must agree on this or the same lecture reads differently in the panel
 * and in the player.
 *
 * Everything in this area — `effectiveScheduledAt`, `scheduled_at`, and the poll
 * windows — is IST wall clock, which is what ZEF sends and what the import
 * stores verbatim. The quiz windows are the lone exception: ZEF sends those
 * already pushed 5h30m ahead, as if the IST wall clock had been read as UTC and
 * converted back to IST, so only they need pulling down onto everyone else's
 * clock. Rows written by the manual pop-up upload (`source: 'lms'`) are
 * converted on the way in and pass through untouched.
 *
 * KNOWN LIMITATION: this treats the convention as a property of the row's
 * source, which is not what the data always says — some `zef` rows carry a real
 * UTC quiz and some `lms` rows carry an IST one. Those land 5h30m out and are
 * dropped downstream. Fixing that properly means normalising at ingest rather
 * than compensating on read.
 */
function isIstStored(source: 'zef' | 'lms'): boolean {
  return source === 'zef'
}

/**
 * A stored timestamp as true-UTC epoch ms: the wall-clock digits, pulled back by
 * the IST offset when the value is one of the IST-stored ones. Returns `null`
 * when the timestamp is missing or unparseable.
 */
function toUtcMs(
  timestamp: string | null | undefined,
  istStored: boolean,
): number | null {
  const ms = toWallClockMs(timestamp)
  if (ms === null) return null
  return istStored ? ms - IST_OFFSET_MS : ms
}

/**
 * Convert an element's timestamp into a video-relative offset in whole seconds,
 * measured from `referenceMs` (video t=0). Returns `null` when the timestamp is
 * missing or unparseable so the caller can drop the element.
 */
function toOffsetSec(
  timestamp: string | null,
  referenceMs: number,
  istStored: boolean,
): number | null {
  const ms = toUtcMs(timestamp, istStored)
  if (ms === null) return null
  return Math.round((ms - referenceMs) / 1000)
}

/**
 * In-lecture popup elements (quizzes + polls) for a lecture, sourced from the
 * ZEF ⇆ LMS tables rather than `lectures.settings`.
 *
 * `zef_lms_meta_data` is unique per `lecture_id`, so a lecture has at most one
 * meta row. When there is no meta row the lecture has no configured elements and
 * we return empties. Otherwise the quizzes and polls hang off `meta.id`.
 *
 * Each element's absolute start/end timestamps are converted here into the
 * video-relative window (`startSec` / `endSec`) using video t=0 as the origin —
 * `meta.effectiveScheduledAt.value` when ZEF has synced the recording-aware
 * origin, otherwise the meta row's nominal `scheduledAt`. Elements are dropped
 * when they can't be placed — no usable reference, or a missing/unparseable
 * timestamp. Remaining window validation (start < end, clamp to the real video
 * duration, ordering) stays client-side, where the loaded video's duration is
 * known.
 */
export async function getInLecturePopupElements(
  lectureId: number,
): Promise<InLecturePopupElements> {
  const metaRows = await db
    .select({
      id: zefLmsMetaData.id,
      lectureId: zefLmsMetaData.lectureId,
      scheduledAt: zefLmsMetaData.scheduledAt,
      meta: zefLmsMetaData.meta,
      source: zefLmsMetaData.source,
      createdAt: zefLmsMetaData.createdAt,
      updatedAt: zefLmsMetaData.updatedAt,
    })
    .from(zefLmsMetaData)
    .where(eq(zefLmsMetaData.lectureId, lectureId))
    .limit(1)

  const meta = metaRows[0]
  if (!meta) return { metaData: null, quiz: [], polls: [] }

  const effectiveScheduledAt = readEffectiveScheduledAt(meta.meta)

  const metaData = {
    id: meta.id,
    lectureId: meta.lectureId,
    scheduledAt: meta.scheduledAt ?? null,
    effectiveScheduledAt,
    source: meta.source,
    createdAt: meta.createdAt ?? null,
    updatedAt: meta.updatedAt ?? null,
  }

  // Video t=0: the recording-aware `effectiveScheduledAt` when ZEF has synced
  // one, else the session's nominal `scheduledAt`. Without either reference we
  // can't place any element on the video timeline, so surface the meta row but
  // no elements.
  // The origin is taken as stored: it shares the poll windows' clock, and only
  // the quiz windows are corrected against it.
  const istStored = isIstStored(meta.source)
  const referenceMs =
    toWallClockMs(effectiveScheduledAt) ?? toWallClockMs(meta.scheduledAt)
  if (referenceMs === null) {
    return { metaData, quiz: [], polls: [] }
  }

  const [quizRows, pollRows] = await Promise.all([
    db
      .select({
        id: zefLmsQuiz.id,
        assessmentId: zefLmsQuiz.assessmentId,
        status: zefLmsQuiz.status,
        startTimestamp: zefLmsQuiz.startTimestamp,
        endTimestamp: zefLmsQuiz.endTimestamp,
      })
      .from(zefLmsQuiz)
      .where(
        and(
          eq(zefLmsQuiz.zefLmsMetaDataId, meta.id),
          eq(zefLmsQuiz.status, 'active'),
        ),
      ),
    db
      .select({
        id: zefLmsPollsQuestions.id,
        question: zefLmsPollsQuestions.question,
        options: zefLmsPollsQuestions.options,
        status: zefLmsPollsQuestions.status,
        startTimestamp: zefLmsPollsQuestions.startTimestamp,
        endTimestamp: zefLmsPollsQuestions.endTimestamp,
      })
      .from(zefLmsPollsQuestions)
      .where(
        and(
          eq(zefLmsPollsQuestions.zefLmsMetaDataId, meta.id),
          eq(zefLmsPollsQuestions.status, 'active'),
        ),
      ),
  ])

  return {
    metaData,
    quiz: quizRows.flatMap((row) => {
      // Quiz windows are the only ones stored ahead of the reference's clock.
      const startSec = toOffsetSec(row.startTimestamp, referenceMs, istStored)
      const endSec = toOffsetSec(row.endTimestamp, referenceMs, istStored)
      if (startSec === null || endSec === null) return []
      return [
        {
          id: row.id,
          assessmentId: row.assessmentId,
          status: row.status,
          startSec,
          endSec,
        },
      ]
    }),
    polls: pollRows.flatMap((row) => {
      // Polls already share the reference's clock — never corrected.
      const startSec = toOffsetSec(row.startTimestamp, referenceMs, false)
      const endSec = toOffsetSec(row.endTimestamp, referenceMs, false)
      if (startSec === null || endSec === null) return []
      return [
        {
          id: row.id,
          question: row.question,
          options: row.options,
          status: row.status,
          startSec,
          endSec,
        },
      ]
    }),
  }
}
