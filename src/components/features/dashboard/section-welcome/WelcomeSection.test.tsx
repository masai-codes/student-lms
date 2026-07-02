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
  globalThis.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver
})

afterEach(cleanup)

describe('WelcomeSection', () => {
  it('renders the greeting and student name', () => {
    render(<WelcomeSection studentName="Suryakumar" banners={[]} />)
    expect(screen.getByText('Welcome')).toBeTruthy()
    expect(screen.getByText(/Suryakumar/)).toBeTruthy()
  })

  it('renders the banner carousel when banners are provided', () => {
    render(
      <WelcomeSection
        studentName="Suryakumar"
        banners={[
          { id: 1, title: 'Refer a friend', description: null, imageUrl: null, ctaUrl: null, analyticsKey: 'referral' },
        ]}
      />,
    )
    expect(screen.getByText('Refer a friend')).toBeTruthy()
  })
})
