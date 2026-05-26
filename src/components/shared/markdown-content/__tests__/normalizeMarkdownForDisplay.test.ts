import { describe, expect, it } from 'vitest'

import { normalizeListContinuations, normalizeMarkdownForDisplay } from '../normalizeMarkdownForDisplay'

describe('normalizeListContinuations', () => {
  it('indents URL lines so they stay inside the list item', () => {
    const input = `- Join the helpdesk link:
https://us06web.zoom.us/j/83629643104

- Second item`

    expect(normalizeListContinuations(input)).toBe(
      `- Join the helpdesk link:
  https://us06web.zoom.us/j/83629643104

- Second item`,
    )
  })

  it('indents continuation after a blank line within the same bullet', () => {
    const input = `- First item with text:

https://example.com

- Second`

    expect(normalizeListContinuations(input)).toContain(
      '  https://example.com',
    )
  })
})

describe('normalizeMarkdownForDisplay', () => {
  it('collapses runs of more than two newlines', () => {
    expect(normalizeMarkdownForDisplay('a\n\n\n\nb')).toBe('a\n\nb')
  })
})
