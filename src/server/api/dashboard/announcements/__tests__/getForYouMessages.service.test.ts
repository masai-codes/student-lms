import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }))

vi.mock('@/db', () => {
  const chain: Record<string, unknown> = {
    select: () => chain,
    from: () => chain,
    leftJoin: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

const row = (over: Record<string, unknown> = {}) => ({
  id: 10,
  subject: 'Subject line',
  body: 'Body',
  meta: null,
  authorName: 'Prof. Anvesh',
  ctaName: null,
  ctaLink: null,
  schedule: '2026-07-02 10:00:00',
  createdAt: '2026-07-01 10:00:00',
  ...over,
})

describe('getForYouMessages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps rows to ranked messages (source m, For You)', async () => {
    hoisted.rows = [row()]
    const { getForYouMessages } = await import('../getForYouMessages.service')

    const [ranked] = await getForYouMessages(42, '2026-07-02 12:00:00', null)
    expect(ranked.item).toMatchObject({ id: 10, source: 'm', isForYou: true, title: 'Subject line' })
  })

  it('prefers meta.title over subject when present', async () => {
    hoisted.rows = [row({ meta: { title: 'Meta title' } })]
    const { getForYouMessages } = await import('../getForYouMessages.service')

    const [ranked] = await getForYouMessages(42, '2026-07-02 12:00:00', null)
    expect(ranked.item.title).toBe('Meta title')
  })

  it('falls back to subject when meta.title is blank or non-string', async () => {
    hoisted.rows = [row({ meta: { title: '' } }), row({ id: 11, meta: { title: 5 } })]
    const { getForYouMessages } = await import('../getForYouMessages.service')

    const result = await getForYouMessages(42, '2026-07-02 12:00:00', null)
    expect(result.map((r) => r.item.title)).toEqual(['Subject line', 'Subject line'])
  })

  it('drops messages created/scheduled after a banned cutoff', async () => {
    hoisted.rows = [
      row({ id: 10, schedule: '2026-06-01 10:00:00', createdAt: '2026-06-01 10:00:00' }),
      row({ id: 11, schedule: '2026-07-01 10:00:00', createdAt: '2026-07-01 10:00:00' }),
    ]
    const { getForYouMessages } = await import('../getForYouMessages.service')

    const result = await getForYouMessages(42, '2026-07-02 12:00:00', new Date('2026-06-15T00:00:00Z'))
    expect(result.map((r) => r.item.id)).toEqual([10])
  })
})
