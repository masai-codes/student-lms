import { useEffect, useState } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignInNotice } from '@/components/features/sign-in/SignInNotice'

const RESEND_OTP_COOLDOWN_SEC = 30

type Props = {
  displayPhone: string
  delivery: 'sms' | 'whatsapp'
  resendCount: number
  otp: string
  error?: string
  info?: string
  onBack: () => void
  onOtpChange: (value: string) => void
  onResend: () => void
  onSubmit: () => void
}

const otpInputClass =
  'text-center text-lg font-semibold tracking-[0.25em] tabular-nums md:text-xl md:tracking-[0.35em]'

export function PhoneOtpStepView({
  displayPhone,
  delivery,
  resendCount,
  otp,
  error,
  info,
  onBack,
  onOtpChange,
  onResend,
  onSubmit,
}: Props) {
  const [resendSecondsLeft, setResendSecondsLeft] = useState(RESEND_OTP_COOLDOWN_SEC)

  useEffect(() => {
    setResendSecondsLeft(RESEND_OTP_COOLDOWN_SEC)
    const id = window.setInterval(() => {
      setResendSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [resendCount])

  const canResend = resendSecondsLeft === 0

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
          Enter 6-digit code
        </Label>
        <Input
          id="signin-phone-otp"
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
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-invalid={Boolean(error)}
        />
      </div>

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
          {canResend ? 'Resend OTP' : `Resend OTP (${resendSecondsLeft}s)`}
        </Button>
        <Button type="button" className="flex-1 font-poppins shadow-sm" onClick={onSubmit}>
          Sign in
        </Button>
      </div>
    </div>
  )
}
