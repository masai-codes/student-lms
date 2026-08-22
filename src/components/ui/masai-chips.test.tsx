// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MasaiChips } from './masai-chips'

afterEach(cleanup)

/**
 * jsdom reports every box as 0x0, so truncation is simulated by pinning the
 * label's scroll/client widths the way a real clipped label reports them.
 */
function stubLabelWidths({
  scrollWidth,
  clientWidth,
}: {
  scrollWidth: number
  clientWidth: number
}) {
  const scroll = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollWidth',
  )
  const client = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientWidth',
  )
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get: () => scrollWidth,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => clientWidth,
  })
  return () => {
    if (scroll)
      Object.defineProperty(HTMLElement.prototype, 'scrollWidth', scroll)
    if (client)
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', client)
  }
}

describe('MasaiChips', () => {
  it('keeps the label inside the pill so long text cannot spill out', () => {
    render(<MasaiChips label="Algorithmic Thinking in Business" />)
    const label = screen.getByText('Algorithmic Thinking in Business')
    expect(label.className).toContain('truncate')
    expect(label.className).toContain('min-w-0')
    expect(label.closest('button')?.className).toContain('max-w-full')
  })

  it('does not wrap a fully visible label in a tooltip', () => {
    render(<MasaiChips label="video" />)
    expect(screen.getByRole('button').getAttribute('data-state')).toBeNull()
  })

  it('reveals the full label on hover once it is actually truncated', async () => {
    const restore = stubLabelWidths({ scrollWidth: 400, clientWidth: 100 })
    try {
      render(<MasaiChips label="Algorithmic Thinking in Business" />)
      // Radix stamps `data-state` on its trigger, and the chip only becomes a
      // trigger once the label is measured as clipped.
      const chip = await screen.findByRole('button')
      expect(chip.getAttribute('data-state')).toBe('closed')
    } finally {
      restore()
    }
  })
})
