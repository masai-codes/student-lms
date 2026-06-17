import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignInNotice } from '@/components/features/sign-in/SignInNotice'
import { useAutoFocus } from '@/hooks/useAutoFocus'

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
  const emailRef = useAutoFocus<HTMLInputElement>()

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 rounded-full border border-primary/20 bg-primary/5 px-3 font-poppins text-primary shadow-sm hover:bg-primary/10 hover:text-primary"
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
          ref={emailRef}
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
