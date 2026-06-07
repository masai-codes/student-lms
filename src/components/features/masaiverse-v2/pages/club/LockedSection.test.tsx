// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LockedSection from './LockedSection'

// The Join CTA is exercised by its own test; here we only assert it's wired up
// with the right props from the unlock overlay.
vi.mock('./JoinClubButton', () => ({
  default: ({
    clubId,
    isJoined,
    variant,
    confirmationModalText,
  }: {
    clubId: string
    isJoined: boolean
    variant?: string
    confirmationModalText?: string | null
  }) => (
    <button
      data-testid="join-cta"
      data-club={clubId}
      data-joined={String(isJoined)}
      data-variant={variant}
      data-confirm={confirmationModalText ?? ''}
    >
      Join
    </button>
  ),
}))

afterEach(cleanup)

describe('LockedSection', () => {
  it('shows the title, teaser and a primary Join CTA (list variant by default)', () => {
    const { container } = render(
      <LockedSection
        clubId="5"
        title="Club Leaderboard"
        teaser="See how members rank."
        confirmationModalText="agree to rules"
      />,
    )

    expect(screen.getByText('Club Leaderboard')).toBeTruthy()
    expect(screen.getByText('Join the club to unlock')).toBeTruthy()
    expect(screen.getByText('See how members rank.')).toBeTruthy()

    // The Join CTA is the real button, wired for this club as a not-yet-member.
    const cta = screen.getByTestId('join-cta')
    expect(cta.getAttribute('data-club')).toBe('5')
    expect(cta.getAttribute('data-joined')).toBe('false')
    expect(cta.getAttribute('data-variant')).toBe('primary')
    expect(cta.getAttribute('data-confirm')).toBe('agree to rules')

    // The blurred placeholder is decorative and hidden from assistive tech.
    expect(container.querySelector('[aria-hidden]')).toBeTruthy()
  })

  it('renders the cards-variant placeholder', () => {
    render(
      <LockedSection
        clubId="9"
        title="Live & Upcoming Events"
        teaser="Discover upcoming events."
        variant="cards"
      />,
    )

    expect(screen.getByText('Live & Upcoming Events')).toBeTruthy()
    expect(screen.getByText('Discover upcoming events.')).toBeTruthy()
    expect(screen.getByTestId('join-cta').getAttribute('data-confirm')).toBe('')
  })
})
