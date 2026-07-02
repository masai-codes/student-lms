// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { WelcomeBannerCarousel } from './WelcomeBannerCarousel'

// Embla (used by the underlying Carousel) relies on ResizeObserver and
// IntersectionObserver, which jsdom does not implement. Provide no-ops so the
// carousel can mount in tests.
beforeAll(() => {
  const NoopObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NoopObserver
  globalThis.IntersectionObserver =
    NoopObserver as unknown as typeof IntersectionObserver
})

afterEach(cleanup)

describe('WelcomeBannerCarousel', () => {
  it('renders nothing when there are no banners', () => {
    const { container } = render(<WelcomeBannerCarousel banners={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders banner content when banners are provided', () => {
    render(
      <WelcomeBannerCarousel
        banners={[{ id: '1', title: 'Refer a friend', subtitle: 'Earn rewards' }]}
      />,
    )
    expect(screen.getByText('Refer a friend')).toBeTruthy()
    expect(screen.getByText('Earn rewards')).toBeTruthy()
  })
})
