// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfileHeaderCard } from './ProfileHeaderCard'
import type { ProfileOverview } from '@/server/api/profile/profile.types'

const hoisted = vi.hoisted(() => ({ pushGtmEvent: vi.fn() }))

vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
    to,
    onClick,
    ...rest
  }: {
    children: React.ReactNode
    params?: { batchId: string }
    to: string
    onClick?: (event: React.MouseEvent) => void
    [key: string]: unknown
  }) => (
    <a
      href={to.replace('$batchId', params?.batchId ?? '')}
      // Router links don't hit the document; swallow the jsdom navigation.
      onClick={(event) => {
        event.preventDefault()
        onClick?.(event)
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}))
vi.mock('./ProfileAvatar', () => ({
  ProfileAvatar: ({ name }: { name: string }) => (
    <div data-testid="profile-avatar-stub">{name}</div>
  ),
}))

function profile(overrides: Partial<ProfileOverview> = {}): ProfileOverview {
  return {
    name: 'Riya Sharma',
    email: 'riya@example.com',
    avatarUrl: null,
    phone: '9876543210',
    studentCodes: [],
    isNewUserJourney: false,
    hasFullFees: false,
    ...overrides,
  }
}

function renderCard(overrides: Partial<ProfileOverview> = {}) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileHeaderCard profile={profile(overrides)} />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProfileHeaderCard', () => {
  it('shows the name and email', () => {
    renderCard()
    expect(screen.getByTestId('profile-header-name').textContent).toContain(
      'Riya Sharma',
    )
    expect(screen.getByTestId('profile-header-email').textContent).toBe(
      'riya@example.com',
    )
  })

  it('shows the phone number only when there is one', () => {
    renderCard()
    expect(screen.getByTestId('profile-header-phone').textContent).toBe(
      '9876543210',
    )

    cleanup()
    renderCard({ phone: null })
    expect(screen.queryByTestId('profile-header-phone')).toBeNull()
  })

  it('omits the student-code block when there are no codes', () => {
    renderCard()
    expect(screen.queryByTestId('profile-student-codes')).toBeNull()
  })

  it('links each batch-scoped student code to its course page', () => {
    renderCard({
      studentCodes: [
        { code: 'SDE_1', batchId: 900, batchName: 'SDE Batch 42' },
        { code: 'DS_2', batchId: 901, batchName: 'DS Batch 7' },
      ],
    })

    const first = screen.getByTestId<HTMLAnchorElement>(
      'profile-student-code-link-SDE_1',
    )
    expect(first.getAttribute('href')).toBe('/course/900')
    expect(first.getAttribute('title')).toBe('SDE Batch 42')
    expect(
      screen.getByTestId('profile-student-code-link-DS_2').getAttribute('href'),
    ).toBe('/course/901')

    // Comma-separated inside parentheses, as in the old header.
    const codes = screen.getByTestId('profile-student-codes').textContent
    expect(codes).toContain('(SDE_1, DS_2)')
  })

  it('renders an unlinked code when no batch is known', () => {
    renderCard({
      studentCodes: [{ code: 'LEGACY_1', batchId: null, batchName: null }],
    })

    expect(screen.getByTestId('profile-student-codes').textContent).toContain(
      'LEGACY_1',
    )
    expect(
      screen.queryByTestId('profile-student-code-link-LEGACY_1'),
    ).toBeNull()
  })

  it('records a student-code click with its batch id', () => {
    renderCard({
      studentCodes: [
        { code: 'SDE_1', batchId: 900, batchName: 'SDE Batch 42' },
      ],
    })

    fireEvent.click(screen.getByTestId('profile-student-code-link-SDE_1'))
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_student_code_click_id_900',
      expect.objectContaining({ entity_id: 900, code: 'SDE_1' }),
    )
  })
})
