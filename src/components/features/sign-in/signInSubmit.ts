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
    if (state.authMode === 'otp' && state.otp.trim().length === 0) {
      return 'Enter the code from your email.'
    }
    return null
  }
  if (state.step === 'phone') {
    if (state.otp.trim().length === 0) {
      return 'Enter the code sent to your phone.'
    }
    return null
  }
  return null
}
