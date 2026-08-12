import { parseIstToMs } from '@/server/time/istClock'

/**
 * Section timing for the Assess Platform `generate-test` payload.
 *
 * Two independent mechanisms decide how long a student's test section runs, and
 * conflating them is what caused the "90-minute exam ran for 8 hours" incident:
 *
 * 1. **`case`** — `case3` means *"the student gets whatever time is left until
 *    `concludes`"*. That is the specification, not a bug: `case3` replaced the
 *    old `assignments.gets_remaining_time` boolean (which is why that column is
 *    now dead). `case2` instead caps the configured `sectionDetailTime` at the
 *    remaining time, optionally extended by `extended_deadline`.
 *
 * 2. **`attemptInWindow`** — a *fixed* `duration` (minutes) that the student may
 *    start anywhere inside the longer `schedule`…`concludes` availability
 *    window. When set it OVERRIDES the case-based calculation, and Assess is
 *    additionally told `mustEndOnOrBefore` so a late starter is still cut off at
 *    the deadline rather than being handed a full `duration`.
 *
 * The original port of `createAssessPlatformUrl` carried over only (1), from an
 * older revision of experience-api that predated (2). Every `attemptInWindow`
 * evaluation therefore received the whole remaining window — e.g. assignment
 * 81793 (`duration: 90`, 12:00–20:00 IST) handed its first students ~8 hours.
 * See experience-api `resolver.ts` `createAssessPlatformUrl` (commit 12292d69).
 */

const CASE2 = 'case2'
const CASE3 = 'case3'

export type AssessSectionTiming = {
  /**
   * Seconds for the section. Only meaningful for case2/case3 payloads; the
   * caller decides whether to include it. Never below 1 — Assess treats 0/
   * negative as "unset" and would fall back to the template's own duration.
   */
  overrideSectionTime: number
  /**
   * Absolute ISO-8601 instant the attempt must end by. Only present for
   * `attemptInWindow` assignments.
   */
  mustEndOnOrBefore?: string
}

export function buildAssessSectionTiming(input: {
  /** `settings.case` */
  assignmentCase: unknown
  /** `settings.sectionDetailTime` — seconds, historically stored as a string. */
  sectionDetailTime: unknown
  /** `settings.extended_deadline` — extra seconds, case2 only. */
  extendedDeadline: unknown
  /** `settings.attemptInWindow` */
  attemptInWindow: unknown
  /** `settings.duration` — minutes. */
  durationMinutes: unknown
  /** `assignments.concludes` — IST wall-clock DATETIME, no zone. */
  concludes: string | null
  /** Injected for testability. */
  now?: Date
}): AssessSectionTiming {
  const {
    assignmentCase,
    sectionDetailTime,
    extendedDeadline,
    attemptInWindow,
    durationMinutes,
    concludes,
  } = input

  // `concludes` is an IST wall-clock DATETIME string with no zone
  // (`YYYY-MM-DD HH:MM:SS`). parseIstToMs turns it into an absolute epoch-ms
  // instant so the result is identical on a UTC server and an IST laptop.
  const nowMs = (input.now ?? new Date()).getTime()
  const concludesMs = parseIstToMs(concludes)
  const remainingSeconds =
    concludesMs == null ? Number.NaN : (concludesMs - nowMs) / 1000

  // (1) Case-based section time.
  let caseSectionTime: number | undefined
  if (
    (assignmentCase === CASE2 || assignmentCase === CASE3) &&
    sectionDetailTime != null &&
    remainingSeconds > 0
  ) {
    const configured = Number(sectionDetailTime)

    if (assignmentCase === CASE2) {
      caseSectionTime = Math.min(configured, Math.floor(remainingSeconds))
      const extended = Number(extendedDeadline)
      if (
        configured < Math.floor(remainingSeconds) &&
        Number.isFinite(extended) &&
        extended > 0
      ) {
        caseSectionTime += extended
      }
    } else {
      caseSectionTime = Math.floor(remainingSeconds)
    }
  }

  // (2) Fixed-duration window. Takes precedence when configured.
  const isWindowed = attemptInWindow === true
  const minutes = Number(durationMinutes)
  const useWindow = isWindowed && Number.isFinite(minutes) && minutes > 0

  const overrideSectionTime = useWindow
    ? minutes * 60
    : caseSectionTime != null && caseSectionTime > 0
      ? caseSectionTime
      : 1

  return {
    overrideSectionTime,
    // Sent whenever the assignment is windowed, even if `duration` is missing,
    // so Assess still enforces the deadline for a late starter.
    ...(isWindowed && concludesMs != null
      ? { mustEndOnOrBefore: new Date(concludesMs).toISOString() }
      : {}),
  }
}
