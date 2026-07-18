import { describe, expect, it } from 'vitest'
import {
  buildAddAccountSignInUrl,
  isAddAccountIntent,
} from '@/components/features/sign-in/signInRouting'

describe('buildAddAccountSignInUrl', () => {
  it('builds a /signin url carrying the add-account intent', () => {
    expect(buildAddAccountSignInUrl()).toBe('/signin?intent=add-account')
  })
})

describe('isAddAccountIntent', () => {
  it('is true when the search string carries intent=add-account', () => {
    expect(isAddAccountIntent('?intent=add-account')).toBe(true)
    expect(isAddAccountIntent('intent=add-account')).toBe(true)
  })

  it('is false for absent or unrelated search params', () => {
    expect(isAddAccountIntent('')).toBe(false)
    expect(isAddAccountIntent('?redirectTo=/foo')).toBe(false)
    expect(isAddAccountIntent('?intent=something-else')).toBe(false)
  })
})
