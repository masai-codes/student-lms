import { ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-identifier" className="text-foreground">
          Email or mobile number
        </Label>
        <p className="text-xs text-muted-foreground">Indian mobile numbers only: 10 digits, no country code.</p>
        <Input
          id="signin-identifier"
          name="identifier"
          type="text"
          inputMode="email"
          autoComplete="username webauthn"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="you@example.com or 9876543210"
          value={draft}
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
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        className="w-full font-poppins shadow-sm"
        disabled={nextDisabled}
        onClick={onSubmit}
      >
        {nextDisabled ? 'Please wait…' : 'Next'}
        <ArrowRight className="size-4" weight="bold" aria-hidden />
      </Button>
      {onForgotPassword ? (
        <div className="flex justify-start">
          <button
            type="button"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        </div>
      ) : null}
    </div>
  )
}
