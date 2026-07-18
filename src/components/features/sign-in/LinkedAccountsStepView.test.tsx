// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LinkedAccountsStepView } from './LinkedAccountsStepView'

afterEach(cleanup)

const account = {
  user: { id: 1, name: 'Primary', email: 'primary@example.com', mobile: null, role: 'student' },
  sessionId: 'session-a',
  isActive: true,
}

const otherAccount = {
  user: { id: 2, name: 'Secondary', email: 'secondary@example.com', mobile: null, role: 'student' },
  sessionId: 'session-b',
  isActive: false,
}

describe('LinkedAccountsStepView — current account indicator', () => {
  it('marks only the active account as the current one', () => {
    render(
      <LinkedAccountsStepView
        accounts={[account, otherAccount]}
        onSelectAccount={() => {}}
      />,
    )
    expect(screen.getAllByText('Current account')).toHaveLength(1)
    expect(screen.getByText('Continue with this account')).toBeTruthy()
    expect(screen.getByText('Login with this account')).toBeTruthy()
  })

  it('shows no current-account badge when nothing is active', () => {
    render(
      <LinkedAccountsStepView
        accounts={[{ ...account, isActive: false }]}
        onSelectAccount={() => {}}
      />,
    )
    expect(screen.queryByText('Current account')).toBeNull()
  })
})

describe('LinkedAccountsStepView — add account', () => {
  it('does not render an add-account action when onAddAccount is omitted', () => {
    render(
      <LinkedAccountsStepView accounts={[account]} onSelectAccount={() => {}} />,
    )
    expect(screen.queryByText('Add another account')).toBeNull()
  })

  it('renders and fires onAddAccount when provided', () => {
    const onAddAccount = vi.fn()
    render(
      <LinkedAccountsStepView
        accounts={[account]}
        onSelectAccount={() => {}}
        onAddAccount={onAddAccount}
      />,
    )
    fireEvent.click(screen.getByText('Add another account'))
    expect(onAddAccount).toHaveBeenCalledTimes(1)
  })

  it('disables the add-account action while busy', () => {
    render(
      <LinkedAccountsStepView
        accounts={[account]}
        onSelectAccount={() => {}}
        onAddAccount={() => {}}
        busy
      />,
    )
    const button = screen
      .getByText('Add another account')
      .closest('button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })
})
