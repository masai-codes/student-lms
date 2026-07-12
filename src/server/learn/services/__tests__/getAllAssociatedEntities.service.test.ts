import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(hoisted.selectQueue.shift() ?? []),
      }),
    }),
  },
}))

vi.mock('@/db/schema', () => ({ lectures: {}, assignments: {} }))

vi.mock('@/utils/generics', () => ({
  formatSqlDate: (value: string | null) => `fmt:${value}`,
}))

import { getAllAssociatedEntities } from '../getAllAssociatedEntities.service'

// Section corpus: L1 → L2 → R3 (reading) and A7 → L2, plus unrelated L9 / A8.
const lectureRows = [
  { id: 1, title: 'L1', schedule: 's1', type: 'live', data: { associatedLecture: { id: 2 } } },
  { id: 2, title: 'L2', schedule: 's2', type: 'video', data: { associatedLecture: { id: 3 } } },
  { id: 3, title: 'R3', schedule: null, type: 'reading', data: null },
  { id: 9, title: 'L9', schedule: 's9', type: 'live', data: null },
]
const assignmentRows = [
  { id: 7, title: 'A7', schedule: 's7', data: { associatedLecture: [{ id: 2 }] } },
  { id: 8, title: 'A8', schedule: null, data: null },
]

describe('getAllAssociatedEntities', () => {
  beforeEach(() => {
    hoisted.selectQueue = []
  })

  it('returns the transitive closure for a lecture, excluding itself', async () => {
    hoisted.selectQueue = [lectureRows, assignmentRows]

    await expect(
      getAllAssociatedEntities({
        entityId: 1,
        entityKind: 'lecture',
        sectionId: 5,
        entityData: lectureRows[0].data,
      }),
    ).resolves.toEqual([
      { id: 2, kind: 'lecture', title: 'L2', meta: 'fmt:s2' },
      { id: 3, kind: 'resource', title: 'R3', meta: null },
      { id: 7, kind: 'assignment', title: 'A7', meta: 'fmt:s7' },
    ])
  })

  it('treats a resource as a lecture node and reaches the whole chain', async () => {
    hoisted.selectQueue = [lectureRows, assignmentRows]

    await expect(
      getAllAssociatedEntities({
        entityId: 3,
        entityKind: 'resource',
        sectionId: 5,
        entityData: null,
      }),
    ).resolves.toEqual([
      { id: 2, kind: 'lecture', title: 'L2', meta: 'fmt:s2' },
      { id: 1, kind: 'lecture', title: 'L1', meta: 'fmt:s1' },
      { id: 7, kind: 'assignment', title: 'A7', meta: 'fmt:s7' },
    ])
  })

  it('resolves associations from an assignment start node', async () => {
    hoisted.selectQueue = [lectureRows, assignmentRows]

    await expect(
      getAllAssociatedEntities({
        entityId: 7,
        entityKind: 'assignment',
        sectionId: 5,
        entityData: assignmentRows[0].data,
      }),
    ).resolves.toEqual([
      { id: 2, kind: 'lecture', title: 'L2', meta: 'fmt:s2' },
      { id: 1, kind: 'lecture', title: 'L1', meta: 'fmt:s1' },
      { id: 3, kind: 'resource', title: 'R3', meta: null },
    ])
  })

  it('returns empty when the entity is not part of the section corpus', async () => {
    hoisted.selectQueue = [lectureRows, assignmentRows]

    await expect(
      getAllAssociatedEntities({
        entityId: 404,
        entityKind: 'lecture',
        sectionId: 5,
        entityData: null,
      }),
    ).resolves.toEqual([])
  })

  it('falls back to direct forward links when the entity has no section', async () => {
    hoisted.selectQueue = [
      [{ id: 5, title: 'L5', schedule: 's5', type: 'live', data: null }],
    ]

    await expect(
      getAllAssociatedEntities({
        entityId: 1,
        entityKind: 'lecture',
        sectionId: null,
        entityData: { associatedLecture: { id: 5 } },
      }),
    ).resolves.toEqual([{ id: 5, kind: 'lecture', title: 'L5', meta: 'fmt:s5' }])
  })

  it('returns empty for a section-less entity with no forward links', async () => {
    await expect(
      getAllAssociatedEntities({
        entityId: 1,
        entityKind: 'lecture',
        sectionId: null,
        entityData: null,
      }),
    ).resolves.toEqual([])
    expect(hoisted.selectQueue).toEqual([])
  })
})
