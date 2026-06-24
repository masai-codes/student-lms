import { describe, expect, it } from 'vitest'

import { buildLectureTabContent } from '../buildLectureTabContent'

describe('buildLectureTabContent', () => {
  it('maps lecture notes and AI summary', () => {
    const tabs = buildLectureTabContent({
      notes: '  Instructor notes  ',
      lecturesAi: {
        summary: 'Key points',
        transcript: null,
        transcriptSegments: null,
      },
      associatedItems: [
        { id: 2, kind: 'assignment', title: 'Lab 1', meta: '20 May, 10:00 AM' },
      ],
    })

    expect(tabs.notes).toBe('Instructor notes')
    expect(tabs.aiSummary).toBe('Key points')
    expect(tabs.transcriptSegments).toEqual([])
    expect(tabs.associatedItems).toHaveLength(1)
    expect(tabs.associatedItems[0]?.title).toBe('Lab 1')
  })

  it('returns null AI summary when row is missing', () => {
    const tabs = buildLectureTabContent({
      notes: null,
      lecturesAi: null,
      associatedItems: [],
    })

    expect(tabs.notes).toBeNull()
    expect(tabs.aiSummary).toBeNull()
    expect(tabs.transcript).toBeNull()
    expect(tabs.transcriptSegments).toEqual([])
  })

  it('treats blank summary text as missing', () => {
    const tabs = buildLectureTabContent({
      notes: null,
      lecturesAi: {
        summary: '   ',
        transcript: 'Hello',
        transcriptSegments: null,
      },
      associatedItems: [],
    })

    expect(tabs.aiSummary).toBeNull()
    expect(tabs.transcript).toBe('Hello')
    expect(tabs.transcriptSegments).toEqual([])
    expect(tabs.associatedItems).toEqual([])
  })

  it('parses structured transcript segments from JSON string', () => {
    const tabs = buildLectureTabContent({
      notes: null,
      lecturesAi: {
        summary: null,
        transcript: null,
        transcriptSegments: JSON.stringify([
          { id: 1, start: 0, end: 4.5, text: 'Hello there' },
          { id: 2, start: 4.5, end: 9, text: 'Welcome to class' },
        ]),
      },
      associatedItems: [],
    })

    expect(tabs.transcriptSegments).toEqual([
      { id: 1, start: 0, end: 4.5, text: 'Hello there' },
      { id: 2, start: 4.5, end: 9, text: 'Welcome to class' },
    ])
    expect(tabs.transcript).toBe('Hello there\n\nWelcome to class')
  })

  it('parses transcript segments whose start/end are stored as numeric strings', () => {
    const tabs = buildLectureTabContent({
      notes: null,
      lecturesAi: {
        summary: null,
        transcript: null,
        transcriptSegments: JSON.stringify([
          { id: 0, start: '0.0', end: '0.5', text: 'Yeah.' },
          {
            id: 1,
            start: '0.5',
            end: '2.84',
            text: 'So today we will talk about the Q data structure.',
          },
        ]),
      },
      associatedItems: [],
    })

    expect(tabs.transcriptSegments).toEqual([
      { id: 0, start: 0, end: 0.5, text: 'Yeah.' },
      {
        id: 1,
        start: 0.5,
        end: 2.84,
        text: 'So today we will talk about the Q data structure.',
      },
    ])
  })
})
