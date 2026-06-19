// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SwitchAccountFlow } from '@/components/features/sign-in/SwitchAccountFlow'

const {
  navigateMock,
  redirectToOldStudentUiMock,
  isLegacyStudentRedirectEnabledMock,
  getRedirectToSearchParamMock,
  redirectToResolvedUrlMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  redirectToOldStudentUiMock: vi.fn(),
  isLegacyStudentRedirectEnabledMock: vi.fn(),
  getRedirectToSearchParamMock: vi.fn(),
  redirectToResolvedUrlMock: vi.fn(),
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
  isLegacyStudentRedirectEnabled: isLegacyStudentRedirectEnabledMock,
}))

vi.mock('@/components/features/sign-in/signInRouting', () => ({
  getRedirectToSearchParam: getRedirectToSearchParamMock,
  redirectToResolvedUrl: redirectToResolvedUrlMock,
}))

function stubFetchJson(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    return handler(url, init)
  }) as typeof fetch
}

describe('SwitchAccountFlow', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    navigateMock.mockReset()
    redirectToOldStudentUiMock.mockReset()
    isLegacyStudentRedirectEnabledMock.mockReset()
    getRedirectToSearchParamMock.mockReset()
    redirectToResolvedUrlMock.mockReset()
    window.sessionStorage.clear()
    delete (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer
  })

  beforeEach(() => {
    getRedirectToSearchParamMock.mockReturnValue(null)
    isLegacyStudentRedirectEnabledMock.mockReturnValue(true)
    stubFetchJson(async (url) => {
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
  })

  it('shows compact account cards on switch-account page', async () => {
    render(<SwitchAccountFlow />)

    await waitFor(() => {
      expect(screen.getByText(/we found that you have multiple accounts/i)).toBeTruthy()
    })

    expect(screen.getByText(/primary user/i)).toBeTruthy()
    expect(screen.getByText(/secondary user/i)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /login with this account/i })).toHaveLength(2)
  })

  it('continues with active account and dispatches pending phone-otp success', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    ;(window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer = []
    window.sessionStorage.setItem(
      'student-lms.pending-phone-otp-sign-in',
      JSON.stringify({
        user: { id: 1, name: 'Primary User', email: 'primary@example.com', mobile: '9000000000', role: 'student' },
        token: 'jwt-primary',
      }),
    )

    render(<SwitchAccountFlow />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /login with this account/i })).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /login with this account/i })[0])

    await waitFor(() => {
      expect(redirectToOldStudentUiMock).toHaveBeenCalled()
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
          method: 'phone-otp',
          token: 'jwt-primary',
        }),
      ]),
    )
  })

  it('switches inactive account and redirects to old lms', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    ;(window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer = []

    render(<SwitchAccountFlow />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /login with this account/i })).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /login with this account/i })[1])

    await waitFor(() => {
      expect(redirectToOldStudentUiMock).toHaveBeenCalled()
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
          method: 'phone-use-account',
          token: 'jwt-secondary',
        }),
      ]),
    )
  })

  it('uses redirectTo on switch-account page when present', async () => {
    getRedirectToSearchParamMock.mockReturnValue('https://example.com/final-target')

    render(<SwitchAccountFlow />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /login with this account/i })).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /login with this account/i })[1])

    await waitFor(() => {
      expect(redirectToResolvedUrlMock).toHaveBeenCalledWith('https://example.com/final-target')
    })
    expect(redirectToOldStudentUiMock).not.toHaveBeenCalled()
  })

  it('navigates within the new app after account selection when legacy redirect is disabled', async () => {
    isLegacyStudentRedirectEnabledMock.mockReturnValue(false)

    render(<SwitchAccountFlow />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /login with this account/i })).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /login with this account/i })[1])

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' })
    })
    expect(redirectToOldStudentUiMock).not.toHaveBeenCalled()
  })

  it('redirects to signin when linked-accounts returns 401', async () => {
    stubFetchJson(async (url) => {
      if (url.includes('/v2/auth/linked-accounts')) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'UNAUTHENTICATED',
              message: 'Not signed in',
            },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('not found', { status: 404 })
    })

    render(<SwitchAccountFlow />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/signin' })
    })
  })
})
