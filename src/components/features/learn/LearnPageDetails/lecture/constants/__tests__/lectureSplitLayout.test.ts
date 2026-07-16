import { describe, expect, it } from 'vitest'

import {
  getLectureSplitChatOpenWidthCss,
  LECTURE_SPLIT_CHAT_MAX_WIDTH_PX,
  LECTURE_SPLIT_CHAT_MIN_WIDTH_PX,
  LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT,
  LECTURE_SPLIT_CHAT_OPEN_WIDTH_PERCENT,
} from '../lectureSplitLayout'

describe('lectureSplitLayout', () => {
  it('defaults the desktop chat sidebar to collapsed', () => {
    expect(LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT).toBe(false)
  })

  it('builds a clamped open width for the chat sidebar', () => {
    expect(getLectureSplitChatOpenWidthCss()).toBe(
      `clamp(${LECTURE_SPLIT_CHAT_MIN_WIDTH_PX}px, ${LECTURE_SPLIT_CHAT_OPEN_WIDTH_PERCENT}%, ${LECTURE_SPLIT_CHAT_MAX_WIDTH_PX}px)`,
    )
  })
})
