import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAchievements } from '@/server/api/profile/getAchievements.service'

const select = vi.hoisted(() => vi.fn())
const createBadgeShareKey = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: { select: (...args: Array<unknown>) => select(...args) },
}))

vi.mock('@/server/api/profile/badgeShareKey', () => ({
  createBadgeShareKey: (...args: Array<unknown>) =>
    createBadgeShareKey(...args),
}))

vi.mock('@/server/storage/s3ToCloudFront', () => ({
  mapS3UrlToCdn: (url: unknown) => `cdn:${String(url)}`,
}))

/** Queues row-sets in call order across the three different query shapes. */
function queueRows(...rowSets: Array<Array<Record<string, unknown>>>) {
  let call = 0
  select.mockImplementation(() => {
    const rows = rowSets[call] ?? []
    call += 1
    const terminal = Object.assign(Promise.resolve(rows), {
      orderBy: () => Promise.resolve(rows),
      limit: () => Promise.resolve(rows),
    })
    const chain: any = {
      where: () => terminal,
      innerJoin: () => chain,
      leftJoin: () => chain,
    }
    return { from: () => chain }
  })
}

function configRow(overrides: Record<string, unknown> = {}) {
  return {
    configId: 100,
    badgeId: 1,
    title: 'First Steps',
    description: 'Completed your first lecture',
    image: 's3://badge.png',
    linkedinShareText: 'I earned this',
    lockedBadgeDescription: 'Complete a lecture to unlock',
    theme: 'theme1',
    batchMeta: { course_title: 'Full Stack' },
    sectionModule: 'foundations',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  createBadgeShareKey.mockReturnValue('share-key')
})

describe('getAchievements', () => {
  it('returns nothing when the student has no enrolments', async () => {
    queueRows([])
    await expect(getAchievements(7)).resolves.toEqual([])
    expect(select).toHaveBeenCalledTimes(1)
  })

  it('marks a config with no award as locked and unshareable', async () => {
    queueRows([{ sectionId: 11 }], [configRow()], [])

    const [item] = await getAchievements(7)
    expect(item).toMatchObject({
      badgeConfigId: 100,
      isLocked: true,
      count: 0,
      releaseDate: null,
      shareKey: null,
      courseTitle: 'Full Stack',
      sectionModuleName: 'Foundations',
    })
    expect(createBadgeShareKey).not.toHaveBeenCalled()
  })

  it('marks an awarded config as earned with a share key', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [configRow()],
      [{ badgeConfigId: 100, releaseDate: '2026-03-01', createdAt: null }],
    )

    const [item] = await getAchievements(7)
    expect(item).toMatchObject({
      isLocked: false,
      count: 1,
      releaseDate: '2026-03-01',
      shareKey: 'share-key',
    })
    expect(createBadgeShareKey).toHaveBeenCalledWith(7, 100)
  })

  it('collapses duplicate awards, keeping the earliest date', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [configRow()],
      [
        { badgeConfigId: 100, releaseDate: '2026-05-01', createdAt: null },
        { badgeConfigId: 100, releaseDate: '2026-02-01', createdAt: null },
        { badgeConfigId: 100, releaseDate: '2026-09-01', createdAt: null },
      ],
    )

    const [item] = await getAchievements(7)
    expect(item.count).toBe(3)
    expect(item.releaseDate).toBe('2026-02-01')
  })

  it('falls back to created_at when release_date is absent', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [configRow()],
      [{ badgeConfigId: 100, releaseDate: null, createdAt: '2026-04-01' }],
    )
    const [item] = await getAchievements(7)
    expect(item.releaseDate).toBe('2026-04-01')
  })

  it('keeps a null date when neither date is present', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [configRow()],
      [
        { badgeConfigId: 100, releaseDate: null, createdAt: null },
        { badgeConfigId: 100, releaseDate: null, createdAt: null },
      ],
    )
    const [item] = await getAchievements(7)
    expect(item.releaseDate).toBeNull()
    expect(item.count).toBe(2)
  })

  it('maps badge images through the CDN', async () => {
    queueRows([{ sectionId: 11 }], [configRow()], [])
    const [item] = await getAchievements(7)
    expect(item.badge.image).toBe('cdn:s3://badge.png')
  })

  it('reads the camelCase course title variant', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [configRow({ batchMeta: { courseTitle: 'Data Science' } })],
      [],
    )
    const [item] = await getAchievements(7)
    expect(item.courseTitle).toBe('Data Science')
  })

  it('leaves course/module null when the metadata is missing or blank', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [configRow({ batchMeta: { course_title: '  ' }, sectionModule: null })],
      [],
    )
    const [item] = await getAchievements(7)
    expect(item.courseTitle).toBeNull()
    expect(item.sectionModuleName).toBeNull()
  })

  it('tolerates a non-object batch meta', async () => {
    queueRows([{ sectionId: 11 }], [configRow({ batchMeta: 'junk' })], [])
    const [item] = await getAchievements(7)
    expect(item.courseTitle).toBeNull()
  })

  it('de-duplicates repeated section enrolments', async () => {
    queueRows([{ sectionId: 11 }, { sectionId: 11 }], [configRow()], [])
    await expect(getAchievements(7)).resolves.toHaveLength(1)
  })
})
