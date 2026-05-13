import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignInNotice } from '@/components/features/sign-in/SignInNotice'

type Props = {
  email: string
  error?: string
  info?: string
  busy: boolean
  onBack: () => void
  onEmailChange: (value: string) => void
  onSubmit: () => void
}

export function ForgotPasswordStepView({
  email,
  error,
  info,
  busy,
  onBack,
  onEmailChange,
  onSubmit,
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
        <h2 className="font-poppins text-lg font-semibold text-foreground">Reset your password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the email on your Masai account. If it matches an account, we will send a reset link.
        </p>
      </div>

      {info ? (
        <SignInNotice variant="email">
          <p>{info}</p>
        </SignInNotice>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="forgot-email" className="text-foreground">
          Email
        </Label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={busy}
          onChange={(e) => onEmailChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
      </div>

      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="w-full font-poppins shadow-sm"
        disabled={busy}
        onClick={onSubmit}
      >
        {busy ? 'Sending…' : 'Send reset link'}
      </Button>
    </div>
  )
}
