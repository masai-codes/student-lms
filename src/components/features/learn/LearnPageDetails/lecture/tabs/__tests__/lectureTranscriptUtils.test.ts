import { describe, expect, it } from 'vitest'

import { formatTranscriptTimestamp } from '../lectureTranscriptUtils'

describe('formatTranscriptTimestamp', () => {
  it('formats sub-minute timestamps as m:ss', () => {
    expect(formatTranscriptTimestamp(0)).toBe('0:00')
    expect(formatTranscriptTimestamp(7)).toBe('0:07')
    expect(formatTranscriptTimestamp(59.9)).toBe('0:59')
  })

  it('formats minute-range timestamps as m:ss', () => {
    expect(formatTranscriptTimestamp(60)).toBe('1:00')
    expect(formatTranscriptTimestamp(125)).toBe('2:05')
  })

  it('formats hour-range timestamps as h:mm:ss', () => {
    expect(formatTranscriptTimestamp(3600)).toBe('1:00:00')
    expect(formatTranscriptTimestamp(3725)).toBe('1:02:05')
  })

  it('clamps negative seconds to zero', () => {
    expect(formatTranscriptTimestamp(-10)).toBe('0:00')
  })
})
