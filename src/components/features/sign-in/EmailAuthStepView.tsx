import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RememberMeField } from '@/components/features/sign-in/RememberMeField'
import { SignInNotice } from '@/components/features/sign-in/SignInNotice'

type Props = {
  email: string
  authMode: 'password' | 'otp'
  password: string
  otp: string
  rememberMe: boolean
  error?: string
  info?: string
  onBack: () => void
  onPasswordChange: (value: string) => void
  onOtpChange: (value: string) => void
  onRememberMeChange: (checked: boolean) => void
  onUseOtp: () => void
  onUsePassword: () => void
  onForgotPassword: () => void
  onSubmit: () => void
  submitDisabled?: boolean
  sendOtpDisabled?: boolean
}

export function EmailAuthStepView({
  email,
  authMode,
  password,
  otp,
  rememberMe,
  error,
  info,
  onBack,
  onPasswordChange,
  onOtpChange,
  onRememberMeChange,
  onUseOtp,
  onUsePassword,
  onForgotPassword,
  onSubmit,
  submitDisabled,
  sendOtpDisabled,
}: Props) {
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
            : 'Enter the sign-in code we sent to this address.'}
        </p>
      </div>

      {info && authMode === 'otp' ? (
        <SignInNotice variant="email">
          <p>{info}</p>
        </SignInNotice>
      ) : null}

      {authMode === 'password' ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
            <Label htmlFor="signin-email-password" className="text-foreground">
              Password
            </Label>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto shrink-0 px-0 py-0 text-sm font-medium"
                disabled={sendOtpDisabled}
                onClick={onUseOtp}
              >
                Send OTP on email
              </Button>
            </div>
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
              Sign-in code
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
            autoComplete="one-time-code"
            enterKeyHint="done"
            placeholder="Paste or type your code"
            value={otp}
            onChange={(e) => onOtpChange(e.target.value)}
            aria-invalid={Boolean(error)}
          />
        </div>
      )}

      <RememberMeField
        id="signin-email-remember-me"
        checked={rememberMe}
        onCheckedChange={onRememberMeChange}
      />

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
        disabled={submitDisabled}
        onClick={onSubmit}
      >
        {submitDisabled ? 'Signing in…' : 'Sign in'}
      </Button>

      <div className="flex justify-start">
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 py-0 text-sm font-medium"
          disabled={sendOtpDisabled}
          onClick={onForgotPassword}
        >
          Forgot password?
        </Button>
      </div>
    </div>
  )
}
