import { describe, expect, it } from 'vitest'

import { buildLectureTabContent } from '../buildLectureTabContent'

describe('buildLectureTabContent', () => {
  it('maps lecture fields and published AI summary', () => {
    const tabs = buildLectureTabContent({
      description: '  About this lecture  ',
      notes: 'Instructor notes',
      lecturesAi: {
        summary: 'Key points',
        transcript: null,
        transcriptSegments: null,
        isSummaryPublished: 1,
      },
      associatedItems: [
        { id: 2, kind: 'assignment', title: 'Lab 1', meta: '20 May, 10:00 AM' },
      ],
    })

    expect(tabs.description).toBe('About this lecture')
    expect(tabs.notes).toBe('Instructor notes')
    expect(tabs.aiSummary).toBe('Key points')
    expect(tabs.associatedItems).toHaveLength(1)
    expect(tabs.associatedItems[0]?.title).toBe('Lab 1')
  })

  it('omits unpublished AI summary', () => {
    const tabs = buildLectureTabContent({
      description: null,
      notes: null,
      lecturesAi: {
        summary: 'Hidden',
        transcript: 'Hello',
        transcriptSegments: null,
        isSummaryPublished: 0,
      },
      associatedItems: [],
    })

    expect(tabs.aiSummary).toBeNull()
    expect(tabs.transcript).toBe('Hello')
    expect(tabs.associatedItems).toEqual([])
  })
})
