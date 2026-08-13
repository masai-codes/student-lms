// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ProfileCardListSkeleton,
  ProfileEmptyState,
  ProfileErrorState,
  ProfileTabPanel,
} from '@/components/features/profile/shared/ProfileStates'

afterEach(cleanup)

describe('ProfileEmptyState', () => {
  it('renders the icon, copy and testid', () => {
    render(
      <ProfileEmptyState
        testId="profile-thing-empty"
        icon={<svg data-testid="empty-icon" />}
        title="Nothing here"
        description="Things will show up here later."
      />,
    )

    const empty = screen.getByTestId('profile-thing-empty')
    expect(empty.textContent).toContain('Nothing here')
    expect(empty.textContent).toContain('Things will show up here later.')
    expect(screen.getByTestId('empty-icon')).toBeTruthy()
  })

  it('renders an optional action', () => {
    render(
      <ProfileEmptyState
        testId="profile-thing-empty"
        icon={null}
        title="Nothing here"
        description="…"
        action={<button data-testid="empty-cta">Do it</button>}
      />,
    )
    expect(screen.getByTestId('empty-cta')).toBeTruthy()
  })

  it('omits the action slot when none is given', () => {
    render(
      <ProfileEmptyState
        testId="profile-thing-empty"
        icon={null}
        title="Nothing here"
        description="…"
      />,
    )
    expect(screen.queryByTestId('empty-cta')).toBeNull()
  })
})

describe('ProfileCardListSkeleton', () => {
  // Each row mirrors the real card: icon + two text lines + action = 4 blocks.
  const SHIMMERS_PER_ROW = 4

  it('defaults to three shimmer rows and keeps a screen-reader label', () => {
    render(<ProfileCardListSkeleton testId="profile-thing-skeleton" />)

    const skeleton = screen.getByTestId('profile-thing-skeleton')
    expect(skeleton.querySelectorAll('.dash-skeleton').length).toBe(
      3 * SHIMMERS_PER_ROW,
    )
    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  it('honours a custom row count', () => {
    render(<ProfileCardListSkeleton rows={6} testId="profile-thing-skeleton" />)
    expect(
      screen
        .getByTestId('profile-thing-skeleton')
        .querySelectorAll('.dash-skeleton').length,
    ).toBe(6 * SHIMMERS_PER_ROW)
  })
})

describe('ProfileTabPanel', () => {
  it('wraps children in an animated themed surface', () => {
    render(
      <ProfileTabPanel testId="profile-thing-panel">
        <p>Body</p>
      </ProfileTabPanel>,
    )

    const panel = screen.getByTestId('profile-thing-panel')
    expect(panel.tagName).toBe('SECTION')
    expect(panel.className).toContain('animate-dash-rise')
    expect(panel.className).toContain('bg-surface')
    expect(panel.textContent).toBe('Body')
  })

  it('merges an extra className', () => {
    render(
      <ProfileTabPanel testId="profile-thing-panel" className="pb-10">
        <p>Body</p>
      </ProfileTabPanel>,
    )
    expect(
      screen.getByTestId('profile-thing-panel').className,
    ).toContain('pb-10')
  })
})

describe('ProfileErrorState', () => {
  it('announces the failure to assistive tech', () => {
    render(
      <ProfileErrorState testId="profile-thing-error" message="It broke." />,
    )

    const error = screen.getByTestId('profile-thing-error')
    expect(error.getAttribute('role')).toBe('alert')
    expect(error.textContent).toBe('It broke.')
  })
})
