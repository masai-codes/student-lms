// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SupportMarkdown } from '../SupportMarkdown'

describe('SupportMarkdown', () => {
  afterEach(() => cleanup())

  it('renders legacy comment HTML (<br/> + signature) as real line breaks, not raw tags', () => {
    const { container } = render(
      <SupportMarkdown>
        {
          'Dear Student,<br/><br/>Thanks for reaching out.<br/><br/>Regards,<br/>Program Co-ordinator<br/>Student Experience Team'
        }
      </SupportMarkdown>,
    )

    // The <br/> became actual <br> elements (not escaped text).
    expect(container.querySelectorAll('br').length).toBeGreaterThan(0)
    expect(container.innerHTML).not.toContain('&lt;br')
    expect(container.textContent).toContain('Program Co-ordinator')
    expect(container.textContent).toContain('Student Experience Team')
  })

  it('strips unsafe HTML while keeping safe formatting', () => {
    const { container } = render(
      <SupportMarkdown>
        {'<script>alert(1)</script><b>bold</b>'}
      </SupportMarkdown>,
    )

    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')?.textContent).toBe('bold')
  })

  it('renders markdown links in a new tab', () => {
    const { container } = render(
      <SupportMarkdown>{'[file](https://example.com/a.pdf)'}</SupportMarkdown>,
    )
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('https://example.com/a.pdf')
    expect(link?.getAttribute('target')).toBe('_blank')
  })

  it('keeps single Enter presses as visible line breaks', () => {
    const { container } = render(
      <SupportMarkdown>{'Line one\nLine two'}</SupportMarkdown>,
    )
    expect(container.querySelectorAll('br').length).toBeGreaterThan(0)
    expect(container.textContent).toContain('Line one')
    expect(container.textContent).toContain('Line two')
  })

  it('does not stack an extra break when a <br/> is followed by a source newline', () => {
    const { container } = render(
      <SupportMarkdown>
        {
          'Dear Student,<br/><br/>\nThanks for reaching out.<br/><br/>\nRegards,<br/>Program Co-ordinator'
        }
      </SupportMarkdown>,
    )
    // Two paragraph gaps × 2 breaks each + one signature break = 5, not 7+.
    expect(container.querySelectorAll('br').length).toBe(5)
  })

  it('renders unordered and ordered lists as real list markup', () => {
    const { container } = render(
      <SupportMarkdown>
        {'- apple\n- banana\n\n1. first\n2. second'}
      </SupportMarkdown>,
    )
    expect(container.querySelectorAll('ul li').length).toBe(2)
    expect(container.querySelectorAll('ol li').length).toBe(2)
    expect(container.textContent).toContain('apple')
    expect(container.textContent).toContain('first')
  })
})
