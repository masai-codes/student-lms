import { afterEach, describe, expect, it, vi } from 'vitest'
import crypto from 'node:crypto'
import {
  canShareBadges,
  createBadgeShareKey,
} from '@/server/api/profile/badgeShareKey'

afterEach(() => vi.unstubAllEnvs())

/** Independent re-implementation of experience-api's scheme, to pin compatibility. */
function expectedKey(secret: string, userId: number, configId: number): string {
  const payload = `${userId}.${configId}`
  const encoded = Buffer.from(payload, 'utf8').toString('base64url')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url')
    .slice(0, 16)
  return `${encoded}.${signature}`
}

describe('canShareBadges', () => {
  it('is false when neither secret is configured', () => {
    vi.stubEnv('BADGE_SHARE_SECRET', '')
    vi.stubEnv('JWT_SECRET', '')
    expect(canShareBadges()).toBe(false)
  })

  it('is true with either secret configured', () => {
    vi.stubEnv('BADGE_SHARE_SECRET', 's3cret')
    expect(canShareBadges()).toBe(true)
  })
})

describe('createBadgeShareKey', () => {
  it('matches the experience-api signing scheme exactly', () => {
    vi.stubEnv('BADGE_SHARE_SECRET', 's3cret')
    expect(createBadgeShareKey(42, 7)).toBe(expectedKey('s3cret', 42, 7))
  })

  it('falls back to JWT_SECRET when the dedicated secret is unset', () => {
    vi.stubEnv('BADGE_SHARE_SECRET', '')
    vi.stubEnv('JWT_SECRET', 'jwt-secret')
    expect(createBadgeShareKey(42, 7)).toBe(expectedKey('jwt-secret', 42, 7))
  })

  it('produces different keys per user and per badge config', () => {
    vi.stubEnv('BADGE_SHARE_SECRET', 's3cret')
    expect(createBadgeShareKey(42, 7)).not.toBe(createBadgeShareKey(43, 7))
    expect(createBadgeShareKey(42, 7)).not.toBe(createBadgeShareKey(42, 8))
  })

  it('returns null (no link) rather than an invalid key when unconfigured', () => {
    vi.stubEnv('BADGE_SHARE_SECRET', '')
    vi.stubEnv('JWT_SECRET', '')
    expect(createBadgeShareKey(42, 7)).toBeNull()
  })
})
