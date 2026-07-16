import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  fetchAttendance: vi.fn(),
  fetchSubmissions: vi.fn(),
}))

vi.mock('@/db', () => {
  // `leftJoin` is chainable (lecture query joins users + sections; assignment
  // joins only users), so it returns itself and `where` resolves the queue.
  const chain: {
    leftJoin: () => typeof chain
    where: () => Promise<Array<Record<string, unknown>>>
  } = {
    leftJoin: () => chain,
    where: () => Promise.resolve(hoisted.selectQueue.shift() ?? []),
  }
  return {
    db: {
      select: () => ({ from: () => chain }),
    },
  }
})

vi.mock('@/db/schema', () => ({
  lectures: {},
  assignments: {},
  sections: {},
  users: {},
}))

vi.mock('@/server/attendance/services/fetchLectureAttendanceSummaries', () => ({
  fetchLectureAttendanceSummaries: hoisted.fetchAttendance,
}))

vi.mock('@/server/learn/queries/fetchLatestSubmissionByAssignment', () => ({
  fetchLatestSubmissionByAssignment: hoisted.fetchSubmissions,
}))

import { getAllAssociatedEntities } from '../getAllAssociatedEntities.service'

const NOW = 1_000_000_000_000

// Section corpus: L1 → L2 → R3 (reading) and A7 → L2, plus unrelated L9 / A8.
function lecture(id: number, type: string, associatedId: number | null) {
  return {
    id,
    title: `L${id}`,
    category: 'coding',
    type,
    optional: 0,
    schedule: null,
    concludes: null,
    sectionId: 5,
    week: 1,
    module: 'Module 1',
    hostName: 'Host',
    zoomLink: null,
    isNewZoomRedirection: 0,
    data:
      associatedId == null ? null : { associatedLecture: { id: associatedId } },
  }
}
const lectureRows = [
  lecture(1, 'video', 2),
  lecture(2, 'video', 3),
  { ...lecture(3, 'reading', null), title: 'R3' },
  lecture(9, 'video', null),
]
const assignmentRows = [
  {
    id: 7,
    title: 'A7',
    category: 'coding',
    type: 'assignment',
    optional: 0,
    schedule: null,
    concludes: null,
    week: 1,
    module: 'Module 1',
    hostName: 'Host',
    showScores: 0,
    data: { associatedLecture: [{ id: 2 }] },
  },
  {
    id: 8,
    title: 'A8',
    category: 'coding',
    type: 'assignment',
    optional: 0,
    schedule: null,
    concludes: null,
    week: 1,
    module: 'Module 1',
    hostName: 'Host',
    showScores: 0,
    data: null,
  },
]

function shape(
  items: Array<{ id: number; learningType: string; title: string }>,
) {
  return items.map((item) => ({
    id: item.id,
    learningType: item.learningType,
    title: item.title,
  }))
}

describe('getAllAssociatedEntities', () => {
  beforeEach(() => {
    hoisted.selectQueue = []
    hoisted.fetchAttendance.mockReset().mockResolvedValue(new Map())
    hoisted.fetchSubmissions.mockReset().mockResolvedValue(new Map())
  })

  it('returns the transitive closure for a lecture as full learning items', async () => {
    hoisted.selectQueue = [lectureRows, assignmentRows]

    const result = await getAllAssociatedEntities({
      entityId: 1,
      entityKind: 'lecture',
      sectionId: 5,
      entityData: lectureRows[0].data,
      userId: 42,
      nowMs: NOW,
    })

    expect(shape(result)).toEqual([
      { id: 2, learningType: 'lecture', title: 'L2' },
      { id: 3, learningType: 'resource', title: 'R3' },
      { id: 7, learningType: 'assignment', title: 'A7' },
    ])
    // full card DTO, not the old minimal shape
    expect(result[0]).toMatchObject({
      hostName: 'Host',
      moduleName: 'Module 1',
    })
    expect(result[0].listingCtas).toBeDefined()
  })

  it('reaches the whole chain both ways from a resource', async () => {
    hoisted.selectQueue = [lectureRows, assignmentRows]

    const result = await getAllAssociatedEntities({
      entityId: 3,
      entityKind: 'resource',
      sectionId: 5,
      entityData: null,
      userId: 42,
      nowMs: NOW,
    })

    expect(shape(result)).toEqual([
      { id: 2, learningType: 'lecture', title: 'L2' },
      { id: 1, learningType: 'lecture', title: 'L1' },
      { id: 7, learningType: 'assignment', title: 'A7' },
    ])
  })

  it('resolves associations from an assignment start node', async () => {
    hoisted.selectQueue = [lectureRows, assignmentRows]

    const result = await getAllAssociatedEntities({
      entityId: 7,
      entityKind: 'assignment',
      sectionId: 5,
      entityData: assignmentRows[0].data,
      userId: 42,
      nowMs: NOW,
    })

    expect(shape(result)).toEqual([
      { id: 2, learningType: 'lecture', title: 'L2' },
      { id: 1, learningType: 'lecture', title: 'L1' },
      { id: 3, learningType: 'resource', title: 'R3' },
    ])
  })

  it('returns empty when the entity is not part of the section corpus', async () => {
    hoisted.selectQueue = [lectureRows, assignmentRows]

    const result = await getAllAssociatedEntities({
      entityId: 404,
      entityKind: 'lecture',
      sectionId: 5,
      entityData: null,
      userId: 42,
      nowMs: NOW,
    })

    expect(result).toEqual([])
  })

  it('falls back to direct forward links when the entity has no section', async () => {
    hoisted.selectQueue = [[lecture(5, 'video', null)]]

    const result = await getAllAssociatedEntities({
      entityId: 1,
      entityKind: 'lecture',
      sectionId: null,
      entityData: { associatedLecture: { id: 5 } },
      userId: 42,
      nowMs: NOW,
    })

    expect(shape(result)).toEqual([
      { id: 5, learningType: 'lecture', title: 'L5' },
    ])
  })

  it('returns empty for a section-less entity with no forward links', async () => {
    const result = await getAllAssociatedEntities({
      entityId: 1,
      entityKind: 'lecture',
      sectionId: null,
      entityData: null,
      userId: 42,
      nowMs: NOW,
    })

    expect(result).toEqual([])
    expect(hoisted.selectQueue).toEqual([])
    expect(hoisted.fetchAttendance).not.toHaveBeenCalled()
  })
})
