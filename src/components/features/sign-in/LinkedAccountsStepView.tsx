import { ArrowLeft } from '@phosphor-icons/react'
import type { LinkedAccount } from '@/components/features/sign-in/v2AuthClient'
import { SignInNotice } from '@/components/features/sign-in/SignInNotice'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  accounts: LinkedAccount[]
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
  return (
    <div className="space-y-5">
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

      <div className="text-left">
        <h2 className="font-poppins text-lg font-semibold text-foreground">Choose an account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This mobile number is linked to multiple accounts. Select the one you want to continue with.
        </p>
      </div>

      <SignInNotice variant="sms">
        <p>Your sign-in is verified. Pick the account you want to open in the old LMS.</p>
      </SignInNotice>

      <div className="space-y-3">
        {accounts.map((account) => (
          <Card key={account.sessionId} className="gap-0 py-0">
            <CardContent className="p-0">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 rounded-xl px-5 py-4 text-left transition-colors hover:bg-muted/40"
                disabled={busy}
                onClick={() => onSelectAccount(account)}
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-poppins text-sm font-semibold text-foreground">
                    {account.user.name || account.user.email}
                  </p>
                  <p className="break-all text-sm text-muted-foreground">{account.user.email}</p>
                  {account.user.mobile ? (
                    <p className="text-xs text-muted-foreground">{account.user.mobile}</p>
                  ) : null}
                </div>
                <div className="shrink-0">
                  <span
                    className={
                      account.isActive
                        ? 'inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary'
                        : 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
                    }
                  >
                    {account.isActive ? 'Current session' : 'Switch account'}
                  </span>
                </div>
              </button>
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
