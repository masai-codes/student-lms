// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import InlineDrawer from './InlineDrawer'

afterEach(cleanup)

describe('InlineDrawer', () => {
  it('always renders the main content and the panel', () => {
    render(
      <InlineDrawer open={false} panel={<p>Panel body</p>}>
        <p>Main content</p>
      </InlineDrawer>,
    )
    expect(screen.getByText('Main content')).toBeTruthy()
    expect(screen.getByText('Panel body')).toBeTruthy()
  })

  it('pins the panel to the viewport and slides it off-screen when closed', () => {
    render(
      <InlineDrawer open={false} panel={<p>Panel body</p>}>
        <p>Main content</p>
      </InlineDrawer>,
    )
    const panel = screen.getByText('Panel body').closest('aside')
    expect(panel?.className).toContain('fixed')
    // Closed → translated fully off the right edge and non-interactive.
    expect(panel?.className).toContain('translate-x-full')
    expect(panel?.className).toContain('pointer-events-none')
    expect(panel?.getAttribute('aria-hidden')).toBe('true')
  })

  it('reveals the panel when open', () => {
    render(
      <InlineDrawer open panel={<p>Panel body</p>}>
        <p>Main content</p>
      </InlineDrawer>,
    )
    const panel = screen.getByText('Panel body').closest('aside')
    expect(panel?.className).toContain('translate-x-0')
    expect(panel?.className).not.toContain('translate-x-full')
    expect(panel?.getAttribute('aria-hidden')).toBe('false')
  })

  it('renders the title and fires onClose from the close button', () => {
    const onClose = vi.fn()
    render(
      <InlineDrawer open panel={<p>Panel body</p>} title="Schedule" onClose={onClose}>
        <p>Main content</p>
      </InlineDrawer>,
    )
    expect(screen.getByText('Schedule')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Close panel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('omits the header when no onClose is provided', () => {
    render(
      <InlineDrawer open panel={<p>Panel body</p>} title="Schedule">
        <p>Main content</p>
      </InlineDrawer>,
    )
    // The title only renders inside the close-button header.
    expect(screen.queryByLabelText('Close panel')).toBeNull()
    expect(screen.queryByText('Schedule')).toBeNull()
  })
})
