import { describe, expect, it } from 'vitest'
import { buildNotesOutline } from '@/server/api/ai-tutor/services/buildNotesOutline'

describe('buildNotesOutline', () => {
  it('returns markdown headings when present', () => {
    expect(
      buildNotesOutline('# Arrays\nBody\n## Time complexity\nMore'),
    ).toBe('# Arrays\n## Time complexity')
  })

  it('falls back to a preview when there are no headings', () => {
    const notes = 'A'.repeat(700)
    expect(buildNotesOutline(notes)).toBe(`${'A'.repeat(600)}...`)
  })
})
