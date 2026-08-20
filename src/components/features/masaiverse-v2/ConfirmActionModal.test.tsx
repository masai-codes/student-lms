// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ConfirmActionModal from './ConfirmActionModal'
import type { ComponentProps } from 'react'

afterEach(cleanup)

function renderModal(
  props: Partial<ComponentProps<typeof ConfirmActionModal>> = {},
) {
  const onConfirm = vi.fn()
  const onOpenChange = vi.fn()
  render(
    <ConfirmActionModal
      open
      onOpenChange={onOpenChange}
      confirmationText="Please **read** before continuing."
      confirmLabel="Confirm"
      onConfirm={onConfirm}
      {...props}
    />,
  )
  return { onConfirm, onOpenChange }
}

describe('ConfirmActionModal', () => {
  it('renders the confirmation text as markdown', () => {
    renderModal()
    // The bold markdown is rendered as a <strong>, proving RichContent ran.
    const strong = screen.getByText('read')
    expect(strong.tagName).toBe('STRONG')
  })

  it('keeps confirm disabled until the checkbox is ticked', () => {
    const { onConfirm } = renderModal()
    const confirm = screen.getByRole('button', { name: 'Confirm' })
    expect((confirm as HTMLButtonElement).disabled).toBe(true)

    // A click while disabled does nothing.
    fireEvent.click(confirm)
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('checkbox'))
    expect((confirm as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('keeps confirm disabled while a request is pending even when acknowledged', () => {
    renderModal({ isPending: true })
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('button', { name: 'Confirm' }).disabled).toBe(true)
  })

  it('requests close when Cancel is clicked', () => {
    const { onOpenChange } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uses the provided title and checkbox label', () => {
    renderModal({ title: 'Are you sure?', checkboxLabel: 'I agree to terms' })
    expect(screen.getByText('Are you sure?')).toBeTruthy()
    expect(screen.getByText('I agree to terms')).toBeTruthy()
  })
})
