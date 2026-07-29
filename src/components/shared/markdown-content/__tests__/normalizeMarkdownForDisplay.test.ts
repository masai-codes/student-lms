import { describe, expect, it } from 'vitest'

import {
  normalizeListContinuations,
  normalizeMarkdownForDisplay,
} from '../normalizeMarkdownForDisplay'

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

    expect(normalizeListContinuations(input)).toContain('  https://example.com')
  })

  it('leaves paragraphs after a blank line outside the list', () => {
    const input = `- It incorrectly flags a genuine transaction as fraud
- It correctly catches actual fraud about 95% of the time

Both error rates sound impressively small.

The model was not broken.`

    expect(normalizeListContinuations(input)).toBe(input)
  })

  it('does not slurp a thematic break into the preceding list item', () => {
    const input = `- Only bullet

Trailing paragraph.

---`

    expect(normalizeListContinuations(input)).toBe(input)
  })
})

describe('normalizeMarkdownForDisplay', () => {
  it('collapses runs of more than two newlines', () => {
    expect(normalizeMarkdownForDisplay('a\n\n\n\nb')).toBe('a\n\nb')
  })
})
