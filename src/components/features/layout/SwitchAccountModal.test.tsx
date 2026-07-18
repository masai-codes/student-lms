// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SwitchAccountModal } from './SwitchAccountModal'

vi.mock('@/components/features/sign-in/SwitchAccountFlow', () => ({
  SwitchAccountFlow: ({
    onAccountSwitched,
  }: {
    onAccountSwitched?: () => void
  }) => (
    <button type="button" onClick={onAccountSwitched}>
      fake-select-account
    </button>
  ),
}))

afterEach(cleanup)

describe('SwitchAccountModal', () => {
  it('renders SwitchAccountFlow when open', () => {
    render(<SwitchAccountModal open onOpenChange={() => {}} />)
    expect(screen.getByText('fake-select-account')).toBeTruthy()
  })

  it('does not render its content when closed', () => {
    render(<SwitchAccountModal open={false} onOpenChange={() => {}} />)
    expect(screen.queryByText('fake-select-account')).toBeNull()
  })

  it('hard-reloads the page when SwitchAccountFlow reports an account was switched', () => {
    const reloadMock = vi.fn()
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadMock },
    })

    render(<SwitchAccountModal open onOpenChange={() => {}} />)
    fireEvent.click(screen.getByText('fake-select-account'))

    expect(reloadMock).toHaveBeenCalledTimes(1)

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })
})
