import { describe, expect, it } from 'vitest'

import type { DisplayMessage } from '@/components/features/chatbot/types'
import {
  CHAT_USER_MESSAGE_ATTR,
  computeScrollTopToAlignMessageAtTop,
  findLatestUserMessage,
  getScrollSpacerHeightPx,
  getUserMessageMaxHeightPx,
  USER_MESSAGE_MAX_VIEWPORT_RATIO,
} from './chatScroll'

const messages: DisplayMessage[] = [
  { id: '1', role: 'user', content: 'Hello' },
  { id: '2', role: 'assistant', content: 'Hi there' },
  { id: '3', role: 'user', content: 'Follow up' },
]

describe('chatScroll', () => {
  it('exports the user message viewport ratio constant', () => {
    expect(USER_MESSAGE_MAX_VIEWPORT_RATIO).toBe(0.3)
    expect(CHAT_USER_MESSAGE_ATTR).toBe('data-chat-user-message-id')
  })

  it('calculates user message max height as 30% of viewport', () => {
    expect(getUserMessageMaxHeightPx(1000)).toBe(300)
    expect(getUserMessageMaxHeightPx(0)).toBe(0)
  })

  it('calculates scroll spacer height as 70% of viewport', () => {
    expect(getScrollSpacerHeightPx(1000)).toBe(700)
    expect(getScrollSpacerHeightPx(0)).toBe(0)
  })

  it('finds the latest user message in a transcript', () => {
    expect(findLatestUserMessage(messages)).toEqual({
      id: '3',
      role: 'user',
      content: 'Follow up',
    })
  })

  it('returns undefined when there are no user messages', () => {
    expect(
      findLatestUserMessage([{ id: '1', role: 'assistant', content: 'Only assistant' }]),
    ).toBeUndefined()
    expect(findLatestUserMessage([])).toBeUndefined()
  })

  it('computes scrollTop to align a message with the container top', () => {
    const container = {
      scrollTop: 120,
      getBoundingClientRect: () => ({ top: 100 }),
    } as HTMLElement
    const messageEl = {
      getBoundingClientRect: () => ({ top: 180 }),
    } as HTMLElement

    expect(computeScrollTopToAlignMessageAtTop(container, messageEl)).toBe(200)
  })
})
