import { describe, expect, it } from 'vitest'
import {
  nextSubtitleStartOffset,
  sliceSubtitleText,
  VOICE_SUBTITLE_MAX_LINES,
  VOICE_SUBTITLE_TRIM_LINES,
} from '@/components/features/chatbot/utils/voiceSubtitleViewport'

function charsPerLineMeasure(charsPerLine: number) {
  return (slice: string) => Math.ceil(slice.length / charsPerLine) * 20
}

describe('sliceSubtitleText', () => {
  it('trims leading whitespace after slicing', () => {
    expect(sliceSubtitleText('   hello world', 3)).toBe('hello world')
  })
})

describe('nextSubtitleStartOffset', () => {
  const lineHeight = 20
  const maxHeight = lineHeight * VOICE_SUBTITLE_MAX_LINES
  const measureHeight = charsPerLineMeasure(10)

  it('returns the current offset when content fits', () => {
    expect(
      nextSubtitleStartOffset({
        text: 'short line',
        currentOffset: 0,
        maxHeight,
        lineHeight,
        trimLines: VOICE_SUBTITLE_TRIM_LINES,
        measureHeight,
      }),
    ).toBe(0)
  })

  it('advances the offset when content exceeds the viewport', () => {
    const text = 'a'.repeat(120)
    const offset = nextSubtitleStartOffset({
      text,
      currentOffset: 0,
      maxHeight,
      lineHeight,
      trimLines: VOICE_SUBTITLE_TRIM_LINES,
      measureHeight,
    })

    expect(offset).toBeGreaterThan(0)
    expect(measureHeight(sliceSubtitleText(text, offset))).toBeLessThanOrEqual(maxHeight)
  })

  it('removes at least three lines worth of content in one trim step', () => {
    const text = 'a'.repeat(200)
    const offset = nextSubtitleStartOffset({
      text,
      currentOffset: 0,
      maxHeight,
      lineHeight,
      trimLines: VOICE_SUBTITLE_TRIM_LINES,
      measureHeight,
    })

    expect(offset).toBeGreaterThanOrEqual(VOICE_SUBTITLE_TRIM_LINES * 10 - 5)
    expect(measureHeight(sliceSubtitleText(text, offset))).toBeLessThanOrEqual(maxHeight)
  })
})
