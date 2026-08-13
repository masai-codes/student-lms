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
import { ProfileDetailsTab } from './ProfileDetailsTab'
import type { ProfileOverview } from '@/server/api/profile/profile.types'

const hoisted = vi.hoisted(() => ({
  updateProfileRequest: vi.fn(),
  updatePasswordRequest: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  updateProfileRequest: hoisted.updateProfileRequest,
  updatePasswordRequest: hoisted.updatePasswordRequest,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

function profile(overrides: Partial<ProfileOverview> = {}): ProfileOverview {
  return {
    name: 'Riya',
    email: 'riya@example.com',
    avatarUrl: null,
    phone: '9876543210',
    studentCodes: [],
    isNewUserJourney: false,
    hasFullFees: false,
    ...overrides,
  }
}

function renderTab(overrides: Partial<ProfileOverview> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileDetailsTab profile={profile(overrides)} />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProfileDetailsTab', () => {
  it('renders the name, phone and password cards', () => {
    renderTab()
    expect(screen.getByTestId('profile-field-name')).toBeTruthy()
    expect(screen.getByTestId('profile-field-phone')).toBeTruthy()
    expect(screen.getByTestId('profile-field-password')).toBeTruthy()
  })

  it('shows the stored values', () => {
    renderTab()
    expect(screen.getByTestId('profile-field-name-value').textContent).toBe(
      'Riya',
    )
    expect(screen.getByTestId('profile-field-phone-value').textContent).toBe(
      '9876543210',
    )
  })

  it('shows "Not set" when no phone number is stored', () => {
    renderTab({ phone: null })
    expect(screen.getByTestId('profile-field-phone-value').textContent).toBe(
      'Not set',
    )
  })

  it('makes the other cards inert while one is being edited', () => {
    renderTab()
    fireEvent.click(screen.getByTestId('profile-field-name-edit'))

    expect(
      screen.getByTestId('profile-field-phone').getAttribute('aria-disabled'),
    ).toBe('true')
    expect(
      screen.getByTestId('profile-field-password').getAttribute('aria-disabled'),
    ).toBe('true')
    expect(
      screen.getByTestId('profile-field-name').getAttribute('aria-disabled'),
    ).toBeNull()
  })

  it('saves a trimmed name and confirms it', async () => {
    hoisted.updateProfileRequest.mockResolvedValue({
      name: 'Riya Sharma',
      phone: '9876543210',
    })
    renderTab()

    fireEvent.click(screen.getByTestId('profile-field-name-edit'))
    fireEvent.change(screen.getByTestId('profile-field-name-input'), {
      target: { value: '  Riya Sharma  ' },
    })
    fireEvent.click(screen.getByTestId('profile-field-name-save'))

    await waitFor(() =>
      expect(hoisted.updateProfileRequest).toHaveBeenCalledWith({
        name: 'Riya Sharma',
      }),
    )
    await waitFor(() =>
      expect(screen.getByTestId('profile-details-status').textContent).toBe(
        'Name updated',
      ),
    )
  })

  it('rejects a blank name without calling the API', () => {
    renderTab()
    fireEvent.click(screen.getByTestId('profile-field-name-edit'))
    fireEvent.change(screen.getByTestId('profile-field-name-input'), {
      target: { value: '   ' },
    })

    expect(
      screen.getByTestId<HTMLButtonElement>('profile-field-name-save').disabled,
    ).toBe(true)
    expect(hoisted.updateProfileRequest).not.toHaveBeenCalled()
  })

  it('restricts the phone field to digits and shows the length rule', () => {
    renderTab({ phone: null })
    fireEvent.click(screen.getByTestId('profile-field-phone-edit'))

    const input = screen.getByTestId<HTMLInputElement>(
      'profile-field-phone-input',
    )
    fireEvent.change(input, { target: { value: '98abc765-4321099' } })
    // Leading 9 ⇒ Indian ⇒ capped at 10 digits.
    expect(input.value).toBe('9876543210')
    expect(screen.getByTestId('profile-field-phone-hint').textContent).toBe(
      '10 digits required',
    )
  })

  it('blocks Save for an incomplete Indian number', () => {
    renderTab({ phone: null })
    fireEvent.click(screen.getByTestId('profile-field-phone-edit'))
    fireEvent.change(screen.getByTestId('profile-field-phone-input'), {
      target: { value: '98765' },
    })

    expect(
      screen.getByTestId<HTMLButtonElement>('profile-field-phone-save').disabled,
    ).toBe(true)
    expect(screen.getByTestId('profile-field-phone-error').textContent).toContain(
      'exactly 10 digits',
    )
  })

  it('saves a valid phone number and confirms it', async () => {
    hoisted.updateProfileRequest.mockResolvedValue({
      name: 'Riya',
      phone: '9876543211',
    })
    renderTab()

    fireEvent.click(screen.getByTestId('profile-field-phone-edit'))
    fireEvent.change(screen.getByTestId('profile-field-phone-input'), {
      target: { value: '9876543211' },
    })
    fireEvent.click(screen.getByTestId('profile-field-phone-save'))

    await waitFor(() =>
      expect(hoisted.updateProfileRequest).toHaveBeenCalledWith({
        secondaryMobile: '9876543211',
      }),
    )
    await waitFor(() =>
      expect(screen.getByTestId('profile-details-status').textContent).toBe(
        'Phone number updated',
      ),
    )
  })

  it('reports a failed save', async () => {
    hoisted.updateProfileRequest.mockRejectedValue(new Error('boom'))
    renderTab()

    fireEvent.click(screen.getByTestId('profile-field-name-edit'))
    fireEvent.click(screen.getByTestId('profile-field-name-save'))

    await waitFor(() =>
      expect(
        screen.getByTestId('profile-details-status').textContent,
      ).toContain('Could not save your changes'),
    )
  })

  it('closes the editor after a successful save', async () => {
    hoisted.updateProfileRequest.mockResolvedValue({
      name: 'Riya',
      phone: null,
    })
    renderTab()

    fireEvent.click(screen.getByTestId('profile-field-name-edit'))
    expect(screen.getByTestId('profile-field-name-input')).toBeTruthy()
    fireEvent.click(screen.getByTestId('profile-field-name-save'))

    await waitFor(() =>
      expect(screen.queryByTestId('profile-field-name-input')).toBeNull(),
    )
  })

  it('reports a password change through the same status line', async () => {
    hoisted.updatePasswordRequest.mockResolvedValue({ updated: true })
    renderTab()

    fireEvent.click(screen.getByTestId('profile-field-password-edit'))
    fireEvent.change(screen.getByTestId('profile-password-current'), {
      target: { value: 'old-secret' },
    })
    fireEvent.change(screen.getByTestId('profile-password-new'), {
      target: { value: 'brandnewpass' },
    })
    fireEvent.change(screen.getByTestId('profile-password-confirm'), {
      target: { value: 'brandnewpass' },
    })
    fireEvent.click(screen.getByTestId('profile-password-save'))

    await waitFor(() =>
      expect(screen.getByTestId('profile-details-status').textContent).toBe(
        'Password changed',
      ),
    )
  })

  it('cancelling closes the editor and leaves the value alone', () => {
    renderTab()
    fireEvent.click(screen.getByTestId('profile-field-name-edit'))
    fireEvent.change(screen.getByTestId('profile-field-name-input'), {
      target: { value: 'Discarded' },
    })
    fireEvent.click(screen.getByTestId('profile-field-name-cancel'))

    expect(screen.getByTestId('profile-field-name-value').textContent).toBe(
      'Riya',
    )
    expect(hoisted.updateProfileRequest).not.toHaveBeenCalled()
  })
})
