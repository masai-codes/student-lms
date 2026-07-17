import { describe, expect, it } from 'vitest'

import { decodeMarkdownPayload } from '../decodeMarkdownPayload'

describe('decodeMarkdownPayload', () => {
  it('returns empty string for empty input', () => {
    expect(decodeMarkdownPayload('')).toBe('')
  })

  it('converts escaped newlines to real newlines', () => {
    expect(decodeMarkdownPayload('line one\\nline two')).toBe(
      'line one\nline two',
    )
  })

  it('leaves plain markdown unchanged', () => {
    const markdown = '- item\nhttps://example.com\n\n**bold**'
    expect(decodeMarkdownPayload(markdown)).toBe(markdown)
  })
})
