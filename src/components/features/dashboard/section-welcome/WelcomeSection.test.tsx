// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { WelcomeSection } from './WelcomeSection'

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

describe('WelcomeSection', () => {
  it('greets the user by name when provided', () => {
    render(<WelcomeSection name="Suryakumar" banners={[]} />)
    expect(screen.getByText('Welcome')).toBeTruthy()
    expect(screen.getByText(/Suryakumar/)).toBeTruthy()
  })

  it('falls back to a plain "Welcome!" when there is no name', () => {
    render(<WelcomeSection name={null} banners={[]} />)
    expect(screen.getByTestId('dashboard-welcome-name').textContent).toContain(
      'Welcome!',
    )
  })

  it('renders the banner carousel when banners are provided', () => {
    render(
      <WelcomeSection
        name="Suryakumar"
        banners={[
          {
            id: 1,
            title: 'Refer a friend',
            description: null,
            imageUrl: null,
            ctaUrl: null,
            analyticsKey: 'referral',
          },
        ]}
      />,
    )
    expect(screen.getByText('Refer a friend')).toBeTruthy()
  })
})
