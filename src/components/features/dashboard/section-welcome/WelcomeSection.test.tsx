// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { WelcomeSection } from './WelcomeSection'

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
