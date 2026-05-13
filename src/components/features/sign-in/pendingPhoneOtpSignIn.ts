import type { VerifyOtpResult } from '@/components/features/sign-in/v2AuthClient'

const STORAGE_KEY = 'student-lms.pending-phone-otp-sign-in'

export function savePendingPhoneOtpSignIn(response: VerifyOtpResult): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(response))
  } catch {
    // Ignore storage issues; redirect flow can still continue without this context.
  }
}

export function takePendingPhoneOtpSignIn(): VerifyOtpResult | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    window.sessionStorage.removeItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw) as VerifyOtpResult
  } catch {
    return null
  }
}
