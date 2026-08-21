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
import { ChangePasswordCard } from './ChangePasswordCard'
import { ApiClientError } from '@/lib/api/apiClientError'

const hoisted = vi.hoisted(() => ({
  updatePasswordRequest: vi.fn(),
  pushGtmEvent: vi.fn(),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  updatePasswordRequest: hoisted.updatePasswordRequest,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

function setup(isEditing = true) {
  const props = {
    isEditing,
    isDimmed: false,
    onEdit: vi.fn(),
    onClose: vi.fn(),
    onSaved: vi.fn(),
  }
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return {
    props,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ChangePasswordCard {...props} />
      </QueryClientProvider>,
    ),
  }
}

function fill(values: { current?: string; next?: string; confirm?: string }) {
  if (values.current !== undefined) {
    fireEvent.change(screen.getByTestId('profile-password-current'), {
      target: { value: values.current },
    })
  }
  if (values.next !== undefined) {
    fireEvent.change(screen.getByTestId('profile-password-new'), {
      target: { value: values.next },
    })
  }
  if (values.confirm !== undefined) {
    fireEvent.change(screen.getByTestId('profile-password-confirm'), {
      target: { value: values.confirm },
    })
  }
}

const save = () =>
  screen.getByTestId<HTMLButtonElement>('profile-password-save')

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ChangePasswordCard — read mode', () => {
  it('masks the password and offers a Change affordance', () => {
    setup(false)
    expect(screen.getByTestId('profile-field-password-value').textContent).toBe(
      '••••••••',
    )
    expect(screen.queryByTestId('profile-password-current')).toBeNull()
  })

  it('opens editing and fires an analytics event', () => {
    const { props } = setup(false)
    fireEvent.click(screen.getByTestId('profile-field-password-edit'))
    expect(props.onEdit).toHaveBeenCalled()
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_password_change_open',
      {},
    )
  })
})

describe('ChangePasswordCard — edit mode', () => {
  it('shows a live rule checklist that updates as you type', () => {
    setup()
    const lengthRule = () => screen.getByTestId('profile-password-rule-length')
    const spacesRule = () =>
      screen.getByTestId('profile-password-rule-no-spaces')

    expect(lengthRule().getAttribute('data-satisfied')).toBe('false')
    expect(spacesRule().getAttribute('data-satisfied')).toBe('false')

    fill({ next: 'has space in it' })
    expect(lengthRule().getAttribute('data-satisfied')).toBe('true')
    expect(spacesRule().getAttribute('data-satisfied')).toBe('false')

    fill({ next: 'brandnewpass' })
    expect(spacesRule().getAttribute('data-satisfied')).toBe('true')
  })

  it('keeps Save disabled until the form is complete and valid', () => {
    setup()
    expect(save().disabled).toBe(true)

    fill({ current: 'old', next: 'brandnewpass', confirm: 'different' })
    expect(save().disabled).toBe(true)
    expect(screen.getByTestId('profile-password-error').textContent).toContain(
      'does not match',
    )

    fill({ confirm: 'brandnewpass' })
    expect(save().disabled).toBe(false)
  })

  it('blocks a too-short password with an explanation', () => {
    setup()
    fill({ current: 'old', next: 'short', confirm: 'short' })
    expect(save().disabled).toBe(true)
    expect(screen.getByTestId('profile-password-error').textContent).toContain(
      '8 characters',
    )
  })

  it('submits and reports success', async () => {
    hoisted.updatePasswordRequest.mockResolvedValue({ updated: true })
    const { props } = setup()

    fill({
      current: 'old-secret',
      next: 'brandnewpass',
      confirm: 'brandnewpass',
    })
    fireEvent.click(save())

    await waitFor(() =>
      expect(hoisted.updatePasswordRequest).toHaveBeenCalledWith({
        currentPassword: 'old-secret',
        newPassword: 'brandnewpass',
      }),
    )
    await waitFor(() => expect(props.onSaved).toHaveBeenCalled())
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_password_change_submit',
      {},
    )
  })

  it('names the wrong-current-password failure specifically', async () => {
    hoisted.updatePasswordRequest.mockRejectedValue(
      new ApiClientError(400, { code: 'INCORRECT_CURRENT_PASSWORD' }),
    )
    setup()

    fill({ current: 'wrong', next: 'brandnewpass', confirm: 'brandnewpass' })
    fireEvent.click(save())

    await waitFor(() =>
      expect(
        screen.getByTestId('profile-password-error').textContent,
      ).toContain('current password is incorrect'),
    )
  })

  it('explains a reused password and a weak-password rejection', async () => {
    hoisted.updatePasswordRequest.mockRejectedValue(
      new ApiClientError(400, { code: 'PASSWORD_UNCHANGED' }),
    )
    const { unmount } = setup()
    fill({ current: 'old', next: 'brandnewpass', confirm: 'brandnewpass' })
    fireEvent.click(save())
    await waitFor(() =>
      expect(
        screen.getByTestId('profile-password-error').textContent,
      ).toContain('have not used here before'),
    )
    unmount()

    hoisted.updatePasswordRequest.mockRejectedValue(
      new ApiClientError(400, { code: 'WEAK_PASSWORD', message: 'No spaces' }),
    )
    setup()
    fill({ current: 'old', next: 'brandnewpass', confirm: 'brandnewpass' })
    fireEvent.click(save())
    await waitFor(() =>
      expect(screen.getByTestId('profile-password-error').textContent).toBe(
        'No spaces',
      ),
    )
  })

  it('falls back to a generic message for an unexpected failure', async () => {
    hoisted.updatePasswordRequest.mockRejectedValue(new Error('boom'))
    setup()

    fill({ current: 'old', next: 'brandnewpass', confirm: 'brandnewpass' })
    fireEvent.click(save())

    await waitFor(() =>
      expect(
        screen.getByTestId('profile-password-error').textContent,
      ).toContain('Could not change your password'),
    )
  })

  it('clears the server error once the user edits a field again', async () => {
    hoisted.updatePasswordRequest.mockRejectedValue(new Error('boom'))
    setup()

    fill({ current: 'old', next: 'brandnewpass', confirm: 'brandnewpass' })
    fireEvent.click(save())
    await waitFor(() =>
      expect(screen.getByTestId('profile-password-error')).toBeTruthy(),
    )

    fill({ current: 'old-again' })
    expect(screen.queryByTestId('profile-password-error')).toBeNull()
  })

  it('cancelling closes without submitting', () => {
    const { props } = setup()
    fill({ current: 'old', next: 'brandnewpass', confirm: 'brandnewpass' })
    fireEvent.click(screen.getByTestId('profile-password-cancel'))

    expect(props.onClose).toHaveBeenCalled()
    expect(hoisted.updatePasswordRequest).not.toHaveBeenCalled()
  })
})
