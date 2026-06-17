import { useEffect, useState } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RememberMeField } from '@/components/features/sign-in/RememberMeField'
import { SignInNotice } from '@/components/features/sign-in/SignInNotice'
import { useAutoFocus } from '@/hooks/useAutoFocus'

const RESEND_OTP_COOLDOWN_SEC = 30

type Props = {
  displayPhone: string
  delivery: 'sms' | 'whatsapp'
  resendCount: number
  otp: string
  rememberMe: boolean
  error?: string
  info?: string
  onBack: () => void
  onOtpChange: (value: string) => void
  onRememberMeChange: (checked: boolean) => void
  onResend: () => void
  onSubmit: () => void
  resendBusy?: boolean
  submitDisabled?: boolean
}

export function PhoneOtpStepView({
  displayPhone,
  delivery,
  resendCount,
  otp,
  rememberMe,
  error,
  info,
  onBack,
  onOtpChange,
  onRememberMeChange,
  onResend,
  onSubmit,
  resendBusy = false,
  submitDisabled = false,
}: Props) {
  const [resendSecondsLeft, setResendSecondsLeft] = useState(RESEND_OTP_COOLDOWN_SEC)
  const otpRef = useAutoFocus<HTMLInputElement>()

  useEffect(() => {
    setResendSecondsLeft(RESEND_OTP_COOLDOWN_SEC)
    const id = window.setInterval(() => {
      setResendSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [resendCount])

  const canResend = resendSecondsLeft === 0 && !resendBusy

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
        Change number
      </Button>

      <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm ring-1 ring-border/50">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mobile number</p>
        <p className="mt-1 font-poppins text-base font-semibold tabular-nums text-foreground">{displayPhone}</p>
      </div>

      {info ? (
        <SignInNotice variant={delivery}>
          <p>{info}</p>
        </SignInNotice>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="signin-phone-otp" className="text-foreground">
          Sign-in code
        </Label>
        <Input
          ref={otpRef}
          id="signin-phone-otp"
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

      <RememberMeField
        id="signin-phone-remember-me"
        checked={rememberMe}
        onCheckedChange={onRememberMeChange}
      />

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="flex-1 font-poppins shadow-sm"
          disabled={!canResend}
          onClick={onResend}
          aria-disabled={!canResend}
        >
          {resendBusy
            ? 'Sending…'
            : resendSecondsLeft === 0
              ? 'Resend OTP'
              : `Resend OTP (${resendSecondsLeft}s)`}
        </Button>
        <Button
          type="button"
          className="flex-1 font-poppins shadow-sm"
          disabled={submitDisabled}
          onClick={onSubmit}
        >
          {submitDisabled ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>
    </div>
  )
}
