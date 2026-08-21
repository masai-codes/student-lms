// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountActivityTab } from './AccountActivityTab'
import type { ProfileSession } from '@/server/api/profile/profile.types'

const hoisted = vi.hoisted(() => ({
  fetchProfileSessions: vi.fn(),
  revokeSessionRequest: vi.fn(),
  revokeOtherSessionsRequest: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchProfileSessions: hoisted.fetchProfileSessions,
  revokeSessionRequest: hoisted.revokeSessionRequest,
  revokeOtherSessionsRequest: hoisted.revokeOtherSessionsRequest,
  fetchEmailPreferences: vi.fn(),
  updateEmailPreferencesRequest: vi.fn(),
  fetchUndertakings: vi.fn(),
  acceptUndertakingRequest: vi.fn(),
  fetchAchievements: vi.fn(),
  fetchProfileCertificates: vi.fn(),
  fetchStudentKit: vi.fn(),
  fetchProfileInvoices: vi.fn(),
  fetchProfileOverview: vi.fn(),
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

function session(overrides: Partial<ProfileSession> = {}): ProfileSession {
  return {
    id: 'sess-a',
    device: 'Chrome 120 on macOS',
    deviceKind: 'laptop',
    lastActiveAt: 1_700_000_000,
    isCurrent: false,
    ...overrides,
  }
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountActivityTab />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AccountActivityTab', () => {
  it('shows a shimmer skeleton while loading', () => {
    hoisted.fetchProfileSessions.mockReturnValue(new Promise(() => {}))
    renderTab()
    expect(screen.getByTestId('profile-activity-skeleton')).toBeTruthy()
  })

  it('shows an empty state when there are no sessions', async () => {
    hoisted.fetchProfileSessions.mockResolvedValue([])
    renderTab()
    await waitFor(() =>
      expect(screen.getByTestId('profile-activity-empty')).toBeTruthy(),
    )
    expect(screen.queryByTestId('profile-activity-revoke-all')).toBeNull()
  })

  it('shows an error state when the request fails', async () => {
    hoisted.fetchProfileSessions.mockRejectedValue(new Error('boom'))
    renderTab()
    await waitFor(() =>
      expect(screen.getByTestId('profile-activity-error')).toBeTruthy(),
    )
  })

  it('marks the current device and offers no revoke button for it', async () => {
    hoisted.fetchProfileSessions.mockResolvedValue([
      session({ id: 'sess-a', isCurrent: true }),
      session({
        id: 'sess-b',
        device: 'Safari 17 on iOS',
        deviceKind: 'phone',
      }),
    ])
    renderTab()

    await waitFor(() =>
      expect(screen.getAllByTestId('profile-session-card')).toHaveLength(2),
    )
    expect(screen.getAllByTestId('profile-session-current-badge')).toHaveLength(
      1,
    )
    // Only the non-current session is revocable.
    expect(screen.getAllByTestId('profile-session-revoke')).toHaveLength(1)
  })

  it('hides "sign out of other devices" when only the current session exists', async () => {
    hoisted.fetchProfileSessions.mockResolvedValue([
      session({ isCurrent: true }),
    ])
    renderTab()
    await waitFor(() =>
      expect(screen.getByTestId('profile-session-card')).toBeTruthy(),
    )
    expect(screen.queryByTestId('profile-activity-revoke-all')).toBeNull()
  })

  it('confirms before revoking one session, then revokes it', async () => {
    hoisted.fetchProfileSessions.mockResolvedValue([session({ id: 'sess-b' })])
    hoisted.revokeSessionRequest.mockResolvedValue({ revoked: true })
    renderTab()

    await waitFor(() =>
      expect(screen.getByTestId('profile-session-revoke')).toBeTruthy(),
    )
    expect(screen.queryByTestId('profile-session-revoke-dialog')).toBeNull()

    fireEvent.click(screen.getByTestId('profile-session-revoke'))
    await waitFor(() =>
      expect(screen.getByTestId('profile-session-revoke-dialog')).toBeTruthy(),
    )
    expect(hoisted.revokeSessionRequest).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('profile-session-revoke-dialog-confirm'))
    await waitFor(() =>
      expect(hoisted.revokeSessionRequest).toHaveBeenCalledWith('sess-b'),
    )
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_session_revoke_confirm_id_sess-b',
      expect.objectContaining({ entity_type: 'session' }),
    )
  })

  it('cancelling the confirm leaves the session alone', async () => {
    hoisted.fetchProfileSessions.mockResolvedValue([session({ id: 'sess-b' })])
    renderTab()

    await waitFor(() =>
      expect(screen.getByTestId('profile-session-revoke')).toBeTruthy(),
    )
    fireEvent.click(screen.getByTestId('profile-session-revoke'))
    await waitFor(() =>
      expect(screen.getByTestId('profile-session-revoke-dialog')).toBeTruthy(),
    )
    fireEvent.click(screen.getByTestId('profile-session-revoke-dialog-cancel'))

    await waitFor(() =>
      expect(screen.queryByTestId('profile-session-revoke-dialog')).toBeNull(),
    )
    expect(hoisted.revokeSessionRequest).not.toHaveBeenCalled()
  })

  it('says the current session survives "sign out of other devices"', async () => {
    hoisted.fetchProfileSessions.mockResolvedValue([
      session({ id: 'sess-a', isCurrent: true }),
      session({ id: 'sess-b' }),
    ])
    hoisted.revokeOtherSessionsRequest.mockResolvedValue({ revokedCount: 1 })
    renderTab()

    await waitFor(() =>
      expect(screen.getByTestId('profile-activity-revoke-all')).toBeTruthy(),
    )
    fireEvent.click(screen.getByTestId('profile-activity-revoke-all'))

    const dialog = await waitFor(() =>
      screen.getByTestId('profile-sessions-revoke-all-dialog'),
    )
    expect(dialog.textContent).toContain('1 other session')
    expect(dialog.textContent).toContain("You'll stay signed in here")

    fireEvent.click(
      screen.getByTestId('profile-sessions-revoke-all-dialog-confirm'),
    )
    await waitFor(() =>
      expect(hoisted.revokeOtherSessionsRequest).toHaveBeenCalled(),
    )
  })

  it('pluralises the other-session count', async () => {
    hoisted.fetchProfileSessions.mockResolvedValue([
      session({ id: 'sess-a', isCurrent: true }),
      session({ id: 'sess-b' }),
      session({ id: 'sess-c' }),
    ])
    renderTab()

    await waitFor(() =>
      expect(screen.getByTestId('profile-activity-revoke-all')).toBeTruthy(),
    )
    fireEvent.click(screen.getByTestId('profile-activity-revoke-all'))

    const dialog = await waitFor(() =>
      screen.getByTestId('profile-sessions-revoke-all-dialog'),
    )
    expect(dialog.textContent).toContain('2 other sessions')
  })
})
