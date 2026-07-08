// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WelcomeBannerCarousel } from './WelcomeBannerCarousel'
import type { DashboardBanner } from '@/server/api/dashboard/banners/getWelcomeBanners.service'

// embla (drag carousel) relies on ResizeObserver + IntersectionObserver.
beforeAll(() => {
  const NoopObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NoopObserver
  globalThis.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver
})

afterEach(cleanup)
beforeEach(() => window.localStorage.clear())

const banner = (over: Partial<DashboardBanner> = {}): DashboardBanner => ({
  id: 1,
  title: 'Refer a friend',
  description: 'Earn rewards',
  imageUrl: null,
  ctaUrl: '/refer',
  analyticsKey: 'referral',
  ...over,
})

describe('WelcomeBannerCarousel', () => {
  it('renders nothing when there are no banners', () => {
    const { container } = render(<WelcomeBannerCarousel banners={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders title + description and no controls for a single banner', () => {
    render(<WelcomeBannerCarousel banners={[banner()]} />)
    expect(screen.getByText('Refer a friend')).toBeTruthy()
    expect(screen.getByText('Earn rewards')).toBeTruthy()
    expect(screen.queryByTestId('dashboard-welcome-banner-prev')).toBeNull()
    expect(screen.queryByTestId('dashboard-welcome-banner-dot')).toBeNull()
  })

  it('renders arrows + one dot per banner when there are multiple', () => {
    render(
      <WelcomeBannerCarousel banners={[banner({ id: 1 }), banner({ id: 2, title: 'Second' })]} />,
    )
    expect(screen.getByTestId('dashboard-welcome-banner-prev')).toBeTruthy()
    expect(screen.getByTestId('dashboard-welcome-banner-next')).toBeTruthy()
    expect(screen.getAllByTestId('dashboard-welcome-banner-dot')).toHaveLength(2)
  })

  it('links internally (same tab) for a `/` cta and externally (new tab) for a URL', () => {
    const { rerender } = render(<WelcomeBannerCarousel banners={[banner({ ctaUrl: '/refer' })]} />)
    let link = screen.getByTestId('dashboard-welcome-banner-item')
    expect(link.getAttribute('href')).toBe('/refer')
    expect(link.getAttribute('target')).toBeNull()

    rerender(<WelcomeBannerCarousel banners={[banner({ ctaUrl: 'https://x.test/p' })]} />)
    link = screen.getByTestId('dashboard-welcome-banner-item')
    expect(link.getAttribute('href')).toBe('https://x.test/p')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('falls back to the Changemakers Circle route when there is no cta', () => {
    render(<WelcomeBannerCarousel banners={[banner({ ctaUrl: null })]} />)
    expect(screen.getByTestId('dashboard-welcome-banner-item').getAttribute('href')).toBe(
      '/changemakers-circle',
    )
  })

  it('pushes a GTM event on a (non-drag) click', () => {
    const dataLayer: Array<Record<string, unknown>> = []
    ;(window as unknown as { dataLayer: typeof dataLayer }).dataLayer = dataLayer
    render(<WelcomeBannerCarousel banners={[banner({ id: 7, analyticsKey: 'promo_v1' })]} />)

    fireEvent.click(screen.getByTestId('dashboard-welcome-banner-item'))
    // The event carries extra analytics fields (analytics_key, banner_id, title)
    // alongside `event`, so match on the event name rather than the whole object.
    expect(dataLayer).toContainEqual(
      expect.objectContaining({ event: 'l_dashboard_banner_carousel_promo_v1_id_7' }),
    )
  })
})
