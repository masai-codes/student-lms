import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { useAutoFocus } from '@/hooks/useAutoFocus'
import { SignInShell } from '@/components/features/sign-in/SignInShell'
import { V2AuthRequestError, v2ResetPassword } from '@/components/features/sign-in/v2AuthClient'

export const Route = createFileRoute('/(auth)/reset-password/$token/')({
  component: ResetPasswordPage,
})

function formatAuthError(err: unknown): string {
  if (err instanceof V2AuthRequestError) {
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Something went wrong. Please try again.'
}

function ResetPasswordPage() {
  const { token } = Route.useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const passwordRef = useAutoFocus<HTMLInputElement>()

  const onSubmit = async () => {
    setError(undefined)
    if (password.trim().length < 8) {
      setError('Use at least 8 characters for your new password.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await v2ResetPassword({ token, password })
      setDone(true)
      window.setTimeout(() => {
        void navigate({ to: '/signin' })
      }, 2000)
    } catch (e) {
      setError(formatAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SignInShell>
      <div className="space-y-6">
        <Button type="button" variant="ghost" size="sm" className="h-auto gap-1.5 px-0 font-poppins text-muted-foreground hover:bg-transparent hover:text-foreground" asChild>
          <Link to="/signin">
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Back to sign in
          </Link>
        </Button>

        <div className="text-center">
          <h1 className="font-poppins text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a new password for your account. You will be redirected to sign in when it succeeds.
          </p>
        </div>

        {done ? (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-center text-sm text-foreground">
            Password updated. Taking you to sign in…
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password-1">New password</Label>
              <PasswordInput
                ref={passwordRef}
                id="reset-password-1"
                name="new-password"
                autoComplete="new-password"
                value={password}
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password-2">Confirm new password</Label>
              <PasswordInput
                id="reset-password-2"
                name="new-password-confirm"
                autoComplete="new-password"
                value={confirm}
                disabled={busy}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="button" className="w-full font-poppins shadow-sm" disabled={busy} onClick={() => void onSubmit()}>
              {busy ? 'Saving…' : 'Update password'}
            </Button>
          </div>
        )}
      </div>
    </SignInShell>
  )
}
