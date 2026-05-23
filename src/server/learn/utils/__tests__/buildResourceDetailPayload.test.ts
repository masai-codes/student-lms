import { describe, expect, it } from 'vitest'

import { buildResourceDetailPayload } from '../buildResourceDetailPayload'
import type { LearnHubDetailPayload } from '@/server/learn/types'

const core: LearnHubDetailPayload = {
  id: 99,
  title: 'Week 1 Pre-read',
  hostName: 'Ravi',
  displayDate: '20 May, 10:00 AM',
  priority: 'recommended',
  tags: ['reading', 'pre-read', 'Week 1'],
  discussions: [],
}

const schedule = '2026-05-20T10:00:00.000Z'
const concludes = '2026-05-20T12:00:00.000Z'

describe('buildResourceDetailPayload', () => {
  it('builds pre-read resource in during phase with notes body', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildResourceDetailPayload(
      core,
      {
        category: 'pre-read',
        schedule,
        concludes,
        hostAvatarUrl: '/avatar.png',
        notes: '  Read chapter 2  ',
        description: 'Fallback',
        settings: null,
      },
      scheduleMs + 60_000,
    )

    expect(payload.resourceKind).toBe('pre-read')
    expect(payload.phase).toBe('during')
    expect(payload.body).toBe('Read chapter 2')
    expect(payload.hideNotes).toBe(false)
  })

  it('respects hide_notes setting', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildResourceDetailPayload(
      core,
      {
        category: 'notes',
        schedule,
        concludes,
        hostAvatarUrl: null,
        notes: 'Hidden notes',
        description: null,
        settings: { hide_notes: 1 },
      },
      scheduleMs + 60_000,
    )

    expect(payload.resourceKind).toBe('notes')
    expect(payload.hideNotes).toBe(true)
    expect(payload.body).toBe('Hidden notes')
  })

  it('builds material resource in before phase', () => {
    const scheduleMs = new Date(schedule).getTime()
    const payload = buildResourceDetailPayload(
      core,
      {
        category: 'reference',
        schedule,
        concludes,
        hostAvatarUrl: null,
        notes: null,
        description: 'Overview text',
        settings: null,
      },
      scheduleMs - 60_000,
    )

    expect(payload.resourceKind).toBe('material')
    expect(payload.phase).toBe('before')
    expect(payload.body).toBe('Overview text')
  })
})
