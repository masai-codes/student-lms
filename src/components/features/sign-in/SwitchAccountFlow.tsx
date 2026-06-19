import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LinkedAccountsStepView } from '@/components/features/sign-in/LinkedAccountsStepView'
import { takePendingPhoneOtpSignIn } from '@/components/features/sign-in/pendingPhoneOtpSignIn'
import {
  getRedirectToSearchParam,
  redirectToResolvedUrl,
} from '@/components/features/sign-in/signInRouting'
import {
  dispatchSignInFailureEvent,
  dispatchSignInSuccessEvent,
} from '@/components/features/sign-in/signInAuthEvents'
import {
  type LinkedAccount,
  V2AuthRequestError,
  v2FetchLinkedAccounts,
  v2UseAccount,
} from '@/components/features/sign-in/v2AuthClient'
import {
  isLegacyStudentRedirectEnabled,
  redirectToOldStudentUi,
} from '@/utils/authRedirect'

function formatSwitchAccountError(err: unknown): string {
  if (err instanceof V2AuthRequestError) {
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Something went wrong. Please try again.'
}

export function SwitchAccountFlow() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Array<LinkedAccount>>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [pendingPhoneOtpSignIn] = useState(() => takePendingPhoneOtpSignIn())

  const redirectAfterAccountSelection = useCallback(
    (context: { reason: string; extra: Record<string, unknown> }) => {
      const redirectTo = getRedirectToSearchParam()
      if (redirectTo) {
        redirectToResolvedUrl(redirectTo)
        return
      }

      if (isLegacyStudentRedirectEnabled()) {
        redirectToOldStudentUi({
          source: 'SwitchAccountFlow',
          reason: context.reason,
          extra: context.extra,
        })
        return
      }

      // Legacy redirect disabled: stay in this (new) app.
      void navigate({ to: '/' })
    },
    [navigate],
  )

  useEffect(() => {
    let disposed = false

    const run = async () => {
      setLoading(true)
      setError(undefined)

      try {
        const result = await v2FetchLinkedAccounts()
        if (disposed) return

        const sortedAccounts = [...result.accounts].sort((a, b) => {
          if (a.isActive === b.isActive) return 0
          return a.isActive ? -1 : 1
        })

        setAccounts(sortedAccounts)
      } catch (err) {
        if (disposed) return

        if (err instanceof V2AuthRequestError && err.status === 401) {
          void navigate({ to: '/signin' })
          return
        }

        setError(formatSwitchAccountError(err))
      } finally {
        if (!disposed) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      disposed = true
    }
  }, [navigate])

  const onSelectAccount = useCallback(
    async (account: LinkedAccount) => {
      setBusy(true)
      setError(undefined)

      try {
        if (account.isActive) {
          if (pendingPhoneOtpSignIn) {
            dispatchSignInSuccessEvent('sso-v2', 'phone-otp', pendingPhoneOtpSignIn.response)
          }
          redirectAfterAccountSelection({
            reason: 'Continue with currently active account',
            extra: {
              method: pendingPhoneOtpSignIn ? 'phone-otp' : 'switch-account-existing-session',
              userId: account.user.id,
            },
          })
          return
        }

        const response = await v2UseAccount({
          sessionId: account.sessionId,
          rememberMe: pendingPhoneOtpSignIn?.rememberMe === true,
        })
        dispatchSignInSuccessEvent('sso-v2', 'phone-use-account', response)
        redirectAfterAccountSelection({
          reason: 'Linked account selected from switch-account page',
          extra: { method: 'phone-use-account', userId: response.user.id },
        })
      } catch (err) {
        dispatchSignInFailureEvent('sso-v2', 'phone-use-account', err)
        setError(formatSwitchAccountError(err))
      } finally {
        setBusy(false)
      }
    },
    [pendingPhoneOtpSignIn, redirectAfterAccountSelection],
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-amber-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Switch account</p>
          <h1 className="mt-2 font-poppins text-xl font-semibold text-foreground">Loading your accounts</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Please wait while we load the linked accounts for this session.
          </p>
        </div>
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-2xl border bg-muted/40" />
          <div className="h-28 animate-pulse rounded-2xl border bg-muted/40" />
        </div>
      </div>
    )
  }

  return (
    <LinkedAccountsStepView
      accounts={accounts}
      title="Choose an account"
      description={
        accounts.length > 1
          ? 'We found that you have multiple accounts. Select an account to continue.'
          : 'Select the account you want to continue with.'
      }
      error={error}
      busy={busy}
      onSelectAccount={(account) => void onSelectAccount(account)}
    />
  )
}
