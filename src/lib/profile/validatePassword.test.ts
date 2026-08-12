import { describe, expect, it } from 'vitest'
import {
  PASSWORD_RULES,
  passwordRuleError,
  validatePasswordForm,
} from '@/lib/profile/validatePassword'

const rule = (id: string) => PASSWORD_RULES.find((r) => r.id === id)!

describe('PASSWORD_RULES', () => {
  it('satisfies the length rule only at 8+ characters', () => {
    expect(rule('length').isSatisfied('1234567')).toBe(false)
    expect(rule('length').isSatisfied('12345678')).toBe(true)
  })

  it('fails the no-spaces rule for a blank or spaced password', () => {
    expect(rule('no-spaces').isSatisfied('')).toBe(false)
    expect(rule('no-spaces').isSatisfied('has space')).toBe(false)
    expect(rule('no-spaces').isSatisfied('nospace')).toBe(true)
  })
})

describe('passwordRuleError', () => {
  it('reports the first unmet rule', () => {
    expect(passwordRuleError('short')).toContain('8 characters')
  })

  it('reports the spaces rule when length is fine', () => {
    expect(passwordRuleError('long password')).toBe('No spaces')
  })

  it('returns null for an acceptable password', () => {
    expect(passwordRuleError('goodpassword')).toBeNull()
  })
})

describe('validatePasswordForm', () => {
  const base = {
    currentPassword: 'old-secret',
    newPassword: 'brandnewpass',
    confirmPassword: 'brandnewpass',
  }

  it('allows submit when every field is filled and valid', () => {
    expect(validatePasswordForm(base)).toEqual({ canSubmit: true, error: null })
  })

  it('does not scold an untouched form', () => {
    expect(
      validatePasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }),
    ).toEqual({ canSubmit: false, error: null })
  })

  it('blocks and explains a too-short new password', () => {
    const result = validatePasswordForm({ ...base, newPassword: 'short' })
    expect(result.canSubmit).toBe(false)
    expect(result.error).toContain('8 characters')
  })

  it('blocks and explains a mismatched confirmation', () => {
    expect(
      validatePasswordForm({ ...base, confirmPassword: 'somethingelse' }),
    ).toEqual({
      canSubmit: false,
      error: 'The password confirmation does not match.',
    })
  })

  it('stays quiet while the confirmation is still empty', () => {
    expect(validatePasswordForm({ ...base, confirmPassword: '' })).toEqual({
      canSubmit: false,
      error: null,
    })
  })

  it('blocks an incomplete form even when the new password is valid', () => {
    expect(
      validatePasswordForm({ ...base, currentPassword: '' }).canSubmit,
    ).toBe(false)
  })
})
