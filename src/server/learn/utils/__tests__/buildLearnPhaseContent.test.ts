import { describe, expect, it } from 'vitest'

import {
  buildAssignmentPhaseContent,
  buildResourcePhaseContent,
} from '../buildLearnPhaseContent'

describe('buildLearnPhaseContent', () => {
  it('builds assignment phase copy with opens hint before start', () => {
    const content = buildAssignmentPhaseContent(
      'practice',
      'before',
      '2026-05-20T10:00:00.000Z',
    )

    expect(content.title).toContain('Practice')
    expect(content.scheduleHint).toMatch(/^Opens /)
  })

  it('builds resource phase copy with unlock hint before start', () => {
    const content = buildResourcePhaseContent('notes', 'during', null)

    expect(content.title).toContain('available')
    expect(content.scheduleHint).toBeNull()
  })
})
