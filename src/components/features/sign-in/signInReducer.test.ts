import { afterEach, describe, expect, it, vi } from 'vitest'
import * as phoneOtpDelivery from '@/components/features/sign-in/phoneOtpDelivery'
import {
  initialSignInState,
  signInReducer,
} from '@/components/features/sign-in/signInReducer'

describe('signInReducer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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
    })
  })

  it('identifier_submit transitions to phone with SMS delivery when mock picks SMS', () => {
    vi.spyOn(phoneOtpDelivery, 'randomPhoneDelivery').mockReturnValue('sms')
    const s = signInReducer({ step: 'identifier', draft: '9988776655' }, { type: 'identifier_submit' })
    expect(s).toMatchObject({
      step: 'phone',
      displayPhone: '9988776655',
      digits: '9988776655',
      delivery: 'sms',
      otp: '',
      resendCount: 0,
      info: expect.stringMatching(/6-digit|text message|9988776655/i),
    })
  })

  it('identifier_submit transitions to phone with WhatsApp when mock picks WhatsApp', () => {
    vi.spyOn(phoneOtpDelivery, 'randomPhoneDelivery').mockReturnValue('whatsapp')
    const s = signInReducer({ step: 'identifier', draft: '9988776655' }, { type: 'identifier_submit' })
    expect(s).toMatchObject({
      step: 'phone',
      delivery: 'whatsapp',
      info: expect.stringMatching(/WhatsApp|6-digit/i),
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
    vi.spyOn(phoneOtpDelivery, 'randomPhoneDelivery').mockReturnValue('sms')
    const phone = signInReducer({ step: 'identifier', draft: '9000000000' }, { type: 'identifier_submit' })
    if (phone.step !== 'phone') throw new Error('expected phone')
    expect(signInReducer(phone, { type: 'back_to_identifier' })).toEqual({
      step: 'identifier',
      draft: '9000000000',
    })
  })

  it('toggles email auth mode mock actions', () => {
    let s = signInReducer(
      { step: 'identifier', draft: 'user@example.com' },
      { type: 'identifier_submit' },
    )
    if (s.step !== 'email') throw new Error('expected email')
    s = signInReducer(s, { type: 'email_use_otp_mock' })
    expect(s.authMode).toBe('otp')
    expect(s.info).toMatch(/inbox|sent|6-digit|user@example\.com/i)
    s = signInReducer(s, { type: 'email_use_password_mock' })
    expect(s.authMode).toBe('password')
    expect(s.info).toBeUndefined()
  })

  it('updates phone otp and resend mock keeps server-chosen delivery', () => {
    vi.spyOn(phoneOtpDelivery, 'randomPhoneDelivery').mockReturnValue('whatsapp')
    let s = signInReducer({ step: 'identifier', draft: '9000000000' }, { type: 'identifier_submit' })
    if (s.step !== 'phone') throw new Error('expected phone')
    expect(s.delivery).toBe('whatsapp')
    expect(s.info).toMatch(/WhatsApp/)
    s = signInReducer(s, { type: 'phone_otp', value: '123456' })
    expect(s.otp).toBe('123456')
    s = signInReducer(s, { type: 'phone_resend_mock' })
    expect(s.resendCount).toBe(1)
    expect(s.delivery).toBe('whatsapp')
    expect(s.info).toMatch(/WhatsApp|Another/i)
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
})
