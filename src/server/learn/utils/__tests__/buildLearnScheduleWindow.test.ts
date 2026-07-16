import { describe, expect, it } from 'vitest'

import { buildLearnScheduleWindow } from '@/server/learn/utils/buildLearnScheduleWindow'

// Fixed "now": 2026-06-22 12:00:00 UTC (= 17:30 IST — same calendar date in both
// zones, so the IST and UTC day boundaries coincide here).
const NOW_MS = Date.UTC(2026, 5, 22, 12, 0, 0)
// Lectures/resources default + "upcoming" upper bound = next IST midnight.
const END_OF_TODAY_UTC = '2026-06-23 00:00:00'
// Legacy past/upcoming "now" = UTC now shifted +5:30 (experience-api `currDateIST`).
const LEGACY_NOW = '2026-06-22 17:30:00'
// Legacy assignment cutoff = today 18:30 UTC + 5:30 = next UTC midnight (now < 18:30 UTC).
const ASSIGNMENT_CUTOFF = '2026-06-23 00:00:00'

describe('buildLearnScheduleWindow', () => {
  describe('lectures / resources', () => {
    it('defaults to (−∞, next-UTC-midnight) when no phase or date range', () => {
      expect(
        buildLearnScheduleWindow({ learningType: 'lecture', nowMs: NOW_MS }),
      ).toEqual({
        gte: null,
        lt: END_OF_TODAY_UTC,
      })
    })

    it('treats resources like lectures for the default window', () => {
      expect(
        buildLearnScheduleWindow({ learningType: 'resource', nowMs: NOW_MS }),
      ).toEqual({
        gte: null,
        lt: END_OF_TODAY_UTC,
      })
    })

    it('upcoming → [now+5:30, next-UTC-midnight)', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          schedulePhase: 'upcoming',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: LEGACY_NOW, lt: END_OF_TODAY_UTC })
    })

    it('past → (−∞, now+5:30)', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          schedulePhase: 'past',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: null, lt: LEGACY_NOW })
    })

    it('"all" phase behaves like the default window', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          schedulePhase: 'all',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: null, lt: END_OF_TODAY_UTC })
    })

    it('upcoming overrides a provided date range', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          schedulePhase: 'upcoming',
          scheduleStartDate: '2026-06-01',
          scheduleEndDate: '2026-06-10',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: LEGACY_NOW, lt: END_OF_TODAY_UTC })
    })

    it('applies a date range (end inclusive via exclusive next-day bound)', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          scheduleStartDate: '2026-06-01',
          scheduleEndDate: '2026-06-10',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: '2026-06-01 00:00:00', lt: '2026-06-11 00:00:00' })
    })

    it('caps a future end date at today (#6)', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          scheduleStartDate: '2026-06-01',
          scheduleEndDate: '2026-12-31',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: '2026-06-01 00:00:00', lt: '2026-06-23 00:00:00' })
    })

    it('defaults the end to today when only a start date is given', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          scheduleStartDate: '2026-06-01',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: '2026-06-01 00:00:00', lt: '2026-06-23 00:00:00' })
    })

    // Regression: `schedule` is stored as IST wall-clock, so the day boundary must
    // be the IST day. During 00:00–05:30 IST the UTC date still lags the IST date by
    // a day; the boundary must not collapse to the previous (UTC) midnight or a
    // lecture scheduled for "today (IST)" gets hidden.
    describe('IST day boundary during early-morning IST', () => {
      // 2026-07-14 20:00:00 UTC = 2026-07-15 01:30 IST → IST "today" is Jul-15,
      // so the tomorrow boundary is next IST midnight (Jul-16 00:00), NOT the next
      // UTC midnight (Jul-15 00:00).
      const EARLY_IST_MORNING = Date.UTC(2026, 6, 14, 20, 0, 0)

      it('default window uses the IST day, not the UTC day', () => {
        expect(
          buildLearnScheduleWindow({
            learningType: 'lecture',
            nowMs: EARLY_IST_MORNING,
          }),
        ).toEqual({ gte: null, lt: '2026-07-16 00:00:00' })
      })

      it('upcoming window uses the IST day for its upper bound', () => {
        expect(
          buildLearnScheduleWindow({
            learningType: 'lecture',
            schedulePhase: 'upcoming',
            nowMs: EARLY_IST_MORNING,
          }),
        ).toEqual({ gte: '2026-07-15 01:30:00', lt: '2026-07-16 00:00:00' })
      })
    })

    it('ignores a malformed start date and falls back to the phase window', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          scheduleStartDate: 'not-a-date',
          schedulePhase: 'past',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: null, lt: LEGACY_NOW })
    })

    it('falls back to today when the end date is malformed', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          scheduleStartDate: '2026-06-01',
          scheduleEndDate: 'garbage',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: '2026-06-01 00:00:00', lt: '2026-06-23 00:00:00' })
    })
  })

  describe('assignments', () => {
    it('defaults to (−∞, legacy 18:30-UTC + 5:30 cutoff)', () => {
      expect(
        buildLearnScheduleWindow({ learningType: 'assignment', nowMs: NOW_MS }),
      ).toEqual({
        gte: null,
        lt: ASSIGNMENT_CUTOFF,
      })
    })

    it('rolls the cutoff to the next day once past 18:30 UTC', () => {
      // 2026-06-22 19:00 UTC > 18:30 → base = next-day 18:30 UTC, +5:30 = 2026-06-24 00:00.
      expect(
        buildLearnScheduleWindow({
          learningType: 'assignment',
          nowMs: Date.UTC(2026, 5, 22, 19, 0, 0),
        }),
      ).toEqual({ gte: null, lt: '2026-06-24 00:00:00' })
    })

    it('applies a date range when provided', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'assignment',
          scheduleStartDate: '2026-06-01',
          scheduleEndDate: '2026-06-10',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: '2026-06-01 00:00:00', lt: '2026-06-11 00:00:00' })
    })

    it('ignores schedulePhase (assignments have no upcoming/past)', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'assignment',
          schedulePhase: 'upcoming',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: null, lt: ASSIGNMENT_CUTOFF })
    })
  })
})
