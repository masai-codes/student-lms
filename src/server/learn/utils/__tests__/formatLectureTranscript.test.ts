import { describe, expect, it } from 'vitest'

import {
  buildTranscriptPlainText,
  parseLectureTranscriptSegments,
} from '../formatLectureTranscript'

describe('parseLectureTranscriptSegments', () => {
  it('returns empty array when input is null', () => {
    expect(parseLectureTranscriptSegments(null)).toEqual([])
  })

  it('parses already-array input and assigns fallback ids when missing', () => {
    const result = parseLectureTranscriptSegments([
      { start: 0, end: 4, text: 'Hello' },
      { id: 7, start: 4, end: 8, text: 'World' },
    ])

    expect(result).toEqual([
      { id: 0, start: 0, end: 4, text: 'Hello' },
      { id: 7, start: 4, end: 8, text: 'World' },
    ])
  })

  it('parses JSON string input', () => {
    const result = parseLectureTranscriptSegments(
      JSON.stringify([{ id: 1, start: 1.2, end: 2.5, text: 'Foo' }]),
    )
    expect(result).toEqual([{ id: 1, start: 1.2, end: 2.5, text: 'Foo' }])
  })

  it('reads transcripts/segments wrapper objects from JSON string', () => {
    const result = parseLectureTranscriptSegments(
      JSON.stringify({
        transcripts: [{ id: 9, start: 0, end: 1, text: 'wrapped' }],
      }),
    )
    expect(result).toEqual([{ id: 9, start: 0, end: 1, text: 'wrapped' }])
  })

  it('drops segments with empty text or non-numeric start', () => {
    const result = parseLectureTranscriptSegments([
      { id: 1, start: 0, end: 1, text: '' },
      { id: 2, start: 'oops', end: 2, text: 'bad start' },
      { id: 3, start: 2, end: 3, text: '   ' },
      { id: 4, start: 3, end: 4, text: 'ok' },
    ])

    expect(result).toEqual([{ id: 4, start: 3, end: 4, text: 'ok' }])
  })

  it('returns empty array for invalid JSON', () => {
    expect(parseLectureTranscriptSegments('not-json')).toEqual([])
  })

  it('clamps negative start values to zero', () => {
    const result = parseLectureTranscriptSegments([
      { id: 1, start: -5, end: 2, text: 'pre' },
    ])
    expect(result[0]?.start).toBe(0)
    expect(result[0]?.end).toBe(2)
  })

  it('coerces invalid end to start when end is missing or not greater', () => {
    const result = parseLectureTranscriptSegments([
      { id: 1, start: 5, text: 'no end' },
      { id: 2, start: 5, end: 2, text: 'inverted' },
    ])
    expect(result[0]?.end).toBe(5)
    expect(result[1]?.end).toBe(5)
  })

  it('parses segments whose start/end are numeric strings (DB JSON shape)', () => {
    const result = parseLectureTranscriptSegments(
      JSON.stringify([
        { id: 0, start: '0.0', end: '0.5', text: 'Yeah.' },
        { id: 1, start: '0.5', end: '2.84', text: 'next sentence' },
      ]),
    )

    expect(result).toEqual([
      { id: 0, start: 0, end: 0.5, text: 'Yeah.' },
      { id: 1, start: 0.5, end: 2.84, text: 'next sentence' },
    ])
  })

  it('drops segments with empty or non-numeric string start', () => {
    const result = parseLectureTranscriptSegments([
      { id: 1, start: '', end: 1, text: 'blank' },
      { id: 2, start: '   ', end: 1, text: 'whitespace' },
      { id: 3, start: '4.5', end: '6', text: 'kept' },
    ])

    expect(result).toEqual([{ id: 3, start: 4.5, end: 6, text: 'kept' }])
  })
})

describe('buildTranscriptPlainText', () => {
  it('prefers stored transcript text over segments', () => {
    expect(
      buildTranscriptPlainText({
        transcript: '  stored  ',
        segments: [{ id: 1, start: 0, end: 1, text: 'segment' }],
      }),
    ).toBe('stored')
  })

  it('falls back to joined segment text when no transcript is stored', () => {
    expect(
      buildTranscriptPlainText({
        transcript: null,
        segments: [
          { id: 1, start: 0, end: 1, text: 'one' },
          { id: 2, start: 1, end: 2, text: 'two' },
        ],
      }),
    ).toBe('one\n\ntwo')
  })

  it('returns null when nothing is available', () => {
    expect(
      buildTranscriptPlainText({ transcript: '   ', segments: [] }),
    ).toBeNull()
  })
})
