// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignInFlow } from '@/components/features/sign-in/SignInFlow'

const { navigateMock, redirectToOldStudentUiMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  redirectToOldStudentUiMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/utils/authRedirect', () => ({
  redirectToOldStudentUi: redirectToOldStudentUiMock,
}))

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
    redirectToOldStudentUiMock.mockReset()
    delete (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer
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
      if (url.includes('/v2/auth/linked-accounts')) {
        return new Response(
          JSON.stringify({
            accounts: [
              {
                user: { id: 1, name: 'Test', email: 'swap@example.com', mobile: null, role: 'student' },
                sessionId: 'session-1',
                isActive: true,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.includes('/v2/auth/use-account')) {
        return new Response(
          JSON.stringify({
            user: { id: 2, name: 'Other', email: 'other@example.com', mobile: null, role: 'student' },
            token: 'jwt-switched',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('not found', { status: 404 })
    })
  })

  it('walks through email password path and navigates home', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    ;(window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer = []

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
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sso-v2-success',
      }),
    )
    expect(
      (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'sso_v2_success',
          source: 'sso-v2',
          method: 'email-password',
          token: 'jwt',
        }),
      ]),
    )
  })

  it('dispatches failure event for password login failure', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    ;(window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer = []

    stubFetchJson(async (url) => {
      if (url.includes('/v2/login/') && !url.includes('request-otp') && !url.includes('verify-otp')) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INCORRECT_CREDENTIALS',
              message: 'Incorrect credentials',
            },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('not found', { status: 404 })
    })

    render(<SignInFlow />)

    fireEvent.change(screen.getByLabelText(/email or mobile/i), {
      target: { value: 'demo@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByText(/incorrect credentials/i)).toBeTruthy()
    })
    expect(navigateMock).not.toHaveBeenCalled()
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sso-v2-failure',
      }),
    )
    expect(
      (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'sso_v2_failure',
          source: 'sso-v2',
          method: 'email-password',
          error: 'Incorrect credentials',
        }),
      ]),
    )
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

  it('shows linked accounts after phone OTP and switches account before old-lms redirect', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    ;(window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer = []

    stubFetchJson(async (url) => {
      if (url.includes('/v2/login/request-otp')) {
        return new Response(JSON.stringify({ channel: 'sms' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.includes('/v2/login/verify-otp')) {
        return new Response(
          JSON.stringify({
            user: { id: 1, name: 'Primary User', email: 'primary@example.com', mobile: '9000000000', role: 'student' },
            token: 'jwt-primary',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.includes('/v2/auth/linked-accounts')) {
        return new Response(
          JSON.stringify({
            accounts: [
              {
                user: { id: 1, name: 'Primary User', email: 'primary@example.com', mobile: '9000000000', role: 'student' },
                sessionId: 'session-primary',
                isActive: true,
              },
              {
                user: { id: 2, name: 'Secondary User', email: 'secondary@example.com', mobile: '9000000000', role: 'student' },
                sessionId: 'session-secondary',
                isActive: false,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.includes('/v2/auth/use-account')) {
        return new Response(
          JSON.stringify({
            user: { id: 2, name: 'Secondary User', email: 'secondary@example.com', mobile: '9000000000', role: 'student' },
            token: 'jwt-secondary',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('not found', { status: 404 })
    })

    render(<SignInFlow />)

    fireEvent.change(screen.getByLabelText(/email or mobile/i), {
      target: { value: '9000000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/sign-in code/i)).toBeTruthy()
    })

    fireEvent.change(screen.getByLabelText(/sign-in code/i), {
      target: { value: '1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByText(/choose an account/i)).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /secondary user secondary@example\.com/i }))

    await waitFor(() => {
      expect(redirectToOldStudentUiMock).toHaveBeenCalled()
    })
    expect(navigateMock).not.toHaveBeenCalled()
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sso-v2-success',
      }),
    )
    expect(
      (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'sso_v2_success',
          source: 'sso-v2',
          method: 'phone-use-account',
          token: 'jwt-secondary',
        }),
      ]),
    )
  })
})
