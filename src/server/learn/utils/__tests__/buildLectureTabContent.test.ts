import { describe, expect, it } from 'vitest'

import type { LearningItem } from '@/server/learn/types'
import {
  buildLectureTabContent,
  buildLectureTranscriptSource,
} from '../buildLectureTabContent'

const associatedItem: LearningItem = {
  id: 2,
  learningType: 'assignment',
  title: 'Lab 1',
  hostName: 'Host',
  scheduleDate: null,
  concludes: null,
  type: 'assignment',
  category: 'coding',
  isOptional: 'mandatory',
  moduleName: 'Module 1',
  attendance: null,
  optionalAttendance: null,
  assignmentProgressStatus: null,
  resourcePhase: null,
  assignmentWeightage: null,
  listingCtas: {
    joinLive: 'hidden',
    joinZoomLink: null,
    isNewZoomRedirection: false,
    enableZoomWebView: false,
    showAttendance: false,
    assignmentStatusChip: null,
    assignmentDeadlineLabel: null,
    assignmentScore: null,
  },
}

const ids = { lectureId: 7, batchId: 12, sectionId: 34 }

describe('buildLectureTabContent', () => {
  it('maps lecture notes and AI summary', () => {
    const tabs = buildLectureTabContent({
      notes: '  Instructor notes  ',
      lecturesAi: { summary: 'Key points', hasTranscript: false },
      associatedItems: [associatedItem],
      ...ids,
    })

    expect(tabs.notes).toBe('Instructor notes')
    expect(tabs.aiSummary).toBe('Key points')
    expect(tabs.associatedItems).toHaveLength(1)
    expect(tabs.associatedItems[0]?.title).toBe('Lab 1')
  })

  it('returns null AI summary and an unavailable transcript when row is missing', () => {
    const tabs = buildLectureTabContent({
      notes: null,
      lecturesAi: null,
      associatedItems: [],
      ...ids,
    })

    expect(tabs.notes).toBeNull()
    expect(tabs.aiSummary).toBeNull()
    expect(tabs.transcript).toEqual({ available: false, url: null })
  })

  it('treats blank summary text as missing', () => {
    const tabs = buildLectureTabContent({
      notes: null,
      lecturesAi: { summary: '   ', hasTranscript: true },
      associatedItems: [],
      ...ids,
    })

    expect(tabs.aiSummary).toBeNull()
    expect(tabs.associatedItems).toEqual([])
  })

  it('never embeds transcript text — only a cacheable pointer', () => {
    const tabs = buildLectureTabContent({
      notes: null,
      lecturesAi: { summary: null, hasTranscript: true },
      associatedItems: [],
      ...ids,
    })

    expect(tabs.transcript).toEqual({
      available: true,
      url: '/api/cache/transcript/12/34/7',
    })
    expect(JSON.stringify(tabs)).not.toContain('segments')
  })
})

describe('buildLectureTranscriptSource', () => {
  it('points at the cache endpoint when a transcript exists', () => {
    expect(
      buildLectureTranscriptSource({ hasTranscript: true, ...ids }),
    ).toEqual({ available: true, url: '/api/cache/transcript/12/34/7' })
  })

  it('reports unavailable when there is no transcript', () => {
    expect(
      buildLectureTranscriptSource({ hasTranscript: false, ...ids }),
    ).toEqual({ available: false, url: null })
  })

  it.each([
    ['batch', { batchId: null, sectionId: 34 }],
    ['section', { batchId: 12, sectionId: null }],
  ])(
    'reports unavailable when the lecture has no %s — it cannot be addressed on the cache path',
    (_label, scope) => {
      expect(
        buildLectureTranscriptSource({
          hasTranscript: true,
          lectureId: 7,
          ...scope,
        }),
      ).toEqual({ available: false, url: null })
    },
  )
})
