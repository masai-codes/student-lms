export const VOICE_SUBTITLE_MAX_LINES = 4
export const VOICE_SUBTITLE_TRIM_LINES = 3

export function sliceSubtitleText(text: string, startOffset: number): string {
  return text.slice(startOffset).trimStart()
}

/**
 * When `slice` overflows `maxHeight`, advance the start offset by roughly
 * `trimLines` of content (measured via `measureHeight`) until it fits.
 */
export function nextSubtitleStartOffset(params: {
  text: string
  currentOffset: number
  maxHeight: number
  lineHeight: number
  trimLines: number
  measureHeight: (slice: string) => number
}): number {
  const { text, currentOffset, maxHeight, lineHeight, trimLines, measureHeight } = params
  const initialSlice = sliceSubtitleText(text, currentOffset)

  if (!initialSlice || measureHeight(initialSlice) <= maxHeight) {
    return currentOffset
  }

  let offset = currentOffset
  let guard = 0

  while (offset < text.length && guard < 200) {
    guard += 1
    const slice = sliceSubtitleText(text, offset)
    if (!slice || measureHeight(slice) <= maxHeight) {
      return offset
    }

    const overflowHeight = measureHeight(slice) - maxHeight
    const linesToDrop = Math.max(trimLines, Math.ceil(overflowHeight / lineHeight))
    const targetHeight = measureHeight(slice) - linesToDrop * lineHeight

    let low = offset + 1
    let high = text.length
    let nextOffset = text.length

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const candidate = sliceSubtitleText(text, mid)
      if (!candidate) {
        high = mid - 1
        continue
      }

      const height = measureHeight(candidate)
      if (height <= targetHeight || height <= maxHeight) {
        nextOffset = mid
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    if (nextOffset <= offset) {
      return Math.min(offset + 1, text.length)
    }

    offset = nextOffset
  }

  return offset
}
