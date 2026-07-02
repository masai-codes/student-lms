// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WelcomeBannerCarousel } from './WelcomeBannerCarousel'
import type { DashboardBanner } from '@/server/api/dashboard/banners/getWelcomeBanners.service'

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

  it('shows bounded arrows + dots for multiple banners', () => {
    render(
      <WelcomeBannerCarousel
        banners={[banner({ id: 1 }), banner({ id: 2, title: 'Second' })]}
      />,
    )
    // Starts at index 0 → prev disabled, next enabled.
    const prev = screen.getByTestId('dashboard-welcome-banner-prev')
    const next = screen.getByTestId('dashboard-welcome-banner-next')
    expect(prev.hasAttribute('disabled')).toBe(true)
    expect(next.hasAttribute('disabled')).toBe(false)
    expect(screen.getAllByTestId('dashboard-welcome-banner-dot')).toHaveLength(2)

    fireEvent.click(next)
    expect(screen.getByText('Second')).toBeTruthy()
    // On the last banner: next disabled, prev enabled.
    expect(screen.getByTestId('dashboard-welcome-banner-next').hasAttribute('disabled')).toBe(true)
    expect(screen.getByTestId('dashboard-welcome-banner-prev').hasAttribute('disabled')).toBe(false)
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

  it('pushes a GTM event on click', () => {
    const dataLayer: Array<Record<string, unknown>> = []
    ;(window as unknown as { dataLayer: typeof dataLayer }).dataLayer = dataLayer
    render(<WelcomeBannerCarousel banners={[banner({ id: 7, analyticsKey: 'promo_v1' })]} />)

    fireEvent.click(screen.getByTestId('dashboard-welcome-banner-item'))
    expect(dataLayer).toContainEqual({
      event: 'l_dashboard_banner_carousel_promo_v1_id_7',
    })
  })
})
