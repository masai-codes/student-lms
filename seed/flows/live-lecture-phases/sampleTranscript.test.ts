import { describe, expect, it } from 'vitest'

import { parseLectureTranscriptSegments } from '@/server/learn/utils/formatLectureTranscript'

import {
  SAMPLE_TRANSCRIPT_PLAIN_TEXT,
  SAMPLE_TRANSCRIPT_SEGMENTS,
  SAMPLE_TRANSCRIPT_TEXT,
} from './sampleTranscript'

describe('SAMPLE_TRANSCRIPT_SEGMENTS', () => {
  it('survives the parser the cache endpoint runs it through', () => {
    const parsed = parseLectureTranscriptSegments(SAMPLE_TRANSCRIPT_SEGMENTS)

    expect(parsed).toHaveLength(SAMPLE_TRANSCRIPT_SEGMENTS.length)
    expect(parsed[0].text).toContain('welcome back')
  })

  it('uses unique ids and forward-moving, non-empty spans', () => {
    const ids = new Set(SAMPLE_TRANSCRIPT_SEGMENTS.map((segment) => segment.id))
    expect(ids.size).toBe(SAMPLE_TRANSCRIPT_SEGMENTS.length)

    let previousStart = -1
    for (const segment of SAMPLE_TRANSCRIPT_SEGMENTS) {
      expect(segment.start).toBeGreaterThan(previousStart)
      expect(segment.end).toBeGreaterThan(segment.start)
      expect(segment.text.trim()).not.toBe('')
      previousStart = segment.start
    }
  })

  it('spans both timestamp formats, starting at zero and crossing the hour', () => {
    expect(SAMPLE_TRANSCRIPT_SEGMENTS[0].start).toBe(0)
    expect(
      SAMPLE_TRANSCRIPT_SEGMENTS.some((segment) => segment.start >= 3600),
    ).toBe(true)
  })

  it('is long enough to overflow the collapsed transcript tab', () => {
    expect(SAMPLE_TRANSCRIPT_SEGMENTS.length).toBeGreaterThan(20)
  })
})

describe('SAMPLE_TRANSCRIPT_TEXT', () => {
  it('mirrors the segment text as the lectures_ai.transcript companion', () => {
    for (const segment of SAMPLE_TRANSCRIPT_SEGMENTS) {
      expect(SAMPLE_TRANSCRIPT_TEXT).toContain(segment.text)
    }
  })
})

describe('SAMPLE_TRANSCRIPT_PLAIN_TEXT', () => {
  it('is multi-paragraph text with no timestamps', () => {
    expect(SAMPLE_TRANSCRIPT_PLAIN_TEXT.split('\n\n').length).toBeGreaterThan(1)
    expect(SAMPLE_TRANSCRIPT_PLAIN_TEXT).not.toMatch(/\[\d+:\d{2}\]/)
  })
})
