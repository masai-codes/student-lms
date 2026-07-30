import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ENROLLMENT_CACHE_PORTALS,
  enrolledBatchIdsKey,
  enrolledSectionIdsKey,
  invalidatePortalEnrollmentCache,
  legacyAllowedBatchIdsKey,
} from '@/server/batches/portalEnrollmentCache'

const cacheDel = vi.hoisted(() => vi.fn())

vi.mock('@/server/redis/cache', () => ({ cacheDel }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('cache keys', () => {
  it('scopes each key by user + portal', () => {
    expect(enrolledBatchIdsKey(7, 'ihub')).toBe('enrolledBatchIds:7:ihub')
    expect(enrolledSectionIdsKey(7, 'masai')).toBe('enrolledSectionIds:7:masai')
    // The old LMS (experience-api `src/utils/ihubAccess.ts`) reads this one.
    expect(legacyAllowedBatchIdsKey(7, 'ihub')).toBe('allowedBatchIds:7:ihub')
  })
})

describe('invalidatePortalEnrollmentCache', () => {
  it('clears both apps’ keys for every portal in one call', async () => {
    await invalidatePortalEnrollmentCache(7)

    // Derived from the exported portal list rather than hardcoded, so adding a
    // portal (e.g. `iitj`) can't leave a stale key silently uncovered.
    const expected = [
      ...ENROLLMENT_CACHE_PORTALS.map((p) => enrolledBatchIdsKey(7, p)),
      ...ENROLLMENT_CACHE_PORTALS.map((p) => enrolledSectionIdsKey(7, p)),
      ...ENROLLMENT_CACHE_PORTALS.map((p) => legacyAllowedBatchIdsKey(7, p)),
    ]
    expect(cacheDel).toHaveBeenCalledTimes(1)
    expect(cacheDel.mock.calls[0]).toEqual(expected)
    expect(cacheDel.mock.calls[0]).toHaveLength(
      ENROLLMENT_CACHE_PORTALS.length * 3,
    )
  })

  it('includes the legacy key the old LMS reads', async () => {
    await invalidatePortalEnrollmentCache(7)
    expect(cacheDel.mock.calls[0]).toContain('allowedBatchIds:7:masai')
  })
})
