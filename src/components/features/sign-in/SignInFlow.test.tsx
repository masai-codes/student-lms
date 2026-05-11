// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SignInFlow } from '@/components/features/sign-in/SignInFlow'

describe('SignInFlow', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('walks through email password path with mock submit', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<SignInFlow />)

    fireEvent.change(screen.getByLabelText(/email or mobile/i), {
      target: { value: 'demo@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByText('demo@example.com')).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'hunter2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('password'))
  })

  it('switches email flow between password and OTP', () => {
    render(<SignInFlow />)
    fireEvent.change(screen.getByLabelText(/email or mobile/i), {
      target: { value: 'swap@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    fireEvent.click(screen.getByRole('button', { name: /send otp on email/i }))
    expect(screen.getByLabelText(/one-time code/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /login with password/i }))
    expect(screen.getByLabelText(/^password$/i)).toBeTruthy()
  })

  it('enters phone OTP path after valid phone', () => {
    render(<SignInFlow />)
    fireEvent.change(screen.getByLabelText(/email or mobile/i), {
      target: { value: '9000000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByLabelText(/enter 6-digit code/i)).toBeTruthy()
    expect(screen.getByText('9000000000')).toBeTruthy()
  })
})
