import type { ParsedIdentifier } from '@/components/features/sign-in/detectIdentifier'
import { identifierErrorMessage, parseIdentifier } from '@/components/features/sign-in/detectIdentifier'
import { randomPhoneDelivery } from '@/components/features/sign-in/phoneOtpDelivery'
import { logSignInApiPayload } from '@/components/features/sign-in/signInApiConsole'
import { emailOtpSentBody, phoneOtpFirstSendBody, phoneOtpResentBody } from '@/components/features/sign-in/signInMessages'

export type SignInState =
  | { step: 'identifier'; draft: string; error?: string }
  | {
      step: 'email'
      email: string
      authMode: 'password' | 'otp'
      password: string
      otp: string
      error?: string
      info?: string
    }
  | {
      step: 'phone'
      displayPhone: string
      digits: string
      delivery: 'sms' | 'whatsapp'
      otp: string
      error?: string
      info?: string
      resendCount: number
    }

export const initialSignInState: SignInState = { step: 'identifier', draft: '' }

export type SignInAction =
  | { type: 'identifier_draft'; value: string }
  | { type: 'identifier_submit' }
  | { type: 'identifier_clear_error' }
  | { type: 'back_to_identifier' }
  | { type: 'email_set_auth_mode'; mode: 'password' | 'otp' }
  | { type: 'email_password'; value: string }
  | { type: 'email_otp'; value: string }
  | { type: 'email_clear_error' }
  | { type: 'email_set_error'; message: string }
  | { type: 'email_info'; message: string | undefined }
  | { type: 'email_use_otp_mock' }
  | { type: 'email_use_password_mock' }
  | { type: 'phone_otp'; value: string }
  | { type: 'phone_resend_mock' }
  | { type: 'phone_clear_error' }
  | { type: 'phone_set_error'; message: string }
  | { type: 'phone_info'; message: string | undefined }

function transitionFromIdentifier(draft: string): SignInState {
  const parsed: ParsedIdentifier = parseIdentifier(draft)
  if (!parsed.ok) {
    return {
      step: 'identifier',
      draft,
      error: identifierErrorMessage(parsed.reason),
    }
  }
  if (parsed.kind === 'email') {
    return {
      step: 'email',
      email: parsed.value,
      authMode: 'password',
      password: '',
      otp: '',
    }
  }
  const delivery = randomPhoneDelivery()
  logSignInApiPayload('POST /auth/send-otp (phone — first send)', {
    identifierType: 'phone',
    phone: parsed.digits,
    channel: delivery,
    resend: false,
    resendAttempt: 0,
  })
  return {
    step: 'phone',
    displayPhone: parsed.display,
    digits: parsed.digits,
    delivery,
    otp: '',
    resendCount: 0,
    info: phoneOtpFirstSendBody(delivery, parsed.display),
  }
}

export function signInReducer(state: SignInState, action: SignInAction): SignInState {
  switch (action.type) {
    case 'identifier_draft':
      return state.step === 'identifier'
        ? { step: 'identifier', draft: action.value, error: undefined }
        : state
    case 'identifier_clear_error':
      return state.step === 'identifier' ? { ...state, error: undefined } : state
    case 'identifier_submit':
      return state.step === 'identifier' ? transitionFromIdentifier(state.draft) : state
    case 'back_to_identifier':
      return {
        step: 'identifier',
        draft:
          state.step === 'email'
            ? state.email
            : state.step === 'phone'
              ? state.displayPhone
              : state.draft,
      }
    case 'email_set_auth_mode':
      return state.step === 'email'
        ? { ...state, authMode: action.mode, error: undefined }
        : state
    case 'email_password':
      return state.step === 'email' ? { ...state, password: action.value, error: undefined } : state
    case 'email_otp':
      return state.step === 'email' ? { ...state, otp: action.value, error: undefined } : state
    case 'email_clear_error':
      return state.step === 'email' ? { ...state, error: undefined } : state
    case 'email_set_error':
      return state.step === 'email' ? { ...state, error: action.message } : state
    case 'email_info':
      return state.step === 'email' ? { ...state, info: action.message } : state
    case 'email_use_otp_mock':
      if (state.step === 'email') {
        logSignInApiPayload('POST /auth/send-otp (email)', {
          identifierType: 'email',
          email: state.email,
        })
        return {
          ...state,
          authMode: 'otp',
          error: undefined,
          info: emailOtpSentBody(state.email),
        }
      }
      return state
    case 'email_use_password_mock':
      return state.step === 'email'
        ? { ...state, authMode: 'password', error: undefined, info: undefined }
        : state
    case 'phone_otp':
      return state.step === 'phone' ? { ...state, otp: action.value, error: undefined } : state
    case 'phone_resend_mock':
      if (state.step === 'phone') {
        const nextAttempt = state.resendCount + 1
        logSignInApiPayload('POST /auth/send-otp (phone — resend)', {
          identifierType: 'phone',
          phone: state.digits,
          channel: state.delivery,
          resend: true,
          resendAttempt: nextAttempt,
        })
        return {
          ...state,
          resendCount: nextAttempt,
            info: phoneOtpResentBody(state.delivery, state.displayPhone),
        }
      }
      return state
    case 'phone_clear_error':
      return state.step === 'phone' ? { ...state, error: undefined } : state
    case 'phone_set_error':
      return state.step === 'phone' ? { ...state, error: action.message } : state
    case 'phone_info':
      return state.step === 'phone' ? { ...state, info: action.message } : state
    default:
      return state
  }
}
