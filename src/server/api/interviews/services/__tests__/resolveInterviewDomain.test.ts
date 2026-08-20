import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<{ meta: unknown }>,
}))

vi.mock('@/db', () => {
  const chain = {
    select: () => chain,
    from: () => chain,
    innerJoin: () => chain,
    where: () => chain,
    orderBy: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

vi.mock('@/server/batches/portalBatchScope', () => ({
  batchScopeForPortal: () => undefined,
}))

describe('parseInterviewDomainsFromMeta', () => {
  it('extracts and validates the interviews array', async () => {
    const { parseInterviewDomainsFromMeta } =
      await import('../resolveInterviewDomain')
    expect(
      parseInterviewDomainsFromMeta({ interviews: ['frontend', 'backend'] }),
    ).toEqual(['frontend', 'backend'])
  })

  it('drops unknown or malformed entries', async () => {
    const { parseInterviewDomainsFromMeta } =
      await import('../resolveInterviewDomain')
    expect(
      parseInterviewDomainsFromMeta({
        interviews: ['data-science', 'not-a-real-domain', 42, null],
      }),
    ).toEqual(['data-science'])
  })

  it('returns an empty array for missing/malformed meta', async () => {
    const { parseInterviewDomainsFromMeta } =
      await import('../resolveInterviewDomain')
    expect(parseInterviewDomainsFromMeta(null)).toEqual([])
    expect(parseInterviewDomainsFromMeta({})).toEqual([])
    expect(parseInterviewDomainsFromMeta({ interviews: 'frontend' })).toEqual(
      [],
    )
  })
})

describe('resolveInterviewDomains', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns [general] when the user has no active enrollment', async () => {
    hoisted.rows = []
    const { resolveInterviewDomains } =
      await import('../resolveInterviewDomain')
    expect(await resolveInterviewDomains(1)).toEqual(['general'])
  })

  it('returns the batch meta.interviews domains', async () => {
    hoisted.rows = [{ meta: { interviews: ['data-analytics'] } }]
    const { resolveInterviewDomains } =
      await import('../resolveInterviewDomain')
    expect(await resolveInterviewDomains(1)).toEqual(['data-analytics'])
  })

  it('supports multiple enabled domains on one batch', async () => {
    hoisted.rows = [{ meta: { interviews: ['frontend', 'backend'] } }]
    const { resolveInterviewDomains } =
      await import('../resolveInterviewDomain')
    expect(await resolveInterviewDomains(1)).toEqual(['frontend', 'backend'])
  })

  it('falls back to [general] when meta.interviews is missing or empty', async () => {
    hoisted.rows = [{ meta: {} }]
    const { resolveInterviewDomains } =
      await import('../resolveInterviewDomain')
    expect(await resolveInterviewDomains(1)).toEqual(['general'])
  })

  it('unions domains across all active batches, deduped, most-recent first', async () => {
    hoisted.rows = [
      { meta: { interviews: ['frontend', 'backend'] } },
      { meta: { interviews: ['backend', 'data-analytics'] } },
    ]
    const { resolveInterviewDomains } =
      await import('../resolveInterviewDomain')
    expect(await resolveInterviewDomains(1)).toEqual([
      'frontend',
      'backend',
      'data-analytics',
    ])
  })
})
