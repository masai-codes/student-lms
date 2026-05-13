import type { LinkedAccount } from '@/components/features/sign-in/v2AuthClient'
import { SignInNotice } from '@/components/features/sign-in/SignInNotice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  accounts: Array<LinkedAccount>
  title?: string
  description?: string
  error?: string
  busy?: boolean
  onSelectAccount: (account: LinkedAccount) => void
}

export function LinkedAccountsStepView({
  accounts,
  title = 'Select an account',
  description = 'We found that you have multiple accounts. Select an account to continue.',
  error,
  busy = false,
  onSelectAccount,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-amber-50/70 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Phone verified</p>
        <h2 className="mt-2 font-poppins text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <SignInNotice variant="sms">
        <p>Your sign-in is already verified. Choose the account you want to continue with.</p>
      </SignInNotice>

      <div className="space-y-3">
        {accounts.map((account) => (
          <Card
            key={account.sessionId}
            className={
              account.isActive
                ? 'overflow-hidden border-emerald-300/80 bg-gradient-to-r from-emerald-50/90 via-background to-teal-50/70 py-0 shadow-sm'
                : 'overflow-hidden border-sky-200/80 bg-gradient-to-r from-sky-50/80 via-background to-violet-50/70 py-0 shadow-sm'
            }
          >
            <CardHeader className="gap-2 border-b border-black/5 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="font-poppins text-base text-foreground">
                    {account.user.name || account.user.email}
                  </CardTitle>
                  <CardDescription className="mt-1 break-all text-sm">{account.user.email}</CardDescription>
                </div>
                <span
                  className={
                    account.isActive
                      ? 'inline-flex shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700'
                      : 'inline-flex shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700'
                  }
                >
                  {account.isActive ? 'Active now' : 'Switch available'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 py-4 sm:px-5">
              {account.user.mobile ? (
                <p className="text-xs text-muted-foreground">{account.user.mobile}</p>
              ) : null}
              <Button
                type="button"
                className="w-full font-poppins shadow-sm"
                variant={account.isActive ? 'default' : 'outline'}
                onClick={() => onSelectAccount(account)}
                disabled={busy}
              >
                {busy
                  ? 'Please wait…'
                  : account.isActive
                    ? 'Continue with this account'
                    : 'Switch to this account'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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
