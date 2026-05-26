import type { PasswordLoginResult, VerifyOtpResult } from '@/components/features/sign-in/v2AuthClient'

type SignInEventSource = 'sso-v2'
type SignInMethod = 'email-password' | 'email-otp' | 'phone-otp' | 'phone-use-account'

type SignInSuccessDetail = {
  source: SignInEventSource
  method: SignInMethod
  token: string | null
  cookie: string | null
  data: PasswordLoginResult | VerifyOtpResult
}

type SignInFailureDetail = {
  source: SignInEventSource
  method: SignInMethod
  error: string
}

const SUCCESS_EVENT_NAME = 'sso-v2-success'
const SUCCESS_DATALAYER_EVENT = 'sso_v2_success'
const FAILURE_EVENT_NAME = 'sso-v2-failure'
const FAILURE_DATALAYER_EVENT = 'sso_v2_failure'

type WindowWithDataLayer = Window & {
  dataLayer?: Array<Record<string, unknown>>
}

function getCookieSnapshot(token: string | null): string | null {
  if (typeof document === 'undefined') {
    return token
  }

  const cookie = document.cookie.trim()
  if (cookie && token) return `${cookie}; ${token}`
  return cookie || token
}

export function dispatchSignInSuccessEvent(
  source: SignInEventSource,
  method: SignInMethod,
  response: PasswordLoginResult | VerifyOtpResult,
): void {
  try {
    if (typeof window === 'undefined') {
      return
    }

    const detail: SignInSuccessDetail = {
      source,
      method,
      token: response.token,
      cookie: getCookieSnapshot(response.token),
      data: response,
    }

    console.log('[sign-in success]', source, method, response)
    window.dispatchEvent(new CustomEvent(SUCCESS_EVENT_NAME, { detail }))

    const dataLayerWindow = window as WindowWithDataLayer
    if (Array.isArray(dataLayerWindow.dataLayer)) {
      dataLayerWindow.dataLayer.push({
        event: SUCCESS_DATALAYER_EVENT,
        ...detail,
      })
    }
  } catch {
    // Temporary browser-side event/logging should never block navigation.
  }
}

export function dispatchSignInFailureEvent(
  source: SignInEventSource,
  method: SignInMethod,
  error: unknown,
): void {
  try {
    if (typeof window === 'undefined') {
      return
    }

    const detail: SignInFailureDetail = {
      source,
      method,
      error: error instanceof Error ? error.message : String(error),
    }

    console.warn('[sign-in failure]', source, method, detail.error)
    window.dispatchEvent(new CustomEvent(FAILURE_EVENT_NAME, { detail }))

    const dataLayerWindow = window as WindowWithDataLayer
    if (Array.isArray(dataLayerWindow.dataLayer)) {
      dataLayerWindow.dataLayer.push({
        event: FAILURE_DATALAYER_EVENT,
        ...detail,
      })
    }
  } catch {
    // Temporary browser-side event/logging should never block navigation.
  }
}
