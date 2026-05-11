import { useCallback, useReducer } from 'react'
import type { SignInState } from '@/components/features/sign-in/signInReducer'
import { EmailAuthStepView } from '@/components/features/sign-in/EmailAuthStepView'
import { IdentifierStepView } from '@/components/features/sign-in/IdentifierStepView'
import { PhoneOtpStepView } from '@/components/features/sign-in/PhoneOtpStepView'
import { logSignInApiPayload } from '@/components/features/sign-in/signInApiConsole'
import { initialSignInState, signInReducer } from '@/components/features/sign-in/signInReducer'
import { getSignInSubmitError } from '@/components/features/sign-in/signInSubmit'

function mockSignInSuccessSummary(state: SignInState): string {
  if (state.step === 'identifier') {
    return ''
  }
  if (state.step === 'email') {
    return state.authMode === 'password'
      ? `Signed in with email + password: ${state.email}`
      : `Signed in with email + one-time code: ${state.email}`
  }
  return `Signed in with phone + ${state.delivery === 'sms' ? 'SMS' : 'WhatsApp'} code: ${state.displayPhone}`
}

export function SignInFlow() {
  const [state, dispatch] = useReducer(signInReducer, initialSignInState)

  const onSubmitFinal = useCallback(() => {
    const err = getSignInSubmitError(state)
    if (state.step === 'email') {
      if (err) {
        dispatch({ type: 'email_set_error', message: err })
        return
      }
      if (state.authMode === 'password') {
        logSignInApiPayload('POST /auth/login (email + password)', {
          identifierType: 'email',
          email: state.email,
          password: state.password,
        })
      } else {
        logSignInApiPayload('POST /auth/verify-otp (email)', {
          identifierType: 'email',
          email: state.email,
          code: state.otp.trim(),
        })
      }
      window.alert(`Success (not yet connected to server): ${mockSignInSuccessSummary(state)}`)
      return
    }
    if (state.step === 'phone') {
      if (err) {
        dispatch({ type: 'phone_set_error', message: err })
        return
      }
      logSignInApiPayload('POST /auth/verify-otp (phone)', {
        identifierType: 'phone',
        phone: state.digits,
        channel: state.delivery,
        code: state.otp.trim(),
      })
      window.alert(`Success (not yet connected to server): ${mockSignInSuccessSummary(state)}`)
    }
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
          onDraftChange={(value) => dispatch({ type: 'identifier_draft', value })}
          onSubmit={() => dispatch({ type: 'identifier_submit' })}
        />
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
          onUseOtp={() => dispatch({ type: 'email_use_otp_mock' })}
          onUsePassword={() => dispatch({ type: 'email_use_password_mock' })}
          onSubmit={onSubmitFinal}
        />
      ) : null}

      {state.step === 'phone' ? (
        <PhoneOtpStepView
          displayPhone={state.displayPhone}
          delivery={state.delivery}
          resendCount={state.resendCount}
          otp={state.otp}
          error={state.error}
          info={state.info}
          onBack={() => dispatch({ type: 'back_to_identifier' })}
          onOtpChange={(value) => dispatch({ type: 'phone_otp', value })}
          onResend={() => dispatch({ type: 'phone_resend_mock' })}
          onSubmit={onSubmitFinal}
        />
      ) : null}
    </div>
  )
}
