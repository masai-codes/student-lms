// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MarkdownContent } from '../MarkdownContent'

const evaluationInstructions = `- If you face any query during the evaluation, kindly join the helpdesk link:
https://us06web.zoom.us/j/83629643104

- Kindly follow the Tutorial video: https://coding-platform.s3.amazonaws.com/dev/lms/tickets/example.mp4

**All the best for the evaluation**`

describe('MarkdownContent', () => {
  it('returns null for blank content', () => {
    const { container } = render(<MarkdownContent value="   " />)
    expect(container.firstChild).toBeNull()
  })

  it('renders list items, links, and bold text from markdown', () => {
    render(<MarkdownContent value={evaluationInstructions} variant="detail" />)

    expect(screen.getByText(/If you face any query/)).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /83629643104/ }).getAttribute('href'),
    ).toBe('https://us06web.zoom.us/j/83629643104')
    expect(
      screen.getByRole('link', { name: /example\.mp4/ }).getAttribute('href'),
    ).toBe(
      'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/example.mp4',
    )
    expect(screen.getByText('All the best for the evaluation').tagName).toBe(
      'STRONG',
    )
  })

  it('opens external links in a new tab', () => {
    render(<MarkdownContent value="https://example.com" variant="detail" />)

    const link = screen.getByRole('link', { name: 'https://example.com' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('applies a variant modifier class so detail/card styling can diverge', () => {
    const { container: detail } = render(
      <MarkdownContent value="Body" variant="detail" />,
    )
    expect(
      detail
        .querySelector('.markdown-content')
        ?.classList.contains('markdown-content--detail'),
    ).toBe(true)

    const { container: card } = render(
      <MarkdownContent value="Body" variant="card" />,
    )
    expect(
      card
        .querySelector('.markdown-content')
        ?.classList.contains('markdown-content--card'),
    ).toBe(true)
  })

  it('renders bullet lists with disc styling', () => {
    const { container } = render(
      <MarkdownContent
        value={'- First item\n- Second item'}
        variant="detail"
      />,
    )

    const list = container.querySelector('.markdown-content ul')
    expect(list).toBeTruthy()
    expect(list?.querySelectorAll('li').length).toBe(2)
  })

  it('renders inline \\(...\\) and block $$...$$ math via KaTeX', () => {
    const { container } = render(
      <MarkdownContent
        value={`Inline \\(a^2 + b^2 = c^2\\)

$$
\\lim_{x \\to \\infty} \\frac{1}{x} = 0
$$`}
        variant="detail"
      />,
    )

    // KaTeX renders into .katex (inline) and .katex-display (block) wrappers.
    expect(container.querySelector('.katex')).toBeTruthy()
    expect(container.querySelector('.katex-display')).toBeTruthy()
    // \to must survive decoding (it would otherwise be mangled into a tab).
    expect(container.querySelector('.katex-error')).toBeNull()
  })

  it('renders block math that follows a bulleted list of inline math', () => {
    // Regression: list-continuation normalisation used to slurp the trailing
    // $$...$$ blocks into the preceding list item and break them.
    const { container } = render(
      <MarkdownContent
        value={`Inline math:

- Pythagorean theorem: \\(a^2 + b^2 = c^2\\)
- Integral: \\(\\int_0^1 x^2\\,dx = \\frac{1}{3}\\)

Block math:

$$
E = mc^2
$$

$$
\\lim_{x \\to \\infty} \\frac{1}{x} = 0
$$`}
        variant="detail"
      />,
    )

    expect(container.querySelectorAll('.katex-display').length).toBe(2)
    expect(container.querySelector('.katex-error')).toBeNull()
    // No literal $$ delimiter should leak into the rendered output.
    expect(container.textContent).not.toContain('$$')
  })

  it('keeps URL lines inside list items when authors use blank lines', () => {
    const { container } = render(
      <MarkdownContent
        value={`- Join the helpdesk:
https://example.com/join

- Second point`}
        variant="detail"
      />,
    )

    expect(container.querySelectorAll('.markdown-content ul').length).toBe(1)
    expect(container.querySelectorAll('.markdown-content li').length).toBe(2)
    expect(
      container.querySelector('.markdown-content a')?.getAttribute('href'),
    ).toBe('https://example.com/join')
  })
})
