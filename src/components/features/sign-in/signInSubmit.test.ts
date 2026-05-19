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
      resendCount: 0,
    }
    expect(getSignInSubmitError(s)).toMatch(/password/i)
  })

  it('requires non-empty otp in email otp mode', () => {
    const s: SignInState = {
      step: 'email',
      email: 'a@b.c',
      authMode: 'otp',
      password: '',
      otp: '   ',
      resendCount: 0,
    }
    expect(getSignInSubmitError(s)).toMatch(/code/i)
  })

  it('accepts valid email password', () => {
    const s: SignInState = {
      step: 'email',
      email: 'a@b.c',
      authMode: 'password',
      password: 'secret',
      otp: '',
      resendCount: 0,
    }
    expect(getSignInSubmitError(s)).toBeNull()
  })

  it('accepts valid email otp', () => {
    const s: SignInState = {
      step: 'email',
      email: 'a@b.c',
      authMode: 'otp',
      password: '',
      otp: '9999',
      resendCount: 0,
    }
    expect(getSignInSubmitError(s)).toBeNull()
  })

  it('requires non-empty otp for phone', () => {
    const s: SignInState = {
      step: 'phone',
      displayPhone: '9',
      digits: '9000000000',
      delivery: 'sms',
      otp: '  ',
      resendCount: 0,
    }
    expect(getSignInSubmitError(s)).toMatch(/code/i)
  })

  it('accepts valid phone otp', () => {
    const s: SignInState = {
      step: 'phone',
      displayPhone: '9',
      digits: '9000000000',
      delivery: 'whatsapp',
      otp: '1234',
      resendCount: 0,
    }
    expect(getSignInSubmitError(s)).toBeNull()
  })
})
