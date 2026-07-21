import { describe, expect, it } from 'vitest'

import {
  LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT,
  LECTURE_SPLIT_CHAT_STORAGE_KEY,
} from '../lectureSplitLayout'

describe('lectureSplitLayout', () => {
  it('opens the chat side panel by default', () => {
    expect(LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT).toBe(true)
  })

  it('exposes a stable storage key for the open preference', () => {
    expect(LECTURE_SPLIT_CHAT_STORAGE_KEY).toBe('lecture-split-chat-open')
  })
})
