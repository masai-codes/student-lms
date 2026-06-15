import { useLayoutEffect, useRef, useState } from 'react'
import {
  nextSubtitleStartOffset,
  sliceSubtitleText,
  VOICE_SUBTITLE_MAX_LINES,
  VOICE_SUBTITLE_TRIM_LINES,
} from '@/components/features/chatbot/utils/voiceSubtitleViewport'

export function useVoiceSubtitleViewport(text: string, streamId: string) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const startOffsetRef = useRef(0)
  const [displayText, setDisplayText] = useState(text)

  useLayoutEffect(() => {
    startOffsetRef.current = 0
    setDisplayText(text)
  }, [streamId])

  useLayoutEffect(() => {
    const textElement = textRef.current
    if (!textElement) {
      return
    }

    const lineHeight = parseFloat(getComputedStyle(textElement).lineHeight) || 20
    const maxHeight = lineHeight * VOICE_SUBTITLE_MAX_LINES

    const measureHeight = (slice: string) => {
      textElement.textContent = slice
      return textElement.scrollHeight
    }

    const nextOffset = nextSubtitleStartOffset({
      text,
      currentOffset: startOffsetRef.current,
      maxHeight,
      lineHeight,
      trimLines: VOICE_SUBTITLE_TRIM_LINES,
      measureHeight,
    })

    startOffsetRef.current = nextOffset
    setDisplayText(sliceSubtitleText(text, nextOffset))
  }, [text, streamId])

  return { textRef, displayText }
}
