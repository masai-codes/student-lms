import { describe, expect, it } from 'vitest'

import { assigneeDividerPlacements } from '../ChatThread'
import type { Message } from '../types'

const NAME = 'Program Co-ordinator'

function msg(
  role: Message['role'],
  createdAt: string | null,
  isAutoReply = false,
): Message {
  return { role, text: 'hi', createdAt, isAutoReply }
}

describe('assigneeDividerPlacements', () => {
  it('returns no dividers when there is no assignee', () => {
    const placements = assigneeDividerPlacements(
      [msg('user', '2026-01-01T10:00:00Z')],
      undefined,
      null,
      'open',
    )

    expect(placements.size).toBe(0)
  })

  it('places a single divider before the first agent/bot message on a normal (non-reopened) ticket', () => {
    const messages = [
      msg('user', '2026-01-01T10:00:00Z'),
      msg('bot', '2026-01-01T10:00:05Z', true),
    ]

    const placements = assigneeDividerPlacements(messages, NAME, null, 'open')

    expect(Array.from(placements.entries())).toEqual([[1, NAME]])
  })

  it('places the reopen divider after all current messages when every message was created as part of the reopen itself', () => {
    // Regression: the student's escalation reason + its auto-reply are both
    // stamped at/after reopenedAt with no older message preceding them — the
    // divider must not render above the very first message.
    const reopenedAt = '2026-02-01T09:00:00Z'
    const messages = [
      msg('user', '2026-02-01T09:00:01Z'),
      msg('bot', '2026-02-01T09:00:02Z', true),
    ]

    const placements = assigneeDividerPlacements(
      messages,
      NAME,
      reopenedAt,
      're-opened',
    )

    expect(placements.get(0)).toBeUndefined()
    expect(placements.get(1)).toBe(NAME)
    expect(placements.get(messages.length)).toBe(NAME)
    expect(placements.size).toBe(2)
  })

  it('places the reopen divider after all current messages when reopened but the student has not replied yet', () => {
    const reopenedAt = '2026-02-01T09:00:00Z'
    const messages = [
      msg('user', '2026-01-31T18:00:00Z'),
      msg('bot', '2026-01-31T18:00:05Z', true),
    ]

    const placements = assigneeDividerPlacements(
      messages,
      NAME,
      reopenedAt,
      're-opened',
    )

    expect(placements.get(messages.length)).toBe(NAME)
    expect(placements.size).toBe(2)
  })

  it('places the reopen divider right after the old messages when a new reply follows the reopen', () => {
    const reopenedAt = '2026-02-01T09:00:00Z'
    const messages = [
      msg('user', '2026-01-30T10:00:00Z'),
      msg('bot', '2026-01-30T10:00:05Z', true),
      msg('agent', '2026-01-30T10:05:00Z'),
      msg('user', '2026-02-01T09:05:00Z'),
    ]

    const placements = assigneeDividerPlacements(
      messages,
      NAME,
      reopenedAt,
      're-opened',
    )

    expect(placements.get(3)).toBe(NAME)
    expect(placements.get(0)).toBeUndefined()
    expect(placements.get(messages.length)).toBeUndefined()
  })

  it('does not duplicate the divider when the reopen boundary lands on the first agent message', () => {
    const reopenedAt = '2026-02-01T09:00:00Z'
    const messages = [
      msg('user', '2026-01-30T10:00:00Z'),
      msg('bot', '2026-02-01T09:05:00Z', true),
    ]

    const placements = assigneeDividerPlacements(
      messages,
      NAME,
      reopenedAt,
      're-opened',
    )

    expect(placements.size).toBe(1)
    expect(placements.get(1)).toBe(NAME)
  })

  it('falls back to placing the divider at the end when reopenedAt is missing', () => {
    const messages = [msg('user', '2026-01-30T10:00:00Z')]

    const placements = assigneeDividerPlacements(
      messages,
      NAME,
      null,
      're-opened',
    )

    expect(placements.get(messages.length)).toBe(NAME)
  })

  it('ignores the reopen divider entirely for non-reopened tickets even with a reopenedAt value', () => {
    const messages = [
      msg('user', '2026-01-30T10:00:00Z'),
      msg('bot', '2026-01-30T10:00:05Z', true),
    ]

    const placements = assigneeDividerPlacements(
      messages,
      NAME,
      '2026-01-01T00:00:00Z',
      'resolved',
    )

    expect(Array.from(placements.entries())).toEqual([[1, NAME]])
  })
})
