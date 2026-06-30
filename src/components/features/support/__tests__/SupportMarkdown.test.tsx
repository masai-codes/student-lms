// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SupportMarkdown } from '../SupportMarkdown'

describe('SupportMarkdown', () => {
  afterEach(() => cleanup())

  it('renders legacy comment HTML (<br/> + signature) as real line breaks, not raw tags', () => {
    const { container } = render(
      <SupportMarkdown>
        {'Dear Student,<br/><br/>Thanks for reaching out.<br/><br/>Regards,<br/>Program Co-ordinator<br/>Student Experience Team'}
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
      <SupportMarkdown>{'<script>alert(1)</script><b>bold</b>'}</SupportMarkdown>,
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
})
