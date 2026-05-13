import { ArrowLeft } from '@phosphor-icons/react'
import type { LinkedAccount } from '@/components/features/sign-in/v2AuthClient'
import { SignInNotice } from '@/components/features/sign-in/SignInNotice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  accounts: Array<LinkedAccount>
  error?: string
  busy?: boolean
  onBack: () => void
  onSelectAccount: (account: LinkedAccount) => void
}

export function LinkedAccountsStepView({
  accounts,
  error,
  busy = false,
  onBack,
  onSelectAccount,
}: Props) {
  const activeAccount = accounts.find((account) => account.isActive)
  const switchableAccounts = accounts.filter((account) => !account.isActive)

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto gap-1.5 px-0 font-poppins text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Back
      </Button>

      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-amber-50/70 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Phone verified</p>
        <h2 className="mt-2 font-poppins text-xl font-semibold text-foreground">Choose an account</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          This mobile number is linked to multiple accounts. Pick the one you want to continue with in
          the old LMS.
        </p>
      </div>

      <SignInNotice variant="sms">
        <p>Only account selection is needed now. Your sign-in code has already been verified.</p>
      </SignInNotice>

      {activeAccount ? (
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 py-0 shadow-md">
          <CardHeader className="gap-3 border-b border-primary/15 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="font-poppins text-base text-foreground">Current session</CardTitle>
                <CardDescription className="mt-1">
                  This account is already active. You can continue with it directly.
                </CardDescription>
              </div>
              <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                Active now
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            <div className="space-y-1">
              <p className="font-poppins text-base font-semibold text-foreground">
                {activeAccount.user.name || activeAccount.user.email}
              </p>
              <p className="break-all text-sm text-muted-foreground">{activeAccount.user.email}</p>
              {activeAccount.user.mobile ? (
                <p className="text-xs text-muted-foreground">{activeAccount.user.mobile}</p>
              ) : null}
            </div>
            <Button
              type="button"
              className="w-full font-poppins shadow-sm"
              disabled={busy}
              onClick={() => onSelectAccount(activeAccount)}
            >
              {busy ? 'Please wait…' : 'Continue with current session'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {switchableAccounts.length > 0 ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Other linked accounts
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Switch only if you want to open a different learner profile.
            </p>
          </div>

          {switchableAccounts.map((account, index) => (
            <Card
              key={account.sessionId}
              className="overflow-hidden border-sky-200/80 bg-gradient-to-r from-sky-50/80 via-background to-violet-50/70 py-0 shadow-sm"
            >
              <CardContent className="space-y-4 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-poppins text-base font-semibold text-foreground">
                      {account.user.name || account.user.email}
                    </p>
                    <p className="break-all text-sm text-muted-foreground">{account.user.email}</p>
                    {account.user.mobile ? (
                      <p className="text-xs text-muted-foreground">{account.user.mobile}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    Switch available
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-white/70 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Account {index + 1} of {switchableAccounts.length}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-sky-200 bg-white font-poppins text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                    disabled={busy}
                    onClick={() => onSelectAccount(account)}
                  >
                    {busy ? 'Switching…' : 'Switch to this account'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
