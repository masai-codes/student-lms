// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
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
        enableZoomWebView={false}
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
        enableZoomWebView={false}
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
        enableZoomWebView={false}
      />,
    )
    const button = screen.getByRole('button', { name: /Join live session/ })
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('fetches the ZEF url and opens it for new-zoom-redirection lectures', async () => {
    hoisted.fetchUrl.mockResolvedValueOnce(
      'https://zoom.masaischool.com/?token=x',
    )
    render(
      <JoinLiveSessionCard
        lectureId={572}
        zoomLink={ZOOM}
        buttonState="active"
        isNewZoomRedirection
        enableZoomWebView={false}
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
        enableZoomWebView={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Join live session/ }))

    await waitFor(() =>
      expect(hoisted.open).toHaveBeenCalledWith(
        ZOOM,
        '_blank',
        'noopener,noreferrer',
      ),
    )
    expect(hoisted.toastError).toHaveBeenCalled()
  })

  it('links to the old LMS embed when enableZoomWebView is on (non-adaptive, non-ZEF)', () => {
    render(
      <JoinLiveSessionCard
        lectureId={572}
        zoomLink={ZOOM}
        buttonState="active"
        isNewZoomRedirection={false}
        enableZoomWebView
      />,
    )
    const link = screen.getByRole('link', { name: /Join live session/ })
    // Points at the old LMS embed route (base resolved per origin), not the raw link.
    expect(link.getAttribute('href')).toMatch(/\/lectures\/572\/zoom$/)
    expect(link.getAttribute('href')).not.toBe(ZOOM)
  })

  it('ignores enableZoomWebView for adaptive (SAL) links and uses the raw link', () => {
    const adaptive = 'https://api.example.com/api/adaptive-lecture/572/join'
    render(
      <JoinLiveSessionCard
        lectureId={572}
        zoomLink={adaptive}
        buttonState="active"
        isNewZoomRedirection={false}
        enableZoomWebView
      />,
    )
    const link = screen.getByRole('link', { name: /Join live session/ })
    expect(link.getAttribute('href')).toBe(adaptive)
  })

  it('ZEF wins over enableZoomWebView', () => {
    render(
      <JoinLiveSessionCard
        lectureId={572}
        zoomLink={ZOOM}
        buttonState="active"
        isNewZoomRedirection
        enableZoomWebView
      />,
    )
    // ZEF renders a button (async fetch), not a direct anchor.
    expect(
      screen.getByRole('button', { name: /Join live session/ }),
    ).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
