/**
 * Password rules for the profile "change password" form, shared by the client
 * checklist and the server guard.
 *
 * The old LMS enforced exactly two rules (≥8 characters, no spaces) plus a
 * confirmation match, via a single mutating error string. Here the rules are
 * enumerable so the UI can render a live checklist instead.
 */

export const MIN_PASSWORD_LENGTH = 8

export interface PasswordRule {
  id: 'length' | 'no-spaces'
  label: string
  isSatisfied: (password: string) => boolean
}

export const PASSWORD_RULES: ReadonlyArray<PasswordRule> = [
  {
    id: 'length',
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    isSatisfied: (password) => password.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: 'no-spaces',
    label: 'No spaces',
    isSatisfied: (password) => password !== '' && !password.includes(' '),
  },
]

/** First unmet rule's message, or null when the password itself is fine. */
export function passwordRuleError(password: string): string | null {
  const failed = PASSWORD_RULES.find((rule) => !rule.isSatisfied(password))
  return failed ? failed.label : null
}

export interface PasswordFormState {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface PasswordFormValidity {
  canSubmit: boolean
  /** Shown under the fields; null when there is nothing to complain about. */
  error: string | null
}

/**
 * Whether the change-password form may be submitted, and the single message to
 * show. A blank field is "incomplete", not an error — we don't scold the user
 * for not having typed yet.
 */
export function validatePasswordForm(
  form: PasswordFormState,
): PasswordFormValidity {
  const { currentPassword, newPassword, confirmPassword } = form
  const isComplete =
    currentPassword !== '' && newPassword !== '' && confirmPassword !== ''

  const ruleError = newPassword === '' ? null : passwordRuleError(newPassword)
  if (ruleError) return { canSubmit: false, error: ruleError }

  const mismatch =
    confirmPassword !== '' &&
    newPassword !== '' &&
    newPassword !== confirmPassword
  if (mismatch) {
    return {
      canSubmit: false,
      error: 'The password confirmation does not match.',
    }
  }

  return { canSubmit: isComplete, error: null }
}
