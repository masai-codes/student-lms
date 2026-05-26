import { describe, expect, it } from 'vitest'

import { toMarkdownPreviewText } from '../toMarkdownPreviewText'

describe('toMarkdownPreviewText', () => {
  it('strips markdown syntax for card previews', () => {
    const input = '**All the best** for the [evaluation](https://example.com)'
    expect(toMarkdownPreviewText(input)).toBe('All the best for the evaluation')
  })

  it('collapses extra whitespace', () => {
    expect(toMarkdownPreviewText('one\n\n\n\ntwo')).toBe('one\n\ntwo')
  })
})
