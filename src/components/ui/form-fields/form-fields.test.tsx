// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CheckboxField, PhoneField, TextField } from './index'

afterEach(cleanup)

describe('TextField', () => {
  it('renders label + required asterisk and emits changes', () => {
    const onChange = vi.fn()
    render(
      <TextField
        id="name"
        label="Name"
        value=""
        onChange={onChange}
        required
        data-testid="f-name"
      />,
    )
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('*')).toBeTruthy()
    fireEvent.change(screen.getByTestId('f-name-input'), {
      target: { value: 'Riya' },
    })
    expect(onChange).toHaveBeenCalledWith('Riya')
  })

  it('shows an error and marks the input invalid', () => {
    render(
      <TextField
        id="email"
        label="Email"
        value="x"
        onChange={vi.fn()}
        error="Invalid email"
        data-testid="f-email"
      />,
    )
    expect(screen.getByTestId('f-email-error').textContent).toBe(
      'Invalid email',
    )
    expect(
      screen.getByTestId('f-email-input').getAttribute('aria-invalid'),
    ).toBe('true')
  })
})

describe('CheckboxField', () => {
  it('toggles and emits the checked state', () => {
    const onChange = vi.fn()
    render(
      <CheckboxField
        id="posh"
        checked={false}
        onChange={onChange}
        data-testid="f-posh"
      >
        I accept
      </CheckboxField>,
    )
    fireEvent.click(screen.getByTestId('f-posh-input'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('PhoneField', () => {
  it('strips non-digits from the number input', () => {
    const onNumber = vi.fn()
    render(
      <PhoneField
        id="phone"
        label="Phone"
        countryValue="+91"
        onCountryChange={vi.fn()}
        numberValue=""
        onNumberChange={onNumber}
        countryOptions={[{ value: '+91', label: '+91' }]}
        data-testid="f-phone"
      />,
    )
    fireEvent.change(screen.getByTestId('f-phone-input'), {
      target: { value: '98a76' },
    })
    expect(onNumber).toHaveBeenCalledWith('9876')
  })
})
