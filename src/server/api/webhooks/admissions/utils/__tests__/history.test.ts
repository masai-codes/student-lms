import { describe, expect, it } from 'vitest'

import {
  appendSectionHistory,
  appendTimelineEntry,
  newSectionHistory,
  newTimeline,
} from '@/server/api/webhooks/admissions/utils/history'

const ENTRY = { type: 'created', date: '2026-07-24T10:00:00Z' }
const NEXT = { type: 'revived', date: '2026-07-25T10:00:00Z' }

describe('newTimeline / appendTimelineEntry (batch_user.history)', () => {
  it('creates a single-entry timeline', () => {
    expect(newTimeline(ENTRY)).toEqual({ timeline: [ENTRY] })
  })

  it('appends to an existing timeline and preserves other keys', () => {
    const result = appendTimelineEntry({ timeline: [ENTRY], foo: 1 }, NEXT)
    expect(result).toEqual({ foo: 1, timeline: [ENTRY, NEXT] })
  })

  it('starts a fresh timeline when the column is null', () => {
    expect(appendTimelineEntry(null, ENTRY)).toEqual({ timeline: [ENTRY] })
  })

  it('ignores a non-array timeline value', () => {
    expect(appendTimelineEntry({ timeline: 'bad' }, ENTRY)).toEqual({
      timeline: [ENTRY],
    })
  })
})

describe('newSectionHistory / appendSectionHistory (section_user.meta)', () => {
  it('creates a single-entry history', () => {
    expect(newSectionHistory(ENTRY)).toEqual({ history: [ENTRY] })
  })

  it('appends to an existing history and preserves other keys', () => {
    const result = appendSectionHistory({ history: [ENTRY], keep: true }, NEXT)
    expect(result).toEqual({ keep: true, history: [ENTRY, NEXT] })
  })

  it('starts a fresh history when meta is undefined', () => {
    expect(appendSectionHistory(undefined, ENTRY)).toEqual({ history: [ENTRY] })
  })
})
