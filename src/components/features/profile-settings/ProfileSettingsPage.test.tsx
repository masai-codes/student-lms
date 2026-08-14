// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { Bookmark, Gift, GraduationCap, LogOutIcon } from 'lucide-react'

import { ProfileSettingsPage } from './ProfileSettingsPage'

const navigate = vi.fn()
const signOut = vi.fn()
const refer = vi.fn()

const tier1 = [
  { id: 'home', type: 'internal-link', to: '/', uiType: 'primary' },
]

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchProfileOverview: vi.fn(() =>
    Promise.resolve({
      name: 'Asha Rao',
      email: 'asha@example.com',
      phone: '9876543210',
      avatarUrl: null,
      studentCodes: [],
      isNewUserJourney: false,
      hasFullFees: false,
    }),
  ),
}))

vi.mock('@/utils/portal', () => ({ hidesMasaiOnlyFeatures: () => false }))

vi.mock('@/utils/authRedirect', () => ({
  getOldStudentUiUrlForPath: (path: string) =>
    `https://students.example.com${path}`,
}))

vi.mock('@/lib/navigation/useAppNavItems', () => ({
  useAppNavItems: () => ({
    user: { name: 'Asha Rao', profileImageUrl: null },
    tier1,
    rightItems: [
      {
        id: 'bookmarks',
        type: 'internal-link',
        to: '/bookmarks',
        label: 'Bookmarks',
        icon: Bookmark,
        uiType: 'secondary',
      },
      {
        id: 'refer',
        type: 'action',
        onClick: refer,
        label: 'Refer & Earn',
        icon: Gift,
        uiType: 'primary',
      },
    ],
    tertiaryItems: [
      {
        id: 'courses',
        type: 'internal-link',
        to: '/my-courses',
        label: 'My Programs',
        icon: GraduationCap,
        uiType: 'tertiary',
      },
      {
        id: 'sign-out',
        type: 'action',
        onClick: signOut,
        label: 'Sign out',
        icon: LogOutIcon,
        uiType: 'tertiary',
      },
    ],
  }),
}))

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<ProfileSettingsPage />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProfileSettingsPage', () => {
  it('lists the old-LMS rows, sourcing shared ones from the nav items', () => {
    renderPage()

    expect(screen.getByTestId('profile-settings-page')).toBeTruthy()
    // From `useAppNavItems`…
    expect(screen.getByTestId('profile-settings-item-courses')).toBeTruthy()
    expect(screen.getByTestId('profile-settings-item-bookmarks')).toBeTruthy()
    expect(screen.getByTestId('profile-settings-item-refer')).toBeTruthy()
    expect(screen.getByTestId('profile-settings-item-sign-out')).toBeTruthy()
    // …and the rows this page owns.
    expect(
      screen.getByTestId('profile-settings-item-privacy-policy'),
    ).toBeTruthy()
    expect(
      screen.getByTestId('profile-settings-item-practice-interview'),
    ).toBeTruthy()
    expect(
      screen.getByTestId('profile-settings-item-product-updates'),
    ).toBeTruthy()
    // MasaiVerse is gated on Tier 1 access, which this student doesn't have.
    expect(
      screen.queryByTestId('profile-settings-item-masaiverse-community'),
    ).toBeNull()
    // The old page labels the sign-out row "Log Out".
    expect(screen.getByText('Log Out')).toBeTruthy()
  })

  it('opens the full profile from the user card and runs nav item handlers', () => {
    renderPage()

    act(() => {
      fireEvent.click(screen.getByTestId('profile-settings-profile-card'))
    })
    expect(navigate).toHaveBeenCalledWith({
      to: '/profile',
      search: { tab: 'details' },
    })

    act(() => {
      fireEvent.click(screen.getByTestId('profile-settings-item-courses'))
    })
    expect(navigate).toHaveBeenCalledWith({ to: '/my-courses', search: {} })

    act(() => {
      fireEvent.click(screen.getByTestId('profile-settings-item-sign-out'))
    })
    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
