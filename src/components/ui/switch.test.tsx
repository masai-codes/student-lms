// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Switch } from './switch'

afterEach(cleanup)

describe('Switch', () => {
  it('reflects the checked state via aria-checked and data-state', () => {
    render(<Switch checked onCheckedChange={() => {}} aria-label="toggle" />)
    const toggle = screen.getByRole('switch', { name: 'toggle' })
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(toggle.getAttribute('data-state')).toBe('checked')
  })

  it('calls onCheckedChange with the toggled value when clicked', () => {
    const onCheckedChange = vi.fn()
    render(
      <Switch
        checked={false}
        onCheckedChange={onCheckedChange}
        aria-label="toggle"
      />,
    )
    fireEvent.click(screen.getByRole('switch', { name: 'toggle' }))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('does not fire when disabled', () => {
    const onCheckedChange = vi.fn()
    render(
      <Switch
        checked={false}
        disabled
        onCheckedChange={onCheckedChange}
        aria-label="toggle"
      />,
    )
    const toggle = screen.getByRole('switch', { name: 'toggle' })
    expect(toggle.hasAttribute('disabled')).toBe(true)
    fireEvent.click(toggle)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})
