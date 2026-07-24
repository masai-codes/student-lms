import { describe, expect, it } from 'vitest'

import { decodeMarkdownPayload } from '../decodeMarkdownPayload'
import { protectMathSpans } from '../normalizeMathSpans'

describe('protectMathSpans', () => {
  it('rewrites \\(...\\) inline delimiters to $...$', () => {
    const { masked, restore } = protectMathSpans(
      'Theorem: \\(a^2 + b^2 = c^2\\) done',
    )
    expect(restore(masked)).toBe('Theorem: $a^2 + b^2 = c^2$ done')
  })

  it('rewrites \\[...\\] block delimiters to $$...$$', () => {
    const { masked, restore } = protectMathSpans('\\[E = mc^2\\]')
    expect(restore(masked)).toBe('$$E = mc^2$$')
  })

  it('leaves existing $ and $$ delimiters untouched', () => {
    const value = 'inline $x^2$ and\n\n$$\nE = mc^2\n$$'
    const { masked, restore } = protectMathSpans(value)
    expect(restore(masked)).toBe(value)
  })

  it('shields LaTeX commands from decodeMarkdownPayload corruption', () => {
    // \to / \theta / \nabla would be mangled by decode's \t / \n un-escaping.
    const value = 'Limit: \\(\\lim_{x \\to \\infty} \\theta + \\nabla f\\)'
    const { masked, restore } = protectMathSpans(value)
    const decoded = decodeMarkdownPayload(masked)

    expect(restore(decoded)).toBe(
      'Limit: $\\lim_{x \\to \\infty} \\theta + \\nabla f$',
    )
    // Without protection, decode corrupts the commands into whitespace.
    expect(decodeMarkdownPayload(value)).not.toContain('\\to')
  })

  it('is a no-op for content without math', () => {
    const value = '- item one\n- item two\n\n**bold**'
    const { masked, restore } = protectMathSpans(value)
    expect(restore(masked)).toBe(value)
  })
})
