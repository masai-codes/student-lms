// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { JoinLiveSessionCard } from '../JoinLiveSessionCard'

const hoisted = vi.hoisted(() => ({
  fetchUrl: vi.fn(),
  toastError: vi.fn(),
  open: vi.fn(),
}))

vi.mock('@/lib/api/learn/zoomRedirectApi', () => ({
  fetchZoomRedirectUrlViaApi: hoisted.fetchUrl,
}))
vi.mock('@/lib/toast', () => ({
  toast: { error: hoisted.toastError, success: vi.fn() },
}))

const ZOOM = 'https://zoom.us/j/123'

describe('JoinLiveSessionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('open', hoisted.open)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders nothing when the button is hidden', () => {
    const { container } = render(
      <JoinLiveSessionCard
        lectureId={572}
        zoomLink={ZOOM}
        buttonState="hidden"
        isNewZoomRedirection={false}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders a direct anchor for non-ZEF lectures when active', () => {
    render(
      <JoinLiveSessionCard
        lectureId={572}
        zoomLink={ZOOM}
        buttonState="active"
        isNewZoomRedirection={false}
      />,
    )
    const link = screen.getByRole('link', { name: /Join live session/ })
    expect(link.getAttribute('href')).toBe(ZOOM)
  })

  it('disables the button when not yet active', () => {
    render(
      <JoinLiveSessionCard
        lectureId={572}
        zoomLink={ZOOM}
        buttonState="disabled"
        isNewZoomRedirection={false}
      />,
    )
    const button = screen.getByRole('button', { name: /Join live session/ })
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('fetches the ZEF url and opens it for new-zoom-redirection lectures', async () => {
    hoisted.fetchUrl.mockResolvedValueOnce('https://zoom.masaischool.com/?token=x')
    render(
      <JoinLiveSessionCard
        lectureId={572}
        zoomLink={ZOOM}
        buttonState="active"
        isNewZoomRedirection
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Join live session/ }))

    expect(hoisted.fetchUrl).toHaveBeenCalledWith(572)
    await waitFor(() =>
      expect(hoisted.open).toHaveBeenCalledWith(
        'https://zoom.masaischool.com/?token=x',
        '_blank',
        'noopener,noreferrer',
      ),
    )
  })

  it('falls back to the raw link when the ZEF fetch fails', async () => {
    hoisted.fetchUrl.mockRejectedValueOnce(new Error('ZOOM_REDIRECT_FAILED'))
    render(
      <JoinLiveSessionCard
        lectureId={572}
        zoomLink={ZOOM}
        buttonState="active"
        isNewZoomRedirection
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Join live session/ }))

    await waitFor(() =>
      expect(hoisted.open).toHaveBeenCalledWith(ZOOM, '_blank', 'noopener,noreferrer'),
    )
    expect(hoisted.toastError).toHaveBeenCalled()
  })
})
