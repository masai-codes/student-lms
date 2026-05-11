import type { SignInState } from '@/components/features/sign-in/signInReducer'

/** Client-only validation before mock success. */
export function getSignInSubmitError(state: SignInState): string | null {
  if (state.step === 'identifier') {
    return null
  }
  if (state.step === 'email') {
    if (state.authMode === 'password' && state.password.trim().length === 0) {
      return 'Enter your password.'
    }
    if (state.authMode === 'otp' && !/^\d{6}$/.test(state.otp.trim())) {
      return 'Enter the 6-digit code.'
    }
    return null
  }
  if (!/^\d{6}$/.test(state.otp.trim())) {
    return 'Enter the 6-digit code sent to your phone.'
  }
  return null
}
