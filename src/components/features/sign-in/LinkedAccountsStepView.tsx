import type { LinkedAccount } from '@/components/features/sign-in/v2AuthClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  accounts: Array<LinkedAccount>
  title?: string
  description?: string
  error?: string
  busy?: boolean
  onSelectAccount: (account: LinkedAccount) => void
  /** Shown as a secondary action below the account list when provided. */
  onAddAccount?: () => void
}

export function LinkedAccountsStepView({
  accounts,
  title = 'Select an account',
  description = 'We found that you have multiple accounts. Select an account to continue.',
  error,
  busy = false,
  onSelectAccount,
  onAddAccount,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="pr-9 sm:pr-0">
        <h2 className="font-poppins text-xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap">
        {accounts.map((account) => (
          <Card
            key={account.sessionId}
            className={
              account.isActive
                ? 'overflow-hidden border-primary/50 bg-primary/5 py-0 shadow-sm ring-1 ring-primary/30 transition-shadow hover:shadow-md md:min-w-[280px] md:flex-1'
                : 'overflow-hidden border-border bg-surface/95 py-0 shadow-sm transition-shadow hover:shadow-md md:min-w-[280px] md:flex-1'
            }
          >
            <CardContent className="space-y-3 px-4 py-4 sm:px-5">
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="min-w-0 truncate font-poppins text-[15px] font-semibold text-foreground">
                    {account.user.name || account.user.email}
                  </p>
                  {account.isActive ? (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      Current account
                    </span>
                  ) : null}
                </div>
                <p className="break-all text-sm text-muted-foreground">
                  {account.user.email}
                </p>
                {account.user.mobile ? (
                  <p className="text-xs text-muted-foreground">
                    {account.user.mobile}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant={account.isActive ? 'outline' : 'default'}
                className="h-9 w-full rounded-full font-poppins shadow-sm"
                onClick={() => onSelectAccount(account)}
                disabled={busy}
              >
                {busy
                  ? 'Please wait…'
                  : account.isActive
                    ? 'Continue with this account'
                    : 'Login with this account'}
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

      {onAddAccount ? (
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full rounded-full font-poppins"
          onClick={onAddAccount}
          disabled={busy}
        >
          Add another account
        </Button>
      ) : null}
    </div>
  )
}
