// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SigningContextError,
  captureSigningContext,
} from '@/lib/profile/captureSigningContext'

const getCurrentPosition = vi.fn()

function stubGeolocation(present = true) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: present ? { getCurrentPosition } : undefined,
  })
}

/** Resolves the position callback with fixed coordinates. */
function positionSucceeds() {
  getCurrentPosition.mockImplementation((onSuccess: (p: unknown) => void) =>
    onSuccess({ coords: { latitude: 12.97, longitude: 77.59 } }),
  )
}

/** Invokes the error callback with a code matching the given field name. */
function positionFails(code: number) {
  getCurrentPosition.mockImplementation(
    (_onSuccess: unknown, onError: (e: unknown) => void) =>
      onError({
        code,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }),
  )
}

function stubFetch(
  handler: (url: string) => { ok: boolean; body?: unknown } | Error,
) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const result = handler(String(url))
      if (result instanceof Error) return Promise.reject(result)
      return Promise.resolve({
        ok: result.ok,
        json: () => Promise.resolve(result.body ?? {}),
      })
    }),
  )
}

const HAPPY_FETCH = (url: string) =>
  url.includes('ipify')
    ? { ok: true, body: { ip: '1.2.3.4' } }
    : { ok: true, body: { display_name: 'Bengaluru, Karnataka, India' } }

beforeEach(() => {
  vi.clearAllMocks()
  stubGeolocation()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('captureSigningContext', () => {
  it('returns the resolved address and public IP', async () => {
    positionSucceeds()
    stubFetch(HAPPY_FETCH)

    await expect(captureSigningContext()).resolves.toEqual({
      location: 'Bengaluru, Karnataka, India',
      ipAddress: '1.2.3.4',
    })
  })

  it('does not prompt for location until it is called', () => {
    positionSucceeds()
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('fails with a recoverable message when permission is denied', async () => {
    positionFails(1)
    await expect(captureSigningContext()).rejects.toMatchObject({
      reason: 'PERMISSION_DENIED',
    })
    await expect(captureSigningContext()).rejects.toThrow(/browser settings/)
  })

  it('maps unavailable and timeout errors to their own reasons', async () => {
    positionFails(2)
    await expect(captureSigningContext()).rejects.toMatchObject({
      reason: 'UNAVAILABLE',
    })

    positionFails(3)
    await expect(captureSigningContext()).rejects.toMatchObject({
      reason: 'TIMEOUT',
    })
  })

  it('maps an unknown position error code to UNAVAILABLE', async () => {
    positionFails(99)
    await expect(captureSigningContext()).rejects.toMatchObject({
      reason: 'UNAVAILABLE',
    })
  })

  it('reports an unsupported browser', async () => {
    stubGeolocation(false)
    await expect(captureSigningContext()).rejects.toMatchObject({
      reason: 'UNSUPPORTED',
    })
  })

  it('fails when reverse geocoding errors', async () => {
    positionSucceeds()
    stubFetch((url) =>
      url.includes('ipify') ? { ok: true, body: { ip: '1.2.3.4' } } : { ok: false },
    )

    await expect(captureSigningContext()).rejects.toBeInstanceOf(
      SigningContextError,
    )
    await expect(captureSigningContext()).rejects.toMatchObject({
      reason: 'LOOKUP_FAILED',
    })
  })

  it('falls back to raw coordinates when no address name comes back', async () => {
    positionSucceeds()
    stubFetch((url) =>
      url.includes('ipify')
        ? { ok: true, body: { ip: '1.2.3.4' } }
        : { ok: true, body: { display_name: '  ' } },
    )

    await expect(captureSigningContext()).resolves.toMatchObject({
      location: '12.97, 77.59',
    })
  })

  it('still signs when the IP lookup fails — the address is the required part', async () => {
    positionSucceeds()
    stubFetch((url) =>
      url.includes('ipify')
        ? new Error('network down')
        : { ok: true, body: { display_name: 'Bengaluru' } },
    )

    await expect(captureSigningContext()).resolves.toEqual({
      location: 'Bengaluru',
      ipAddress: '',
    })
  })

  it('tolerates a non-ok or malformed IP response', async () => {
    positionSucceeds()
    stubFetch((url) =>
      url.includes('ipify')
        ? { ok: false }
        : { ok: true, body: { display_name: 'Bengaluru' } },
    )
    await expect(captureSigningContext()).resolves.toMatchObject({
      ipAddress: '',
    })

    stubFetch((url) =>
      url.includes('ipify')
        ? { ok: true, body: { ip: 42 } }
        : { ok: true, body: { display_name: 'Bengaluru' } },
    )
    await expect(captureSigningContext()).resolves.toMatchObject({
      ipAddress: '',
    })
  })
})
