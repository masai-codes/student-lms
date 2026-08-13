import { useState } from 'react'
import { Check, X } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { MasaiButton } from '@/components/ui/masai-button'
import { PasswordInput } from '@/components/ui/password-input'
import { updatePasswordRequest } from '@/lib/api/profile/profileApi'
import { ApiClientError } from '@/lib/api/apiClientError'
import {
  PASSWORD_RULES,
  validatePasswordForm,
} from '@/lib/profile/validatePassword'
import type { PasswordFormState } from '@/lib/profile/validatePassword'
import { pushProfileEvent } from '@/components/features/profile/shared/profileAnalytics'

const EMPTY_FORM: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function messageForError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === 'INCORRECT_CURRENT_PASSWORD') {
      return 'That current password is incorrect.'
    }
    if (error.code === 'PASSWORD_UNCHANGED') {
      return 'Please choose a password you have not used here before.'
    }
    if (error.code === 'WEAK_PASSWORD') return error.message
  }
  return 'Could not change your password. Please try again.'
}

/** Live checklist so the rules are visible before the user trips them. */
function RuleChecklist({ password }: { password: string }) {
  return (
    <ul data-testid="profile-password-rules" className="flex flex-col gap-1">
      {PASSWORD_RULES.map((rule) => {
        const satisfied = rule.isSatisfied(password)
        return (
          <li
            key={rule.id}
            data-testid={`profile-password-rule-${rule.id}`}
            data-satisfied={satisfied}
            className={`flex items-center gap-1.5 type-caption ${
              satisfied ? 'text-success' : 'text-foreground-subtle'
            }`}
          >
            {satisfied ? (
              <Check size={14} weight="bold" aria-hidden />
            ) : (
              <X size={14} aria-hidden />
            )}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}

export function ChangePasswordCard({
  isEditing,
  isDimmed,
  onEdit,
  onClose,
  onSaved,
}: {
  isEditing: boolean
  isDimmed: boolean
  onEdit: () => void
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<PasswordFormState>(EMPTY_FORM)

  const mutation = useMutation({
    mutationFn: () =>
      updatePasswordRequest({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    onSuccess: () => {
      setForm(EMPTY_FORM)
      onSaved()
    },
  })

  const { canSubmit, error } = validatePasswordForm(form)
  const serverError = mutation.isError ? messageForError(mutation.error) : null

  function update(key: keyof PasswordFormState, value: string) {
    mutation.reset()
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  function close() {
    setForm(EMPTY_FORM)
    mutation.reset()
    onClose()
  }

  return (
    <div
      data-testid="profile-field-password"
      aria-disabled={isDimmed || undefined}
      className={`flex flex-col rounded-2xl border bg-surface p-4 transition-opacity ${
        isEditing ? 'border-brand' : 'border-border'
      } ${isDimmed ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="type-b2-md text-foreground-muted">Password</p>
        {!isEditing ? (
          <MasaiButton
            type="link"
            size="sm"
            ctaText="Change"
            data-testid="profile-field-password-edit"
            disabled={isDimmed}
            onClick={() => {
              pushProfileEvent('password_change_open')
              onEdit()
            }}
          />
        ) : null}
      </div>

      {!isEditing ? (
        <p
          data-testid="profile-field-password-value"
          className="mt-2 type-b1-regular tracking-widest text-foreground-subtle"
        >
          ••••••••
        </p>
      ) : (
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            pushProfileEvent('password_change_submit')
            mutation.mutate()
          }}
        >
          <PasswordInput
            required
            autoComplete="current-password"
            placeholder="Current password"
            aria-label="Current password"
            data-testid="profile-password-current"
            value={form.currentPassword}
            onChange={(event) => update('currentPassword', event.target.value)}
          />
          <PasswordInput
            required
            autoComplete="new-password"
            placeholder="New password"
            aria-label="New password"
            data-testid="profile-password-new"
            value={form.newPassword}
            onChange={(event) => update('newPassword', event.target.value)}
          />
          <PasswordInput
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            data-testid="profile-password-confirm"
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
          />

          <RuleChecklist password={form.newPassword} />

          {(serverError ?? error) ? (
            <p
              role="alert"
              data-testid="profile-password-error"
              className="type-caption text-danger"
            >
              {serverError ?? error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <MasaiButton
              type="secondary"
              size="sm"
              ctaText="Cancel"
              data-testid="profile-password-cancel"
              onClick={close}
            />
            <MasaiButton
              htmlType="submit"
              size="sm"
              ctaText={mutation.isPending ? 'Saving…' : 'Save'}
              disabled={!canSubmit || mutation.isPending}
              data-testid="profile-password-save"
            />
          </div>
        </form>
      )}
    </div>
  )
}
