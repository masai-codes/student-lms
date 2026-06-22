import { describe, expect, it } from 'vitest'

import { buildLearnScheduleWindow } from '@/server/learn/utils/buildLearnScheduleWindow'

// Fixed "now": 2026-06-22 12:00:00 UTC.
const NOW_MS = Date.UTC(2026, 5, 22, 12, 0, 0)
const NOW = '2026-06-22 12:00:00'
const NOW_PLUS_24H = '2026-06-23 12:00:00'
// End of today IST (next IST midnight) = 2026-06-23 00:00 IST = 2026-06-22 18:30 UTC.
const IST_CUTOFF = '2026-06-22 18:30:00'

describe('buildLearnScheduleWindow', () => {
  describe('lectures / resources', () => {
    it('defaults to (−∞, now+24h) when no phase or date range', () => {
      expect(
        buildLearnScheduleWindow({ learningType: 'lecture', nowMs: NOW_MS }),
      ).toEqual({
        gte: null,
        lt: NOW_PLUS_24H,
      })
    })

    it('treats resources like lectures for the default window', () => {
      expect(
        buildLearnScheduleWindow({ learningType: 'resource', nowMs: NOW_MS }),
      ).toEqual({
        gte: null,
        lt: NOW_PLUS_24H,
      })
    })

    it('upcoming → [now, now+24h)', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          schedulePhase: 'upcoming',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: NOW, lt: NOW_PLUS_24H })
    })

    it('past → (−∞, now)', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          schedulePhase: 'past',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: null, lt: NOW })
    })

    it('"all" phase behaves like the default window', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          schedulePhase: 'all',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: null, lt: NOW_PLUS_24H })
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
      ).toEqual({ gte: NOW, lt: NOW_PLUS_24H })
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

    it('ignores a malformed start date and falls back to the phase window', () => {
      expect(
        buildLearnScheduleWindow({
          learningType: 'lecture',
          scheduleStartDate: 'not-a-date',
          schedulePhase: 'past',
          nowMs: NOW_MS,
        }),
      ).toEqual({ gte: null, lt: NOW })
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
    it('defaults to (−∞, end-of-today-IST)', () => {
      expect(
        buildLearnScheduleWindow({ learningType: 'assignment', nowMs: NOW_MS }),
      ).toEqual({
        gte: null,
        lt: IST_CUTOFF,
      })
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
      ).toEqual({ gte: null, lt: IST_CUTOFF })
    })
  })
})
