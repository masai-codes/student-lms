import { ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAuthBranding } from '@/utils/authBranding'

type Props = {
  draft: string
  error?: string
  nextDisabled?: boolean
  onDraftChange: (value: string) => void
  onSubmit: () => void
  onForgotPassword?: () => void
}

export function IdentifierStepView({
  draft,
  error,
  nextDisabled,
  onDraftChange,
  onSubmit,
  onForgotPassword,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h1 className="font-poppins text-[28px] font-medium tracking-tight text-foreground md:text-[32px]">
          {getAuthBranding().signInHeading}
        </h1>
        <p className="text-sm text-muted-foreground">
          Use your email or phone number.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="signin-identifier" className="sr-only">
          Email or mobile number
        </Label>
        <Input
          id="signin-identifier"
          name="identifier"
          type="text"
          inputMode="email"
          autoComplete="username webauthn"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Email or mobile number"
          value={draft}
          className="h-12 rounded-xl border-slate-300 bg-white px-4 text-base shadow-none md:h-13"
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSubmit()
            }
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'signin-identifier-error' : undefined}
        />
        {error ? (
          <p
            id="signin-identifier-error"
            className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        {onForgotPassword ? (
          <button
            type="button"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        ) : (
          <span />
        )}

        <Button
          type="button"
          className="min-w-28 rounded-full px-6 font-poppins shadow-sm"
          disabled={nextDisabled}
          onClick={onSubmit}
        >
          {nextDisabled ? 'Please wait…' : 'Next'}
          <ArrowRight className="size-4" weight="bold" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
