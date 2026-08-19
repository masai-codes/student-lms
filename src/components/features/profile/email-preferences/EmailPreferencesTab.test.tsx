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
import { EmailPreferencesTab } from './EmailPreferencesTab'
import type { EmailPreferences } from '@/server/api/profile/profile.types'

const hoisted = vi.hoisted(() => ({
  fetchEmailPreferences: vi.fn(),
  updateEmailPreferencesRequest: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchEmailPreferences: hoisted.fetchEmailPreferences,
  updateEmailPreferencesRequest: hoisted.updateEmailPreferencesRequest,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

const ALL_ON: EmailPreferences = {
  lectures: true,
  assignments: true,
  evaluations: true,
  announcements: true,
  tickets: true,
  discussions: true,
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <EmailPreferencesTab />
    </QueryClientProvider>,
  )
}

const toggle = (key: string) =>
  screen.getByTestId(`profile-email-preference-toggle-${key}`)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('EmailPreferencesTab', () => {
  it('shows a skeleton while loading', () => {
    hoisted.fetchEmailPreferences.mockReturnValue(new Promise(() => {}))
    renderTab()
    expect(
      screen.getByTestId('profile-email-preferences-skeleton'),
    ).toBeTruthy()
  })

  it('shows an error state when the request fails', async () => {
    hoisted.fetchEmailPreferences.mockRejectedValue(new Error('boom'))
    renderTab()
    await waitFor(() =>
      expect(
        screen.getByTestId('profile-email-preferences-error'),
      ).toBeTruthy(),
    )
  })

  it('renders all six channels with their stored state', async () => {
    hoisted.fetchEmailPreferences.mockResolvedValue({
      ...ALL_ON,
      lectures: false,
    })
    renderTab()

    await waitFor(() => expect(toggle('lectures')).toBeTruthy())
    expect(
      screen.getAllByTestId(/^profile-email-preference-[a-z]+$/),
    ).toHaveLength(6)
    expect(toggle('lectures').getAttribute('aria-checked')).toBe('false')
    expect(toggle('tickets').getAttribute('aria-checked')).toBe('true')
  })

  it('confirms before disabling, then writes only that key', async () => {
    hoisted.fetchEmailPreferences.mockResolvedValue(ALL_ON)
    hoisted.updateEmailPreferencesRequest.mockResolvedValue({
      ...ALL_ON,
      lectures: false,
    })
    renderTab()

    await waitFor(() => expect(toggle('lectures')).toBeTruthy())
    fireEvent.click(toggle('lectures'))

    const dialog = await waitFor(() =>
      screen.getByTestId('profile-email-preference-dialog'),
    )
    expect(dialog.textContent).toContain('Disable email notifications for')
    expect(hoisted.updateEmailPreferencesRequest).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByTestId('profile-email-preference-dialog-confirm'),
    )
    await waitFor(() =>
      expect(hoisted.updateEmailPreferencesRequest).toHaveBeenCalledWith({
        lectures: false,
      }),
    )
  })

  it('also confirms before enabling (parity with the old LMS)', async () => {
    hoisted.fetchEmailPreferences.mockResolvedValue({
      ...ALL_ON,
      lectures: false,
    })
    hoisted.updateEmailPreferencesRequest.mockResolvedValue(ALL_ON)
    renderTab()

    await waitFor(() => expect(toggle('lectures')).toBeTruthy())
    fireEvent.click(toggle('lectures'))

    const dialog = await waitFor(() =>
      screen.getByTestId('profile-email-preference-dialog'),
    )
    expect(dialog.textContent).toContain('Enable email notifications for')

    fireEvent.click(
      screen.getByTestId('profile-email-preference-dialog-confirm'),
    )
    await waitFor(() =>
      expect(hoisted.updateEmailPreferencesRequest).toHaveBeenCalledWith({
        lectures: true,
      }),
    )
  })

  it('cancelling leaves the toggle untouched', async () => {
    hoisted.fetchEmailPreferences.mockResolvedValue(ALL_ON)
    renderTab()

    await waitFor(() => expect(toggle('lectures')).toBeTruthy())
    fireEvent.click(toggle('lectures'))
    await waitFor(() =>
      expect(
        screen.getByTestId('profile-email-preference-dialog'),
      ).toBeTruthy(),
    )
    fireEvent.click(
      screen.getByTestId('profile-email-preference-dialog-cancel'),
    )

    await waitFor(() =>
      expect(
        screen.queryByTestId('profile-email-preference-dialog'),
      ).toBeNull(),
    )
    expect(hoisted.updateEmailPreferencesRequest).not.toHaveBeenCalled()
    expect(toggle('lectures').getAttribute('aria-checked')).toBe('true')
  })

  it('reflects the confirmed value once the write succeeds', async () => {
    hoisted.fetchEmailPreferences.mockResolvedValue(ALL_ON)
    hoisted.updateEmailPreferencesRequest.mockResolvedValue({
      ...ALL_ON,
      tickets: false,
    })
    renderTab()

    await waitFor(() => expect(toggle('tickets')).toBeTruthy())
    fireEvent.click(toggle('tickets'))
    fireEvent.click(
      await waitFor(() =>
        screen.getByTestId('profile-email-preference-dialog-confirm'),
      ),
    )

    await waitFor(() =>
      expect(toggle('tickets').getAttribute('aria-checked')).toBe('false'),
    )
  })

  it('rolls back to the stored value when the write fails', async () => {
    hoisted.fetchEmailPreferences.mockResolvedValue(ALL_ON)
    hoisted.updateEmailPreferencesRequest.mockRejectedValue(new Error('boom'))
    renderTab()

    await waitFor(() => expect(toggle('tickets')).toBeTruthy())
    fireEvent.click(toggle('tickets'))
    fireEvent.click(
      await waitFor(() =>
        screen.getByTestId('profile-email-preference-dialog-confirm'),
      ),
    )

    await waitFor(() =>
      expect(
        screen.queryByTestId('profile-email-preference-dialog'),
      ).toBeNull(),
    )
    expect(toggle('tickets').getAttribute('aria-checked')).toBe('true')
  })

  it('fires open and confirm analytics events', async () => {
    hoisted.fetchEmailPreferences.mockResolvedValue(ALL_ON)
    hoisted.updateEmailPreferencesRequest.mockResolvedValue(ALL_ON)
    renderTab()

    await waitFor(() => expect(toggle('discussions')).toBeTruthy())
    fireEvent.click(toggle('discussions'))
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_email_preference_toggle_open',
      { preference: 'discussions', next_value: false },
    )

    fireEvent.click(
      await waitFor(() =>
        screen.getByTestId('profile-email-preference-dialog-confirm'),
      ),
    )
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_email_preference_toggle_confirm',
      { preference: 'discussions', next_value: false },
    )
  })
})
