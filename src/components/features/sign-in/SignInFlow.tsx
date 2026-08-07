import { useCallback, useReducer, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { VerifyOtpResult } from '@/components/features/sign-in/v2AuthClient'
import { EmailAuthStepView } from '@/components/features/sign-in/EmailAuthStepView'
import { ForgotPasswordStepView } from '@/components/features/sign-in/ForgotPasswordStepView'
import { IdentifierStepView } from '@/components/features/sign-in/IdentifierStepView'
import { PhoneOtpStepView } from '@/components/features/sign-in/PhoneOtpStepView'
import { savePendingPhoneOtpSignIn } from '@/components/features/sign-in/pendingPhoneOtpSignIn'
import {
  getRedirectToSearchParam,
  redirectToResolvedUrl,
  redirectToSwitchAccountPage,
} from '@/components/features/sign-in/signInRouting'
import { parseIdentifier } from '@/components/features/sign-in/detectIdentifier'
import { getAuthBranding } from '@/utils/authBranding'
import {
  dispatchSignInFailureEvent,
  dispatchSignInSuccessEvent,
} from '@/components/features/sign-in/signInAuthEvents'
import {
  channelToDelivery,
  computeIdentifierSubmit,
  initialSignInState,
  phoneOtpInfoForChannel,
  phoneOtpResentInfoForChannel,
  signInReducer,
} from '@/components/features/sign-in/signInReducer'
import {
  emailOtpResentBody,
  emailOtpSentBody,
} from '@/components/features/sign-in/signInMessages'
import { getSignInSubmitError } from '@/components/features/sign-in/signInSubmit'
import { invalidateMeQuery } from '@/query/me/meCache'
import {
  V2AuthRequestError,
  v2FetchLinkedAccounts,
  v2ForgotPassword,
  v2LoginWithPassword,
  v2RequestOtp,
  v2VerifyOtp,
} from '@/components/features/sign-in/v2AuthClient'
import {
  isLegacyStudentRedirectEnabled,
  redirectToOldStudentUi,
} from '@/utils/authRedirect'

const FORGOT_GENERIC_OK =
  'If an account exists for that email, we have sent a reset link. Check your inbox and spam folder.'

function formatAuthError(err: unknown): string {
  if (err instanceof V2AuthRequestError) {
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Something went wrong. Please try again.'
}

export function SignInFlow() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(signInReducer, initialSignInState)
  const [identifierBusy, setIdentifierBusy] = useState(false)
  const [emailOtpBusy, setEmailOtpBusy] = useState(false)
  const [submitBusy, setSubmitBusy] = useState(false)
  const [phoneResendBusy, setPhoneResendBusy] = useState(false)
  const [forgotBusy, setForgotBusy] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const completePrimarySignIn = useCallback(() => {
    // A session was just created: drop whoever the cached `me` was (usually the
    // `null` this very page cached) so the destination resolves the new user.
    invalidateMeQuery(queryClient)
    const redirectTo = getRedirectToSearchParam()
    if (redirectTo) {
      redirectToResolvedUrl(redirectTo)
      return
    }
    if (isLegacyStudentRedirectEnabled()) {
      redirectToOldStudentUi({
        source: 'SignInFlow',
        reason: 'Email sign-in completed',
      })
      return
    }
    // Legacy redirect disabled: stay in this (new) app.
    void navigate({ to: '/' })
  }, [navigate, queryClient])

  const completePhoneRedirect = useCallback(
    (method: 'phone-otp' | 'phone-use-account', response: VerifyOtpResult) => {
      dispatchSignInSuccessEvent('sso-v2', method, response)
      invalidateMeQuery(queryClient)
      const redirectTo = getRedirectToSearchParam()
      if (redirectTo) {
        redirectToResolvedUrl(redirectTo)
        return
      }
      if (isLegacyStudentRedirectEnabled()) {
        redirectToOldStudentUi({
          source: 'SignInFlow',
          reason: 'Phone sign-in completed',
          extra: { method, userId: response.user.id },
        })
        return
      }
      // Legacy redirect disabled: stay in this (new) app.
      void navigate({ to: '/' })
    },
    [navigate, queryClient],
  )

  const onIdentifierSubmit = useCallback(async () => {
    if (state.step !== 'identifier') return
    const r = computeIdentifierSubmit(state.draft)
    if (!r.ok) {
      dispatch({ type: 'identifier_submit' })
      return
    }
    if (r.branch === 'email') {
      dispatch({ type: 'identifier_submit' })
      return
    }
    setIdentifierBusy(true)
    dispatch({ type: 'identifier_clear_error' })
    try {
      const { channel, otpSessionId } = await v2RequestOtp({
        identifier: r.digits,
        isResend: false,
      })
      const delivery = channelToDelivery(channel)
      dispatch({
        type: 'phone_enter',
        displayPhone: r.displayPhone,
        digits: r.digits,
        delivery,
        otpSessionId,
        info: phoneOtpInfoForChannel(channel, r.displayPhone),
      })
    } catch (err) {
      dispatch({ type: 'identifier_set_error', message: formatAuthError(err) })
    } finally {
      setIdentifierBusy(false)
    }
  }, [state])

  const onEmailRequestOtp = useCallback(async () => {
    if (state.step !== 'email') return
    setEmailOtpBusy(true)
    dispatch({ type: 'email_clear_error' })
    try {
      const { otpSessionId } = await v2RequestOtp({
        identifier: state.email,
        isResend: false,
      })
      dispatch({
        type: 'email_otp_requested',
        otpSessionId,
        info: emailOtpSentBody(state.email),
      })
    } catch (err) {
      dispatch({ type: 'email_set_error', message: formatAuthError(err) })
    } finally {
      setEmailOtpBusy(false)
    }
  }, [state])

  const onEmailResend = useCallback(async () => {
    if (state.step !== 'email' || state.authMode !== 'otp') return
    setEmailOtpBusy(true)
    dispatch({ type: 'email_clear_error' })
    try {
      const { otpSessionId } = await v2RequestOtp({
        identifier: state.email,
        isResend: true,
      })
      dispatch({
        type: 'email_resend_ok',
        otpSessionId,
        info: emailOtpResentBody(state.email),
      })
    } catch (err) {
      dispatch({ type: 'email_set_error', message: formatAuthError(err) })
    } finally {
      setEmailOtpBusy(false)
    }
  }, [state])

  const onPhoneResend = useCallback(async () => {
    if (state.step !== 'phone') return
    setPhoneResendBusy(true)
    dispatch({ type: 'phone_clear_error' })
    try {
      const { channel, otpSessionId } = await v2RequestOtp({
        identifier: state.digits,
        isResend: true,
      })
      const delivery = channelToDelivery(channel)
      dispatch({
        type: 'phone_resend_ok',
        otpSessionId,
        delivery,
        info: phoneOtpResentInfoForChannel(channel, state.displayPhone),
      })
    } catch (err) {
      dispatch({ type: 'phone_set_error', message: formatAuthError(err) })
    } finally {
      setPhoneResendBusy(false)
    }
  }, [state])

  const onSubmitFinal = useCallback(async () => {
    const err = getSignInSubmitError(state)
    if (state.step === 'email') {
      if (err) {
        dispatch({ type: 'email_set_error', message: err })
        return
      }
      setSubmitBusy(true)
      dispatch({ type: 'email_clear_error' })
      try {
        if (state.authMode === 'password') {
          const response = await v2LoginWithPassword({
            email: state.email,
            password: state.password,
            rememberMe,
          })
          dispatchSignInSuccessEvent('sso-v2', 'email-password', response)
        } else {
          const response = await v2VerifyOtp({
            otpSessionId: state.otpSessionId!,
            otp: state.otp.trim(),
            rememberMe,
          })
          dispatchSignInSuccessEvent('sso-v2', 'email-otp', response)
        }
        completePrimarySignIn()
      } catch (e) {
        dispatchSignInFailureEvent(
          'sso-v2',
          state.authMode === 'password' ? 'email-password' : 'email-otp',
          e,
        )
        dispatch({ type: 'email_set_error', message: formatAuthError(e) })
      } finally {
        setSubmitBusy(false)
      }
      return
    }
    if (state.step === 'phone') {
      if (err) {
        dispatch({ type: 'phone_set_error', message: err })
        return
      }
      setSubmitBusy(true)
      dispatch({ type: 'phone_clear_error' })
      try {
        const response = await v2VerifyOtp({
          otpSessionId: state.otpSessionId,
          otp: state.otp.trim(),
          rememberMe,
        })
        const linkedAccountsResult = await v2FetchLinkedAccounts()
        if (linkedAccountsResult.accounts.length >= 2) {
          savePendingPhoneOtpSignIn(response, rememberMe)
          redirectToSwitchAccountPage(getRedirectToSearchParam())
          return
        }
        completePhoneRedirect('phone-otp', response)
      } catch (e) {
        dispatchSignInFailureEvent('sso-v2', 'phone-otp', e)
        dispatch({ type: 'phone_set_error', message: formatAuthError(e) })
      } finally {
        setSubmitBusy(false)
      }
    }
  }, [completePhoneRedirect, completePrimarySignIn, rememberMe, state])

  const onForgotSubmit = useCallback(async () => {
    if (state.step !== 'forgot') return
    const email = state.email.trim()
    if (!email) {
      dispatch({
        type: 'forgot_set_error',
        message: 'Enter your email address.',
      })
      return
    }
    setForgotBusy(true)
    dispatch({ type: 'forgot_clear_error' })
    dispatch({ type: 'forgot_info', message: undefined })
    try {
      await v2ForgotPassword({ email })
      dispatch({ type: 'forgot_info', message: FORGOT_GENERIC_OK })
    } catch (err) {
      dispatch({ type: 'forgot_set_error', message: formatAuthError(err) })
    } finally {
      setForgotBusy(false)
    }
  }, [state])

  const openForgotFromIdentifier = useCallback(() => {
    if (state.step !== 'identifier') return
    const parsed = parseIdentifier(state.draft)
    const email = parsed.ok && parsed.kind === 'email' ? parsed.value : ''
    dispatch({ type: 'forgot_open', email, fromEmailSignIn: false })
  }, [state])

  return (
    <div className="space-y-6">
      {state.step !== 'identifier' ? (
        <div className="text-center">
          <h1 className="font-poppins text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {getAuthBranding().signInHeading}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {getAuthBranding().accountPrompt}
          </p>
        </div>
      ) : null}

      {state.step === 'identifier' ? (
        <IdentifierStepView
          draft={state.draft}
          error={state.error}
          nextDisabled={identifierBusy}
          onDraftChange={(value) =>
            dispatch({ type: 'identifier_draft', value })
          }
          onSubmit={onIdentifierSubmit}
          onForgotPassword={openForgotFromIdentifier}
        />
      ) : null}

      {state.step === 'email' ? (
        <EmailAuthStepView
          email={state.email}
          authMode={state.authMode}
          password={state.password}
          otp={state.otp}
          resendCount={state.resendCount}
          rememberMe={rememberMe}
          error={state.error}
          info={state.info}
          onBack={() => dispatch({ type: 'back_to_identifier' })}
          onPasswordChange={(value) =>
            dispatch({ type: 'email_password', value })
          }
          onOtpChange={(value) => dispatch({ type: 'email_otp', value })}
          onRememberMeChange={setRememberMe}
          onUseOtp={onEmailRequestOtp}
          onResend={onEmailResend}
          onUsePassword={() => dispatch({ type: 'email_use_password_mock' })}
          onForgotPassword={() => dispatch({ type: 'email_go_forgot' })}
          onSubmit={onSubmitFinal}
          submitDisabled={submitBusy}
          sendOtpDisabled={emailOtpBusy}
          resendBusy={emailOtpBusy}
        />
      ) : null}

      {state.step === 'phone' ? (
        <PhoneOtpStepView
          displayPhone={state.displayPhone}
          delivery={state.delivery}
          resendCount={state.resendCount}
          otp={state.otp}
          rememberMe={rememberMe}
          error={state.error}
          info={state.info}
          onBack={() => dispatch({ type: 'back_to_identifier' })}
          onOtpChange={(value) => dispatch({ type: 'phone_otp', value })}
          onRememberMeChange={setRememberMe}
          onResend={onPhoneResend}
          onSubmit={onSubmitFinal}
          resendBusy={phoneResendBusy}
          submitDisabled={submitBusy}
        />
      ) : null}

      {state.step === 'forgot' ? (
        <ForgotPasswordStepView
          email={state.email}
          error={state.error}
          info={state.info}
          busy={forgotBusy}
          onBack={() => dispatch({ type: 'forgot_back' })}
          onEmailChange={(value) => dispatch({ type: 'forgot_email', value })}
          onSubmit={onForgotSubmit}
        />
      ) : null}

      {(state.step === 'email' || state.step === 'phone') && submitBusy ? (
        <p
          className="text-center text-sm text-muted-foreground"
          aria-live="polite"
        >
          Signing you in…
        </p>
      ) : null}
    </div>
  )
}
