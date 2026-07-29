import { describe, expect, it } from 'vitest'

import {
  buildTranscriptDownloadText,
  buildTranscriptFileName,
  formatTranscriptTimestamp,
} from '../lectureTranscriptUtils'

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

describe('buildTranscriptDownloadText', () => {
  it('prefixes every segment with its timestamp', () => {
    expect(
      buildTranscriptDownloadText(
        [
          { id: 1, start: 0, end: 4, text: 'Hello there' },
          { id: 2, start: 65, end: 70, text: '  Welcome to class  ' },
        ],
        null,
      ),
    ).toBe('[0:00] Hello there\n[1:05] Welcome to class')
  })

  it('falls back to the trimmed plain text when there are no segments', () => {
    expect(buildTranscriptDownloadText([], '  A flat transcript\n')).toBe(
      'A flat transcript',
    )
  })

  it('prefers segments over the plain-text fallback', () => {
    expect(
      buildTranscriptDownloadText(
        [{ id: 1, start: 2, end: 4, text: 'Segmented' }],
        'Flat',
      ),
    ).toBe('[0:02] Segmented')
  })

  it('returns an empty string when there is nothing to download', () => {
    expect(buildTranscriptDownloadText([], null)).toBe('')
    expect(buildTranscriptDownloadText([], '   ')).toBe('')
  })
})

describe('buildTranscriptFileName', () => {
  it('embeds the lecture id when known', () => {
    expect(buildTranscriptFileName(42)).toBe('lecture-42-transcript.txt')
  })

  it('falls back to an unnumbered name', () => {
    expect(buildTranscriptFileName(null)).toBe('lecture-transcript.txt')
  })
})
