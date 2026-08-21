import type { VerifyOtpResult } from '@/components/features/sign-in/v2AuthClient'

const STORAGE_KEY = 'student-lms.pending-phone-otp-sign-in'

type PendingPhoneOtpSignIn = {
  response: VerifyOtpResult
  rememberMe: boolean
}

export function savePendingPhoneOtpSignIn(
  response: VerifyOtpResult,
  rememberMe = false,
): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const payload: PendingPhoneOtpSignIn = { response, rememberMe }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage issues; redirect flow can still continue without this context.
  }
}

export function takePendingPhoneOtpSignIn(): PendingPhoneOtpSignIn | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as PendingPhoneOtpSignIn | VerifyOtpResult
    if (parsed && typeof parsed === 'object' && 'response' in parsed) {
      return {
        response: parsed.response,
        rememberMe: parsed.rememberMe === true,
      }
    }
    return { response: parsed, rememberMe: false }
  } catch {
    return null
  }
}
