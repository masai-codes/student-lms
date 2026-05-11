import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignInNotice } from '@/components/features/sign-in/SignInNotice'

type Props = {
  email: string
  authMode: 'password' | 'otp'
  password: string
  otp: string
  error?: string
  info?: string
  onBack: () => void
  onPasswordChange: (value: string) => void
  onOtpChange: (value: string) => void
  onUseOtp: () => void
  onUsePassword: () => void
  onSubmit: () => void
}

const otpInputClass =
  'text-center text-lg font-semibold tracking-[0.25em] tabular-nums md:text-xl md:tracking-[0.35em]'

export function EmailAuthStepView({
  email,
  authMode,
  password,
  otp,
  error,
  info,
  onBack,
  onPasswordChange,
  onOtpChange,
  onUseOtp,
  onUsePassword,
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
        Change email or phone
      </Button>

      <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm ring-1 ring-border/50">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        <p className="mt-1 font-poppins text-sm font-semibold text-foreground break-all">
          {email}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {authMode === 'password'
            ? 'Enter the password for this account.'
            : 'Enter the code we sent to this address.'}
        </p>
      </div>

      {info && authMode === 'otp' ? (
        <SignInNotice variant="email">
          <p>{info}</p>
        </SignInNotice>
      ) : null}

      {authMode === 'password' ? (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <Label htmlFor="signin-email-password" className="text-foreground">
              Password
            </Label>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto shrink-0 px-0 py-0 text-sm font-medium"
              onClick={onUseOtp}
            >
              Send OTP on email
            </Button>
          </div>
          <Input
            id="signin-email-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            aria-invalid={Boolean(error)}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <Label htmlFor="signin-email-otp" className="text-foreground">
              One-time code
            </Label>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto shrink-0 px-0 py-0 text-sm font-medium"
              onClick={onUsePassword}
            >
              or Login with password
            </Button>
          </div>
          <Input
            id="signin-email-otp"
            name="one-time-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            enterKeyHint="done"
            placeholder="••••••"
            value={otp}
            className={otpInputClass}
            onChange={(e) =>
              onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            aria-invalid={Boolean(error)}
          />
        </div>
      )}

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
        onClick={onSubmit}
      >
        Sign in
      </Button>
    </div>
  )
}
