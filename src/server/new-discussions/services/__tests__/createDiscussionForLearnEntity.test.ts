import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  checkIfValidQuery: vi.fn(),
  ensureUserCanAccessLearnHubEntity: vi.fn(),
  resolveAssigneeFromSection: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
}))

vi.mock('@/server/new-discussions/services/checkIfValidQuery', () => ({
  checkIfValidQuery: hoisted.checkIfValidQuery,
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: hoisted.ensureUserCanAccessLearnHubEntity,
}))

vi.mock('@/server/new-discussions/services/resolveAssigneeFromSection', () => ({
  resolveAssigneeFromSection: hoisted.resolveAssigneeFromSection,
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.select,
    insert: hoisted.insert,
  },
}))

import { createDiscussionForLearnEntity } from '../createDiscussionForLearnEntity'

describe('createDiscussionForLearnEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.ensureUserCanAccessLearnHubEntity.mockResolvedValue(true)
    hoisted.resolveAssigneeFromSection.mockResolvedValue(99)
    hoisted.checkIfValidQuery.mockResolvedValue(true)
    hoisted.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    })
  })

  function mockLectureLookup() {
    const limit = vi.fn().mockResolvedValue([
      { batchId: 1, sectionId: 2, hostId: 3, ownerId: 4 },
    ])
    const where = vi.fn().mockReturnValue({ limit })
    const from = vi.fn().mockReturnValue({ where })
    hoisted.select.mockReturnValueOnce({ from })
  }

  function mockInsertedDiscussion(id: number) {
    const limit = vi.fn().mockResolvedValue([{ id }])
    const orderBy = vi.fn().mockReturnValue({ limit })
    const where = vi.fn().mockReturnValue({ orderBy })
    const from = vi.fn().mockReturnValue({ where })
    hoisted.select.mockReturnValueOnce({ from })
  }

  it('marks lecture discussions public when LLM classifies as curriculum-related', async () => {
    mockLectureLookup()
    mockInsertedDiscussion(501)
    hoisted.checkIfValidQuery.mockResolvedValue(true)

    await createDiscussionForLearnEntity({
      authorUserId: 10,
      kind: 'lecture',
      entityId: 501,
      title: 'Pointer doubt',
      message: '<p>Why does this crash?</p>',
    })

    expect(hoisted.checkIfValidQuery).toHaveBeenCalledWith(
      'Pointer doubt\n\n<p>Why does this crash?</p>',
    )
    const values = hoisted.insert.mock.results[0]?.value?.values
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ public: 1, entityId: 501 }),
    )
  })

  it('marks lecture discussions private when LLM classifies as non-curriculum', async () => {
    mockLectureLookup()
    mockInsertedDiscussion(502)
    hoisted.checkIfValidQuery.mockResolvedValue(false)

    await createDiscussionForLearnEntity({
      authorUserId: 10,
      kind: 'lecture',
      entityId: 501,
      title: 'Weekend plans',
      message: '<p>Anyone free Saturday?</p>',
    })

    const values = hoisted.insert.mock.results[0]?.value?.values
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ public: 0 }),
    )
  })
})
