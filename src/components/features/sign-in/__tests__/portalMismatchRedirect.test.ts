// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import {
  getPortalMismatch,
  redirectToPortal,
} from '@/components/features/sign-in/portalMismatchRedirect'
import { V2AuthRequestError } from '@/components/features/sign-in/v2AuthClient'

function mismatchError(details: Record<string, unknown>): V2AuthRequestError {
  return new V2AuthRequestError(403, 'PORTAL_MISMATCH', 'wrong portal', details)
}

describe('getPortalMismatch', () => {
  it('reads the portal and target URL off a PORTAL_MISMATCH error', () => {
    expect(
      getPortalMismatch(
        mismatchError({
          portal: 'iitj',
          portalLabel: 'IIT Jodhpur',
          redirectUrl: 'https://iitj-learn.masaischool.com/signin',
        }),
      ),
    ).toEqual({
      portalLabel: 'IIT Jodhpur',
      redirectUrl: 'https://iitj-learn.masaischool.com/signin',
    })
  })

  it('ignores other auth failures and non-auth errors', () => {
    expect(
      getPortalMismatch(
        new V2AuthRequestError(401, 'INCORRECT_CREDENTIALS', 'nope'),
      ),
    ).toBeNull()
    expect(getPortalMismatch(new Error('boom'))).toBeNull()
    expect(getPortalMismatch(null)).toBeNull()
  })

  it('refuses a mismatch with no usable redirect URL', () => {
    // Server couldn't resolve a destination → keep the plain error message.
    expect(getPortalMismatch(mismatchError({ portal: 'masai' }))).toBeNull()
    // Relative and non-http URLs never reach `location.replace`.
    expect(
      getPortalMismatch(mismatchError({ redirectUrl: '/signin' })),
    ).toBeNull()
    expect(
      getPortalMismatch(mismatchError({ redirectUrl: 'javascript:alert(1)' })),
    ).toBeNull()
  })

  it('falls back to a generic label when the server sent none', () => {
    expect(
      getPortalMismatch(
        mismatchError({ redirectUrl: 'https://learn.masaischool.com/signin' }),
      ),
    ).toEqual({
      portalLabel: 'your portal',
      redirectUrl: 'https://learn.masaischool.com/signin',
    })
  })
})

describe('redirectToPortal', () => {
  it('replaces the current URL (no Back into the wrong portal) after the notice', () => {
    vi.useFakeTimers()
    const replace = vi.fn()
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    })

    redirectToPortal('https://learn.masaischool.com/signin')
    expect(replace).not.toHaveBeenCalled() // message is readable first

    vi.runAllTimers()
    expect(replace).toHaveBeenCalledWith('https://learn.masaischool.com/signin')

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
    vi.useRealTimers()
  })
})
