import { useCallback, useReducer, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { LinkedAccount, VerifyOtpResult } from '@/components/features/sign-in/v2AuthClient'
import { EmailAuthStepView } from '@/components/features/sign-in/EmailAuthStepView'
import { ForgotPasswordStepView } from '@/components/features/sign-in/ForgotPasswordStepView'
import { IdentifierStepView } from '@/components/features/sign-in/IdentifierStepView'
import { LinkedAccountsStepView } from '@/components/features/sign-in/LinkedAccountsStepView'
import { PhoneOtpStepView } from '@/components/features/sign-in/PhoneOtpStepView'
import { parseIdentifier } from '@/components/features/sign-in/detectIdentifier'
import {
  dispatchSignInFailureEvent,
  dispatchSignInSuccessEvent,
} from '@/components/features/sign-in/signInAuthEvents'
import {
  channelToDelivery,
  computeIdentifierSubmit,
  initialSignInState,
  phoneOtpInfoForChannel,
  signInReducer,
} from '@/components/features/sign-in/signInReducer'
import { emailOtpSentBody, phoneOtpResentBody } from '@/components/features/sign-in/signInMessages'
import { getSignInSubmitError } from '@/components/features/sign-in/signInSubmit'
import {
  V2AuthRequestError,
  v2FetchLinkedAccounts,
  v2ForgotPassword,
  v2LoginWithPassword,
  v2RequestOtp,
  v2UseAccount,
  v2VerifyOtp,
} from '@/components/features/sign-in/v2AuthClient'
import { redirectToOldStudentUi } from '@/utils/authRedirect'

const FORGOT_GENERIC_OK =
  'If an account exists for that email, we have sent a reset link. Check your inbox and spam folder.'

type PendingPhoneAccountSelection = {
  verifyResponse: VerifyOtpResult
  accounts: Array<LinkedAccount>
}

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
  const [state, dispatch] = useReducer(signInReducer, initialSignInState)
  const [identifierBusy, setIdentifierBusy] = useState(false)
  const [emailOtpBusy, setEmailOtpBusy] = useState(false)
  const [submitBusy, setSubmitBusy] = useState(false)
  const [phoneResendBusy, setPhoneResendBusy] = useState(false)
  const [forgotBusy, setForgotBusy] = useState(false)
  const [pendingPhoneAccountSelection, setPendingPhoneAccountSelection] =
    useState<PendingPhoneAccountSelection | null>(null)
  const [accountSelectionBusy, setAccountSelectionBusy] = useState(false)
  const [accountSelectionError, setAccountSelectionError] = useState<string | undefined>()

  const goHomeAfterSignIn = useCallback(() => {
    void navigate({ to: '/' })
  }, [navigate])

  const completePhoneRedirect = useCallback(
    (method: 'phone-otp' | 'phone-use-account', response: VerifyOtpResult) => {
      dispatchSignInSuccessEvent('sso-v2', method, response)
      redirectToOldStudentUi({
        source: 'SignInFlow',
        reason: 'Phone sign-in completed',
        extra: { method, userId: response.user.id },
      })
    },
    [],
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
      const { channel } = await v2RequestOtp({ identifier: r.digits, isResend: false })
      const delivery = channelToDelivery(channel)
      dispatch({
        type: 'phone_enter',
        displayPhone: r.displayPhone,
        digits: r.digits,
        delivery,
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
      await v2RequestOtp({ identifier: state.email, isResend: false })
      dispatch({ type: 'email_otp_requested', info: emailOtpSentBody(state.email) })
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
      await v2RequestOtp({ identifier: state.digits, isResend: true })
      dispatch({
        type: 'phone_resend_ok',
        info: phoneOtpResentBody(state.delivery, state.displayPhone),
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
          })
          dispatchSignInSuccessEvent('sso-v2', 'email-password', response)
        } else {
          const response = await v2VerifyOtp({
            identifier: state.email,
            otp: state.otp.trim(),
          })
          dispatchSignInSuccessEvent('sso-v2', 'email-otp', response)
        }
        goHomeAfterSignIn()
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
          identifier: state.digits,
          otp: state.otp.trim(),
        })
        const linkedAccountsResult = await v2FetchLinkedAccounts()
        if (linkedAccountsResult.accounts.length >= 2) {
          setPendingPhoneAccountSelection({
            verifyResponse: response,
            accounts: linkedAccountsResult.accounts,
          })
          setAccountSelectionError(undefined)
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
  }, [completePhoneRedirect, state])

  const onForgotSubmit = useCallback(async () => {
    if (state.step !== 'forgot') return
    const email = state.email.trim()
    if (!email) {
      dispatch({ type: 'forgot_set_error', message: 'Enter your email address.' })
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

  const onSelectLinkedPhoneAccount = useCallback(
    async (account: LinkedAccount) => {
      if (!pendingPhoneAccountSelection) return

      setAccountSelectionBusy(true)
      setAccountSelectionError(undefined)

      try {
        if (account.isActive) {
          completePhoneRedirect('phone-otp', pendingPhoneAccountSelection.verifyResponse)
          return
        }

        const response = await v2UseAccount({ sessionId: account.sessionId })
        dispatchSignInSuccessEvent('sso-v2', 'phone-use-account', response)
        redirectToOldStudentUi({
          source: 'SignInFlow',
          reason: 'Linked account switched after phone sign-in',
          extra: { method: 'phone-use-account', userId: response.user.id },
        })
      } catch (err) {
        dispatchSignInFailureEvent('sso-v2', 'phone-use-account', err)
        setAccountSelectionError(formatAuthError(err))
      } finally {
        setAccountSelectionBusy(false)
      }
    },
    [completePhoneRedirect, pendingPhoneAccountSelection],
  )

  const onBackFromLinkedPhoneAccounts = useCallback(() => {
    setPendingPhoneAccountSelection(null)
    setAccountSelectionError(undefined)
  }, [])

  const openForgotFromIdentifier = useCallback(() => {
    if (state.step !== 'identifier') return
    const parsed = parseIdentifier(state.draft)
    const email = parsed.ok && parsed.kind === 'email' ? parsed.value : ''
    dispatch({ type: 'forgot_open', email, fromEmailSignIn: false })
  }, [state])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-poppins text-2xl font-bold tracking-tight text-foreground md:text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the email or 10-digit mobile number linked to your Masai account.
        </p>
      </div>

      {state.step === 'identifier' ? (
        <IdentifierStepView
          draft={state.draft}
          error={state.error}
          nextDisabled={identifierBusy}
          onDraftChange={(value) => dispatch({ type: 'identifier_draft', value })}
          onSubmit={onIdentifierSubmit}
          onForgotPassword={openForgotFromIdentifier}
        />
      ) : null}

      {state.step === 'identifier' && identifierBusy ? (
        <p className="text-center text-sm text-muted-foreground" aria-live="polite">
          Sending sign-in code…
        </p>
      ) : null}

      {state.step === 'email' ? (
        <EmailAuthStepView
          email={state.email}
          authMode={state.authMode}
          password={state.password}
          otp={state.otp}
          error={state.error}
          info={state.info}
          onBack={() => dispatch({ type: 'back_to_identifier' })}
          onPasswordChange={(value) => dispatch({ type: 'email_password', value })}
          onOtpChange={(value) => dispatch({ type: 'email_otp', value })}
          onUseOtp={onEmailRequestOtp}
          onUsePassword={() => dispatch({ type: 'email_use_password_mock' })}
          onForgotPassword={() => dispatch({ type: 'email_go_forgot' })}
          onSubmit={onSubmitFinal}
          submitDisabled={submitBusy}
          sendOtpDisabled={emailOtpBusy}
        />
      ) : null}

      {state.step === 'phone' && pendingPhoneAccountSelection ? (
        <LinkedAccountsStepView
          accounts={pendingPhoneAccountSelection.accounts}
          error={accountSelectionError}
          busy={accountSelectionBusy}
          onBack={onBackFromLinkedPhoneAccounts}
          onSelectAccount={(account) => void onSelectLinkedPhoneAccount(account)}
        />
      ) : null}

      {state.step === 'phone' && !pendingPhoneAccountSelection ? (
        <PhoneOtpStepView
          displayPhone={state.displayPhone}
          delivery={state.delivery}
          resendCount={state.resendCount}
          otp={state.otp}
          error={state.error}
          info={state.info}
          onBack={() => dispatch({ type: 'back_to_identifier' })}
          onOtpChange={(value) => dispatch({ type: 'phone_otp', value })}
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

      {(state.step === 'email' || (state.step === 'phone' && !pendingPhoneAccountSelection)) && submitBusy ? (
        <p className="text-center text-sm text-muted-foreground" aria-live="polite">
          Signing you in…
        </p>
      ) : null}
    </div>
  )
}
