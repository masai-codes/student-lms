import type { ParsedIdentifier } from '@/components/features/sign-in/detectIdentifier'
import { identifierErrorMessage, parseIdentifier } from '@/components/features/sign-in/detectIdentifier'
import { emailOtpSentBody, phoneOtpFirstSendBody, phoneOtpResentBody } from '@/components/features/sign-in/signInMessages'

export type SignInState =
  | { step: 'identifier'; draft: string; error?: string }
  | {
      step: 'email'
      email: string
      authMode: 'password' | 'otp'
      password: string
      otp: string
      otpSessionId?: string
      resendCount: number
      error?: string
      info?: string
    }
  | {
      step: 'phone'
      displayPhone: string
      digits: string
      delivery: 'sms' | 'whatsapp'
      otp: string
      otpSessionId: string
      error?: string
      info?: string
      resendCount: number
    }
  | { step: 'forgot'; email: string; fromEmailSignIn: boolean; error?: string; info?: string }

export const initialSignInState: SignInState = { step: 'identifier', draft: '' }

export type IdentifierSubmitResult =
  | { ok: false; draft: string; error: string }
  | { ok: true; branch: 'email'; email: string }
  | { ok: true; branch: 'phone'; displayPhone: string; digits: string }

export function computeIdentifierSubmit(draft: string): IdentifierSubmitResult {
  const parsed: ParsedIdentifier = parseIdentifier(draft)
  if (!parsed.ok) {
    return { ok: false, draft, error: identifierErrorMessage(parsed.reason) }
  }
  if (parsed.kind === 'email') {
    return { ok: true, branch: 'email', email: parsed.value }
  }
  return {
    ok: true,
    branch: 'phone',
    displayPhone: parsed.display,
    digits: parsed.digits,
  }
}

export type SignInAction =
  | { type: 'identifier_draft'; value: string }
  | { type: 'identifier_submit' }
  | { type: 'identifier_clear_error' }
  | { type: 'identifier_set_error'; message: string }
  | { type: 'back_to_identifier' }
  | { type: 'email_set_auth_mode'; mode: 'password' | 'otp' }
  | { type: 'email_password'; value: string }
  | { type: 'email_otp'; value: string }
  | { type: 'email_clear_error' }
  | { type: 'email_set_error'; message: string }
  | { type: 'email_info'; message: string | undefined }
  | { type: 'email_otp_requested'; otpSessionId: string; info: string }
  | { type: 'email_resend_ok'; otpSessionId: string; info: string }
  | { type: 'email_use_password_mock' }
  | { type: 'email_go_forgot' }
  | {
      type: 'phone_enter'
      displayPhone: string
      digits: string
      delivery: 'sms' | 'whatsapp'
      otpSessionId: string
      info: string
    }
  | { type: 'phone_otp'; value: string }
  | { type: 'phone_resend_ok'; otpSessionId: string; delivery: 'sms' | 'whatsapp'; info: string }
  | { type: 'phone_clear_error' }
  | { type: 'phone_set_error'; message: string }
  | { type: 'phone_info'; message: string | undefined }
  | { type: 'forgot_open'; email?: string; fromEmailSignIn?: boolean }
  | { type: 'forgot_email'; value: string }
  | { type: 'forgot_set_error'; message: string }
  | { type: 'forgot_info'; message: string | undefined }
  | { type: 'forgot_clear_error' }
  | { type: 'forgot_back' }

function initialEmailState(email: string) {
  return {
    step: 'email' as const,
    email,
    authMode: 'password' as const,
    password: '',
    otp: '',
    resendCount: 0,
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
    case 'identifier_set_error':
      return state.step === 'identifier'
        ? { step: 'identifier', draft: state.draft, error: action.message }
        : state
    case 'identifier_submit': {
      if (state.step !== 'identifier') return state
      const r = computeIdentifierSubmit(state.draft)
      if (!r.ok) {
        return { step: 'identifier', draft: r.draft, error: r.error }
      }
      if (r.branch === 'email') {
        return initialEmailState(r.email)
      }
      return { step: 'identifier', draft: state.draft, error: undefined }
    }
    case 'back_to_identifier':
      if (state.step === 'identifier') return state
      if (state.step === 'forgot') {
        if (state.fromEmailSignIn) {
          return initialEmailState(state.email)
        }
        return {
          step: 'identifier',
          draft: state.email,
        }
      }
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
    case 'email_otp_requested':
      return state.step === 'email'
        ? {
            ...state,
            authMode: 'otp',
            otpSessionId: action.otpSessionId,
            resendCount: 0,
            error: undefined,
            info: action.info,
          }
        : state
    case 'email_resend_ok':
      return state.step === 'email'
        ? {
            ...state,
            otpSessionId: action.otpSessionId,
            resendCount: state.resendCount + 1,
            error: undefined,
            info: action.info,
          }
        : state
    case 'email_use_password_mock':
      return state.step === 'email'
        ? {
            ...state,
            authMode: 'password',
            otpSessionId: undefined,
            error: undefined,
            info: undefined,
          }
        : state
    case 'email_go_forgot':
      return state.step === 'email'
        ? {
            step: 'forgot',
            email: state.email,
            fromEmailSignIn: true,
            error: undefined,
            info: undefined,
          }
        : state
    case 'phone_enter':
      return {
        step: 'phone',
        displayPhone: action.displayPhone,
        digits: action.digits,
        delivery: action.delivery,
        otpSessionId: action.otpSessionId,
        otp: '',
        resendCount: 0,
        info: action.info,
      }
    case 'phone_otp':
      return state.step === 'phone' ? { ...state, otp: action.value, error: undefined } : state
    case 'phone_resend_ok':
      return state.step === 'phone'
        ? {
            ...state,
            otpSessionId: action.otpSessionId,
            delivery: action.delivery,
            resendCount: state.resendCount + 1,
            info: action.info,
          }
        : state
    case 'phone_clear_error':
      return state.step === 'phone' ? { ...state, error: undefined } : state
    case 'phone_set_error':
      return state.step === 'phone' ? { ...state, error: action.message } : state
    case 'phone_info':
      return state.step === 'phone' ? { ...state, info: action.message } : state
    case 'forgot_open':
      return {
        step: 'forgot',
        email: (action.email ?? '').trim(),
        fromEmailSignIn: action.fromEmailSignIn === true,
        error: undefined,
        info: undefined,
      }
    case 'forgot_email':
      return state.step === 'forgot'
        ? { ...state, email: action.value, error: undefined }
        : state
    case 'forgot_set_error':
      return state.step === 'forgot' ? { ...state, error: action.message } : state
    case 'forgot_info':
      return state.step === 'forgot' ? { ...state, info: action.message } : state
    case 'forgot_clear_error':
      return state.step === 'forgot' ? { ...state, error: undefined } : state
    case 'forgot_back':
      if (state.step !== 'forgot') return state
      if (state.fromEmailSignIn) {
        return initialEmailState(state.email)
      }
      return { step: 'identifier', draft: state.email }
    default:
      return state
  }
}

export function channelToDelivery(channel: 'email' | 'sms' | 'whatsapp'): 'sms' | 'whatsapp' {
  return channel === 'whatsapp' ? 'whatsapp' : 'sms'
}

export function phoneOtpInfoForChannel(
  channel: 'email' | 'sms' | 'whatsapp',
  displayPhone: string,
): string {
  const delivery = channelToDelivery(channel)
  return phoneOtpFirstSendBody(delivery, displayPhone)
}

export function phoneOtpResentInfoForChannel(
  channel: 'email' | 'sms' | 'whatsapp',
  displayPhone: string,
): string {
  const delivery = channelToDelivery(channel)
  return phoneOtpResentBody(delivery, displayPhone)
}
