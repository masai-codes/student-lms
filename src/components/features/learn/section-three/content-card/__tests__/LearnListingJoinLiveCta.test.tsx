// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LearnListingJoinLiveCta } from '../LearnListingJoinLiveCta'

const hoisted = vi.hoisted(() => ({
  fetchUrl: vi.fn(),
  toastError: vi.fn(),
  open: vi.fn(),
  pushLearnEvent: vi.fn(),
  buildZoomWebViewUrl: vi.fn(),
}))

vi.mock('@/lib/api/learn/zoomRedirectApi', () => ({
  fetchZoomRedirectUrlViaApi: hoisted.fetchUrl,
}))
vi.mock('@/lib/toast', () => ({
  toast: { error: hoisted.toastError, success: vi.fn() },
}))
vi.mock('@/lib/learn/zoomWebView', () => ({
  buildZoomWebViewUrl: hoisted.buildZoomWebViewUrl,
}))
vi.mock('../../../shared/learnAnalytics', () => ({
  pushLearnEvent: hoisted.pushLearnEvent,
  learnEntityEvent: (type: string, action: string, id: number) =>
    `${type}_${action}_${id}`,
}))

const ZOOM = 'https://zoom.us/j/123'
const CTA = 'learn-listing-join-live-cta'

function setup(props: Partial<Parameters<typeof LearnListingJoinLiveCta>[0]> = {}) {
  return render(
    <LearnListingJoinLiveCta
      joinLive="active"
      joinZoomLink={ZOOM}
      isNewZoomRedirection={false}
      enableZoomWebView={false}
      lectureId={572}
      title="Live DSA"
      {...props}
    />,
  )
}

describe('LearnListingJoinLiveCta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('open', hoisted.open)
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders nothing when the join state is hidden', () => {
    const { container } = setup({ joinLive: 'hidden' })
    expect(container.firstChild).toBeNull()
  })

  it('opens the raw zoom link and tracks a zoom_link join', () => {
    setup()
    fireEvent.click(screen.getByTestId(CTA))
    expect(hoisted.pushLearnEvent).toHaveBeenCalledWith(
      'lecture_join_live_click_572',
      expect.objectContaining({ join_method: 'zoom_link', source: 'learn_listing' }),
    )
    expect(hoisted.open).toHaveBeenCalledWith(ZOOM, '_blank', 'noopener,noreferrer')
  })

  it('opens the old LMS embed when enableZoomWebView is on', () => {
    hoisted.buildZoomWebViewUrl.mockReturnValue(
      'https://students.masaischool.com/lectures/572/zoom',
    )
    setup({ enableZoomWebView: true })
    fireEvent.click(screen.getByTestId(CTA))
    expect(hoisted.pushLearnEvent).toHaveBeenCalledWith(
      'lecture_join_live_click_572',
      expect.objectContaining({ join_method: 'zoom_web_view' }),
    )
    expect(hoisted.open).toHaveBeenCalledWith(
      'https://students.masaischool.com/lectures/572/zoom',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('falls back to the raw link when the web-view base is unresolved', () => {
    hoisted.buildZoomWebViewUrl.mockReturnValue(null)
    setup({ enableZoomWebView: true })
    fireEvent.click(screen.getByTestId(CTA))
    expect(hoisted.open).toHaveBeenCalledWith(ZOOM, '_blank', 'noopener,noreferrer')
  })

  it('mints and opens the ZEF url, falling back to the raw link on failure', async () => {
    hoisted.fetchUrl.mockResolvedValueOnce('https://zoom.masaischool.com/?token=x')
    setup({ isNewZoomRedirection: true })
    fireEvent.click(screen.getByTestId(CTA))
    await waitFor(() =>
      expect(hoisted.open).toHaveBeenCalledWith(
        'https://zoom.masaischool.com/?token=x',
        '_blank',
        'noopener,noreferrer',
      ),
    )

    hoisted.fetchUrl.mockRejectedValueOnce(new Error('fail'))
    fireEvent.click(screen.getByTestId(CTA))
    await waitFor(() =>
      expect(hoisted.open).toHaveBeenCalledWith(ZOOM, '_blank', 'noopener,noreferrer'),
    )
    expect(hoisted.toastError).toHaveBeenCalled()
  })

  it('tracks the click but does not open when disabled', () => {
    setup({ joinLive: 'disabled' })
    fireEvent.click(screen.getByTestId(CTA))
    expect(hoisted.pushLearnEvent).toHaveBeenCalled()
    expect(hoisted.open).not.toHaveBeenCalled()
  })

  it('does not track when lectureId is absent', () => {
    setup({ lectureId: undefined })
    fireEvent.click(screen.getByTestId(CTA))
    expect(hoisted.pushLearnEvent).not.toHaveBeenCalled()
    expect(hoisted.open).toHaveBeenCalledWith(ZOOM, '_blank', 'noopener,noreferrer')
  })
})
