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
    expect(screen.getByRole('link', { name: /83629643104/ }).getAttribute('href')).toBe(
      'https://us06web.zoom.us/j/83629643104',
    )
    expect(screen.getByRole('link', { name: /example\.mp4/ }).getAttribute('href')).toBe(
      'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/example.mp4',
    )
    expect(screen.getByText('All the best for the evaluation').tagName).toBe('STRONG')
  })

  it('opens external links in a new tab', () => {
    render(<MarkdownContent value="https://example.com" variant="detail" />)

    const link = screen.getByRole('link', { name: 'https://example.com' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })
})
