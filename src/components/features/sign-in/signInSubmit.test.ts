import { describe, expect, it } from 'vitest'
import type { SignInState } from '@/components/features/sign-in/signInReducer'
import { getSignInSubmitError } from '@/components/features/sign-in/signInSubmit'

describe('getSignInSubmitError', () => {
  it('returns null for identifier step', () => {
    const s: SignInState = { step: 'identifier', draft: '' }
    expect(getSignInSubmitError(s)).toBeNull()
  })

  it('requires password in email password mode', () => {
    const s: SignInState = {
      step: 'email',
      email: 'a@b.c',
      authMode: 'password',
      password: '   ',
      otp: '',
    }
    expect(getSignInSubmitError(s)).toMatch(/password/i)
  })

  it('requires six-digit otp in email otp mode', () => {
    const s: SignInState = {
      step: 'email',
      email: 'a@b.c',
      authMode: 'otp',
      password: '',
      otp: '12345',
    }
    expect(getSignInSubmitError(s)).toMatch(/6/)
  })

  it('accepts valid email password', () => {
    const s: SignInState = {
      step: 'email',
      email: 'a@b.c',
      authMode: 'password',
      password: 'secret',
      otp: '',
    }
    expect(getSignInSubmitError(s)).toBeNull()
  })

  it('accepts valid email otp', () => {
    const s: SignInState = {
      step: 'email',
      email: 'a@b.c',
      authMode: 'otp',
      password: '',
      otp: '000000',
    }
    expect(getSignInSubmitError(s)).toBeNull()
  })

  it('requires six-digit otp for phone', () => {
    const s: SignInState = {
      step: 'phone',
      displayPhone: '9',
      digits: '9000000000',
      delivery: 'sms',
      otp: '12',
      resendCount: 0,
    }
    expect(getSignInSubmitError(s)).toMatch(/6/)
  })

  it('accepts valid phone otp', () => {
    const s: SignInState = {
      step: 'phone',
      displayPhone: '9',
      digits: '9000000000',
      delivery: 'whatsapp',
      otp: '654321',
      resendCount: 0,
    }
    expect(getSignInSubmitError(s)).toBeNull()
  })
})
