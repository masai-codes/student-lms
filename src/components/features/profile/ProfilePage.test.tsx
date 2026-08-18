// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'
import type { ProfileOverview } from '@/server/api/profile/profile.types'

const hoisted = vi.hoisted(() => ({
  fetchProfileOverview: vi.fn(),
  useSearch: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchProfileOverview: hoisted.fetchProfileOverview,
}))
vi.mock('@tanstack/react-router', () => ({
  getRouteApi: () => ({ useSearch: hoisted.useSearch }),
  useNavigate: () => hoisted.navigate,
}))
vi.mock('./ProfileHeaderCard', () => ({
  ProfileHeaderCard: () => <div data-testid="stub-header" />,
}))
vi.mock('./achievements/AchievementsPanel', () => ({
  AchievementsPanel: () => <div data-testid="stub-achievements" />,
}))
vi.mock('./ProfileTabContent', () => ({
  ProfileTabContent: ({ activeTab }: { activeTab: string }) => (
    <div data-testid="stub-tab-content" data-active-tab={activeTab} />
  ),
}))

function profile(overrides: Partial<ProfileOverview> = {}): ProfileOverview {
  return {
    name: 'Riya',
    email: 'riya@example.com',
    avatarUrl: null,
    phone: null,
    studentCodes: [],
    isNewUserJourney: false,
    hasFullFees: false,
    ...overrides,
  }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfilePage />
    </QueryClientProvider>,
  )
}

const activeTab = () =>
  screen.getByTestId('stub-tab-content').getAttribute('data-active-tab')

beforeEach(() => {
  hoisted.useSearch.mockReturnValue({ tab: undefined })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProfilePage', () => {
  it('shows a header skeleton while the profile loads', () => {
    hoisted.fetchProfileOverview.mockReturnValue(new Promise(() => {}))
    renderPage()

    expect(screen.getByTestId('profile-header-skeleton')).toBeTruthy()
    expect(screen.queryByTestId('stub-header')).toBeNull()
    // Tabs wait for the gating flags; achievements load independently.
    expect(screen.queryByTestId('profile-tablist')).toBeNull()
    expect(screen.getByTestId('stub-achievements')).toBeTruthy()
  })

  it('shows an error state when the profile cannot be loaded', async () => {
    hoisted.fetchProfileOverview.mockRejectedValue(new Error('boom'))
    renderPage()

    await waitFor(() =>
      expect(screen.getByTestId('profile-overview-error')).toBeTruthy(),
    )
    expect(screen.queryByTestId('profile-tablist')).toBeNull()
  })

  it('renders the header, achievements and tabs once loaded', async () => {
    hoisted.fetchProfileOverview.mockResolvedValue(profile())
    renderPage()

    await waitFor(() => expect(screen.getByTestId('stub-header')).toBeTruthy())
    expect(screen.getByTestId('stub-achievements')).toBeTruthy()
    expect(screen.getByTestId('profile-tablist')).toBeTruthy()
    expect(screen.getByTestId('profile-page-title').textContent).toBe(
      'My Profile',
    )
  })

  it('defaults to the details tab', async () => {
    hoisted.fetchProfileOverview.mockResolvedValue(profile())
    renderPage()
    await waitFor(() => expect(activeTab()).toBe('details'))
  })

  it('honours a deep-linked tab', async () => {
    hoisted.useSearch.mockReturnValue({ tab: 'activity' })
    hoisted.fetchProfileOverview.mockResolvedValue(profile())
    renderPage()
    await waitFor(() => expect(activeTab()).toBe('activity'))
  })

  it('falls back when the deep-linked tab is not available to this student', async () => {
    // Invoices requires the new user journey.
    hoisted.useSearch.mockReturnValue({ tab: 'invoices' })
    hoisted.fetchProfileOverview.mockResolvedValue(profile())
    renderPage()
    await waitFor(() => expect(activeTab()).toBe('details'))
  })

  it('shows the gated tabs for an eligible student', async () => {
    hoisted.useSearch.mockReturnValue({ tab: 'invoices' })
    hoisted.fetchProfileOverview.mockResolvedValue(
      profile({ isNewUserJourney: true, hasFullFees: true }),
    )
    renderPage()

    await waitFor(() =>
      expect(screen.getByTestId('profile-tab-student-kit')).toBeTruthy(),
    )
    expect(activeTab()).toBe('invoices')
  })

  it('writes the selected tab into the URL', async () => {
    hoisted.fetchProfileOverview.mockResolvedValue(profile())
    renderPage()

    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-tab-activity')),
    )
    expect(hoisted.navigate).toHaveBeenCalledWith({
      to: '/profile',
      search: { tab: 'activity' },
    })
  })
})
