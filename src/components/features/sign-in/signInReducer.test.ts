import { describe, expect, it } from 'vitest'
import {
  initialSignInState,
  signInReducer,
} from '@/components/features/sign-in/signInReducer'

describe('signInReducer', () => {
  it('updates identifier draft and clears error', () => {
    let s = signInReducer(
      { step: 'identifier', draft: '', error: 'x' },
      { type: 'identifier_draft', value: 'a' },
    )
    expect(s).toEqual({ step: 'identifier', draft: 'a', error: undefined })
    s = signInReducer(s, { type: 'identifier_draft', value: 'ab' })
    expect(s).toMatchObject({ draft: 'ab' })
  })

  it('ignores identifier_draft when not on identifier step', () => {
    const emailState = signInReducer(initialSignInState, { type: 'identifier_draft', value: 'x@y.z' })
    const after = signInReducer(emailState, { type: 'identifier_submit' })
    const ignored = signInReducer(after, { type: 'identifier_draft', value: 'nope' })
    expect(ignored).toEqual(after)
  })

  it('identifier_submit shows error for invalid input', () => {
    const s = signInReducer({ step: 'identifier', draft: 'bad' }, { type: 'identifier_submit' })
    expect(s.step).toBe('identifier')
    expect(s).toMatchObject({ error: expect.any(String) })
  })

  it('identifier_submit transitions to email', () => {
    const s = signInReducer(
      { step: 'identifier', draft: 'hello@world.test' },
      { type: 'identifier_submit' },
    )
    expect(s).toEqual({
      step: 'email',
      email: 'hello@world.test',
      authMode: 'password',
      password: '',
      otp: '',
      resendCount: 0,
    })
  })

  it('identifier_submit does not transition to phone (OTP is requested separately)', () => {
    const s = signInReducer({ step: 'identifier', draft: '9988776655' }, { type: 'identifier_submit' })
    expect(s).toEqual({ step: 'identifier', draft: '9988776655', error: undefined })
  })

  it('phone_enter sets phone step', () => {
    const s = signInReducer(initialSignInState, {
      type: 'phone_enter',
      displayPhone: '9988776655',
      digits: '9988776655',
      delivery: 'sms',
      otpSessionId: 'otp-session-1',
      info: 'We sent a code.',
    })
    expect(s).toMatchObject({
      step: 'phone',
      displayPhone: '9988776655',
      digits: '9988776655',
      delivery: 'sms',
      otpSessionId: 'otp-session-1',
      otp: '',
      resendCount: 0,
      info: 'We sent a code.',
    })
  })

  it('back_to_identifier restores draft from email or phone', () => {
    const email = signInReducer(
      { step: 'identifier', draft: 'a@b.co' },
      { type: 'identifier_submit' },
    )
    expect(signInReducer(email, { type: 'back_to_identifier' })).toEqual({
      step: 'identifier',
      draft: 'a@b.co',
    })
    const phone = signInReducer(initialSignInState, {
      type: 'phone_enter',
      displayPhone: '9000000000',
      digits: '9000000000',
      delivery: 'whatsapp',
      otpSessionId: 'otp-session-1',
      info: 'sent',
    })
    if (phone.step !== 'phone') throw new Error('expected phone')
    expect(signInReducer(phone, { type: 'back_to_identifier' })).toEqual({
      step: 'identifier',
      draft: '9000000000',
    })
  })

  it('toggles email auth mode and email OTP requested', () => {
    let s = signInReducer(
      { step: 'identifier', draft: 'user@example.com' },
      { type: 'identifier_submit' },
    )
    if (s.step !== 'email') throw new Error('expected email')
    s = signInReducer(s, {
      type: 'email_otp_requested',
      otpSessionId: 'otp-session-email',
      info: 'Code sent to user@example.com',
    })
    expect(s.authMode).toBe('otp')
    expect(s.otpSessionId).toBe('otp-session-email')
    expect(s.info).toBe('Code sent to user@example.com')
    s = signInReducer(s, { type: 'email_use_password_mock' })
    expect(s.authMode).toBe('password')
    expect(s.info).toBeUndefined()
    s = signInReducer(s, {
      type: 'email_otp_requested',
      otpSessionId: 'otp-session-email-2',
      info: 'Code sent again',
    })
    s = signInReducer(s, {
      type: 'email_resend_ok',
      otpSessionId: 'otp-session-email-3',
      info: 'resent',
    })
    if (s.step !== 'email') throw new Error('expected email')
    expect(s.otpSessionId).toBe('otp-session-email-3')
    expect(s.resendCount).toBe(1)
    expect(s.info).toBe('resent')
  })

  it('updates phone otp and resend increments count', () => {
    let s = signInReducer(initialSignInState, {
      type: 'phone_enter',
      displayPhone: '9000000000',
      digits: '9000000000',
      delivery: 'whatsapp',
      otpSessionId: 'otp-session-1',
      info: 'first',
    })
    if (s.step !== 'phone') throw new Error('expected phone')
    s = signInReducer(s, { type: 'phone_otp', value: 'abcd' })
    expect(s.otp).toBe('abcd')
    s = signInReducer(s, {
      type: 'phone_resend_ok',
      otpSessionId: 'otp-session-2',
      delivery: 'sms',
      info: 'resent',
    })
    expect(s.otpSessionId).toBe('otp-session-2')
    expect(s.resendCount).toBe(1)
    expect(s.delivery).toBe('sms')
    expect(s.info).toBe('resent')
  })

  it('email_set_error and phone_set_error only apply on matching step', () => {
    const id = signInReducer(initialSignInState, { type: 'email_set_error', message: 'n' })
    expect(id).toEqual(initialSignInState)
    const email = signInReducer(
      { step: 'identifier', draft: 'a@b.c' },
      { type: 'identifier_submit' },
    )
    const withErr = signInReducer(email, { type: 'email_set_error', message: 'bad' })
    expect(withErr).toMatchObject({ step: 'email', error: 'bad' })
  })

  it('forgot from email and back restores email step', () => {
    let s = signInReducer(
      { step: 'identifier', draft: 'a@b.c' },
      { type: 'identifier_submit' },
    )
    if (s.step !== 'email') throw new Error('expected email')
    s = signInReducer(s, { type: 'email_go_forgot' })
    expect(s).toMatchObject({ step: 'forgot', email: 'a@b.c', fromEmailSignIn: true })
    s = signInReducer(s, { type: 'forgot_back' })
    expect(s).toMatchObject({ step: 'email', email: 'a@b.c' })
  })
})
