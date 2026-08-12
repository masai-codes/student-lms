import { afterEach, describe, expect, it } from 'vitest'

import { buildAssessSectionTiming } from '../buildAssessSectionTiming'

/** 2026-08-08 12:14:10 IST — when submission 6689378 opened its test. */
const START_IST = new Date('2026-08-08T12:14:10+05:30')

/** Assignment 81793: case3, attemptInWindow, 90 min inside a 12:00–20:00 window. */
const WINDOWED_81793 = {
  assignmentCase: 'case3',
  sectionDetailTime: '5400',
  extendedDeadline: undefined,
  attemptInWindow: true,
  durationMinutes: 90,
  concludes: '2026-08-08 20:00:00',
} as const

describe('buildAssessSectionTiming', () => {
  describe('attemptInWindow (fixed duration inside a longer window)', () => {
    // Regression: assignment 81793 handed its first students ~8 hours instead
    // of 90 minutes. The port carried over only the case3 remaining-time rule
    // and dropped experience-api's attemptInWindow override entirely.
    it('sends the configured duration, not the remaining window', () => {
      const timing = buildAssessSectionTiming({
        ...WINDOWED_81793,
        now: START_IST,
      })

      expect(timing.overrideSectionTime).toBe(5400)
      // The pre-fix value, for contrast: 20:00:00 - 12:14:10 = 7h45m50s.
      expect(timing.overrideSectionTime).not.toBe(27950)
    })

    it('sends mustEndOnOrBefore as the absolute instant of the IST deadline', () => {
      const timing = buildAssessSectionTiming({
        ...WINDOWED_81793,
        now: START_IST,
      })

      // 2026-08-08 20:00:00 IST === 14:30:00 UTC.
      expect(timing.mustEndOnOrBefore).toBe('2026-08-08T14:30:00.000Z')
    })

    // A student starting 25 minutes before the deadline still gets a 90-minute
    // section, but mustEndOnOrBefore is what actually stops them at 20:00.
    it('keeps the full duration for a late starter and relies on the deadline', () => {
      const timing = buildAssessSectionTiming({
        ...WINDOWED_81793,
        now: new Date('2026-08-08T19:35:00+05:30'),
      })

      expect(timing.overrideSectionTime).toBe(5400)
      expect(timing.mustEndOnOrBefore).toBe('2026-08-08T14:30:00.000Z')
    })

    // Parity with experience-api: the window branch does not consult the
    // remaining time, so an expired assignment still reports its duration and
    // is stopped by the (already past) mustEndOnOrBefore.
    it('still reports the duration once the deadline has passed', () => {
      const timing = buildAssessSectionTiming({
        ...WINDOWED_81793,
        now: new Date('2026-08-08T21:00:00+05:30'),
      })

      expect(timing.overrideSectionTime).toBe(5400)
      expect(timing.mustEndOnOrBefore).toBe('2026-08-08T14:30:00.000Z')
    })

    it('falls back to the case rule when duration is missing, but still sends the deadline', () => {
      const timing = buildAssessSectionTiming({
        ...WINDOWED_81793,
        durationMinutes: undefined,
        now: START_IST,
      })

      expect(timing.overrideSectionTime).toBe(27950) // case3 remaining time
      expect(timing.mustEndOnOrBefore).toBe('2026-08-08T14:30:00.000Z')
    })

    it('ignores a non-positive duration', () => {
      expect(
        buildAssessSectionTiming({
          ...WINDOWED_81793,
          durationMinutes: 0,
          now: START_IST,
        }).overrideSectionTime,
      ).toBe(27950)
    })
  })

  describe('case3 without attemptInWindow', () => {
    // case3 replaced the assignments.gets_remaining_time boolean: "the student
    // gets whatever is left until concludes" is the spec, not a defect.
    it('grants the remaining time and omits mustEndOnOrBefore', () => {
      const timing = buildAssessSectionTiming({
        assignmentCase: 'case3',
        sectionDetailTime: '5400',
        extendedDeadline: undefined,
        attemptInWindow: undefined,
        durationMinutes: undefined,
        concludes: '2026-08-08 20:00:00',
        now: START_IST,
      })

      expect(timing.overrideSectionTime).toBe(27950)
      expect(timing.mustEndOnOrBefore).toBeUndefined()
    })

    it('floors fractional remaining seconds', () => {
      const timing = buildAssessSectionTiming({
        assignmentCase: 'case3',
        sectionDetailTime: '5400',
        extendedDeadline: undefined,
        attemptInWindow: false,
        durationMinutes: undefined,
        concludes: '2026-08-08 20:00:00',
        now: new Date('2026-08-08T19:59:59.400+05:30'),
      })

      expect(timing.overrideSectionTime).toBe(1)
      expect(Number.isInteger(timing.overrideSectionTime)).toBe(true)
    })
  })

  describe('case2', () => {
    it('caps the configured time at the remaining time', () => {
      const timing = buildAssessSectionTiming({
        assignmentCase: 'case2',
        sectionDetailTime: '5400',
        extendedDeadline: undefined,
        attemptInWindow: undefined,
        durationMinutes: undefined,
        concludes: '2026-08-08 13:00:00',
        now: START_IST,
      })

      // 13:00:00 - 12:14:10 = 2750s, less than the configured 5400s.
      expect(timing.overrideSectionTime).toBe(2750)
    })

    it('adds extended_deadline only when the configured time fits', () => {
      const fits = buildAssessSectionTiming({
        assignmentCase: 'case2',
        sectionDetailTime: '5400',
        extendedDeadline: 600,
        attemptInWindow: undefined,
        durationMinutes: undefined,
        concludes: '2026-08-08 20:00:00',
        now: START_IST,
      })
      expect(fits.overrideSectionTime).toBe(6000)

      const doesNotFit = buildAssessSectionTiming({
        assignmentCase: 'case2',
        sectionDetailTime: '5400',
        extendedDeadline: 600,
        attemptInWindow: undefined,
        durationMinutes: undefined,
        concludes: '2026-08-08 13:00:00',
        now: START_IST,
      })
      expect(doesNotFit.overrideSectionTime).toBe(2750)
    })
  })

  describe('fallbacks', () => {
    it('returns 1 when the deadline has already passed', () => {
      expect(
        buildAssessSectionTiming({
          assignmentCase: 'case3',
          sectionDetailTime: '5400',
          extendedDeadline: undefined,
          attemptInWindow: undefined,
          durationMinutes: undefined,
          concludes: '2026-08-08 12:00:00',
          now: START_IST,
        }).overrideSectionTime,
      ).toBe(1)
    })

    it('returns 1 when sectionDetailTime or concludes is absent', () => {
      expect(
        buildAssessSectionTiming({
          assignmentCase: 'case3',
          sectionDetailTime: undefined,
          extendedDeadline: undefined,
          attemptInWindow: undefined,
          durationMinutes: undefined,
          concludes: '2026-08-08 20:00:00',
          now: START_IST,
        }).overrideSectionTime,
      ).toBe(1)

      expect(
        buildAssessSectionTiming({
          assignmentCase: 'case3',
          sectionDetailTime: '5400',
          extendedDeadline: undefined,
          attemptInWindow: undefined,
          durationMinutes: undefined,
          concludes: null,
          now: START_IST,
        }).overrideSectionTime,
      ).toBe(1)
    })

    it('ignores an unknown case', () => {
      expect(
        buildAssessSectionTiming({
          assignmentCase: 'case1',
          sectionDetailTime: '5400',
          extendedDeadline: undefined,
          attemptInWindow: undefined,
          durationMinutes: undefined,
          concludes: '2026-08-08 20:00:00',
          now: START_IST,
        }).overrideSectionTime,
      ).toBe(1)
    })
  })

  // Regression: an earlier incident shortened every student's section by
  // 19800s (5h30m). `concludes` is IST wall-clock with no zone; pairing
  // `Date.now() + 5.5h` with a process-timezone-parsed `new Date(concludes)`
  // double-counts the offset on an IST process. parseIstToMs pins the offset
  // explicitly, so results must not depend on the server's timezone.
  describe('timezone independence', () => {
    const savedTz = process.env.TZ

    afterEach(() => {
      if (savedTz === undefined) delete process.env.TZ
      else process.env.TZ = savedTz
    })

    it('produces identical output on a UTC server and an IST server', () => {
      process.env.TZ = 'UTC'
      const utc = buildAssessSectionTiming({
        ...WINDOWED_81793,
        now: START_IST,
      })

      process.env.TZ = 'Asia/Kolkata'
      const ist = buildAssessSectionTiming({
        ...WINDOWED_81793,
        now: START_IST,
      })

      expect(utc).toEqual(ist)
      expect(utc.mustEndOnOrBefore).toBe('2026-08-08T14:30:00.000Z')
    })

    it('does not shift case3 remaining time by the IST offset', () => {
      for (const tz of ['UTC', 'Asia/Kolkata', 'America/New_York']) {
        process.env.TZ = tz
        const timing = buildAssessSectionTiming({
          assignmentCase: 'case3',
          sectionDetailTime: '5400',
          extendedDeadline: undefined,
          attemptInWindow: undefined,
          durationMinutes: undefined,
          concludes: '2026-08-08 20:00:00',
          now: START_IST,
        })
        // Not 27950 - 19800 = 8150, and not 27950 + 19800 = 47750.
        expect(timing.overrideSectionTime).toBe(27950)
      }
    })
  })
})
