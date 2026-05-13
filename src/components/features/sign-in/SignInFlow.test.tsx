// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignInFlow } from '@/components/features/sign-in/SignInFlow'

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

function stubFetchJson(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    return handler(url, init)
  }) as typeof fetch
}

describe('SignInFlow', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    navigateMock.mockReset()
  })

  beforeEach(() => {
    stubFetchJson(async (url) => {
      if (url.includes('/v2/login/request-otp')) {
        return new Response(JSON.stringify({ channel: 'sms' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.includes('/v2/login/') && !url.includes('request-otp') && !url.includes('verify-otp')) {
        return new Response(
          JSON.stringify({
            user: { id: 1, name: 'Test', email: 'demo@example.com', mobile: null, role: 'student' },
            token: 'jwt',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.includes('/v2/login/verify-otp')) {
        return new Response(
          JSON.stringify({
            user: { id: 1, name: 'Test', email: 'swap@example.com', mobile: null, role: 'student' },
            token: 'jwt',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('not found', { status: 404 })
    })
  })

  it('walks through email password path and navigates home', async () => {
    render(<SignInFlow />)

    fireEvent.change(screen.getByLabelText(/email or mobile/i), {
      target: { value: 'demo@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText('demo@example.com')).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'hunter2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' })
    })
  })

  it('switches email flow between password and OTP', async () => {
    render(<SignInFlow />)
    fireEvent.change(screen.getByLabelText(/email or mobile/i), {
      target: { value: 'swap@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    fireEvent.click(screen.getByRole('button', { name: /send otp on email/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/sign-in code/i)).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /login with password/i }))
    expect(screen.getByLabelText(/^password$/i)).toBeTruthy()
  })

  it('enters phone OTP path after valid phone and request-otp succeeds', async () => {
    render(<SignInFlow />)
    fireEvent.change(screen.getByLabelText(/email or mobile/i), {
      target: { value: '9000000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/sign-in code/i)).toBeTruthy()
    })
    expect(screen.getByText('9000000000')).toBeTruthy()
  })
})
