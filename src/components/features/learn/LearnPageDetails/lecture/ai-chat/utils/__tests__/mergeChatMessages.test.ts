import { describe, expect, it, vi } from 'vitest'

import { formatChatTimestamp, mergeChatMessages } from '../mergeChatMessages'
import type { LectureChatMessage } from '../../types'

function makeMessage(
  partial: Partial<LectureChatMessage> & { id: string; timestamp: number },
): LectureChatMessage {
  return {
    role: 'user',
    content: 'hi',
    source: 'live-text',
    ...partial,
  }
}

describe('mergeChatMessages', () => {
  it('orders messages by ascending timestamp', () => {
    const result = mergeChatMessages(
      [makeMessage({ id: 'a', timestamp: 30 })],
      [makeMessage({ id: 'b', timestamp: 10 })],
      [makeMessage({ id: 'c', timestamp: 20 })],
    )
    expect(result.map((m) => m.id)).toEqual(['b', 'c', 'a'])
  })

  it('deduplicates messages by id, preserving the first occurrence', () => {
    const result = mergeChatMessages(
      [
        makeMessage({
          id: 'shared',
          timestamp: 5,
          source: 'history',
          content: 'first',
        }),
      ],
      [
        makeMessage({
          id: 'shared',
          timestamp: 8,
          source: 'live-text',
          content: 'second',
        }),
        makeMessage({ id: 'unique', timestamp: 1 }),
      ],
    )

    expect(result.map((m) => m.id)).toEqual(['unique', 'shared'])
    expect(result.find((m) => m.id === 'shared')?.content).toBe('first')
  })

  it('returns empty array when no messages are provided', () => {
    expect(mergeChatMessages()).toEqual([])
    expect(mergeChatMessages([], [])).toEqual([])
  })
})

describe('formatChatTimestamp', () => {
  it('returns "Just now" for very recent timestamps', () => {
    const now = new Date('2026-05-25T10:00:00Z').getTime()
    vi.useFakeTimers()
    vi.setSystemTime(now)
    expect(formatChatTimestamp(now - 5_000)).toBe('Just now')
    vi.useRealTimers()
  })

  it('returns a clock-style label for older timestamps', () => {
    const now = new Date('2026-05-25T10:00:00Z').getTime()
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const label = formatChatTimestamp(now - 5 * 60_000)
    expect(label).not.toBe('Just now')
    expect(label.length).toBeGreaterThan(0)
    vi.useRealTimers()
  })

  it('returns empty string for invalid input', () => {
    expect(formatChatTimestamp(Number.NaN)).toBe('')
  })
})
