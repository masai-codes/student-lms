import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getLectureSupportSnapshot: vi.fn(),
}))

vi.mock(
  '@/server/api/support/services/getLectureSupportSnapshot.service',
  () => ({
    getLectureSupportSnapshot: hoisted.getLectureSupportSnapshot,
  }),
)

vi.mock('@/db', () => ({
  db: { select: vi.fn() },
}))

vi.mock('@/server/batches/getBatchIdsForSections', () => ({
  getBatchIdForSection: vi.fn(),
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: vi.fn(),
}))

import { getBatchIdForSection } from '@/server/batches/getBatchIdsForSections'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { getSupportEntityContext } from '@/server/api/support/services/getSupportEntityContext.service'
import type { LectureSupportSnapshot } from '@/server/api/support/support.types'

function makeLectureSnapshot(
  overrides: Partial<LectureSupportSnapshot> = {},
): LectureSupportSnapshot {
  return {
    lectureId: 7,
    batchId: 42,
    title: 'Intro to JS',
    meta: 'Module A',
    date: '15 Jan, 03:30 pm',
    lectureDisplayType: 'live',
    lectureKind: 'live',
    schedule: '2026-01-15T10:00:00.000Z',
    isMandatory: true,
    isOptional: false,
    livePhase: 'after',
    videoPhase: null,
    joinLiveButtonState: 'hidden',
    isSessionPending: false,
    recordingStatus: 'available',
    recordingUrl: 'https://cdn.example/hls.m3u8',
    aiSummaryStatus: 'generated',
    attendance: null,
    showAttendance: true,
    ...overrides,
  }
}

describe('getSupportEntityContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensureUserCanAccessLearnHubEntity).mockResolvedValue(true)
    vi.mocked(getBatchIdForSection).mockResolvedValue(42)
  })

  it('returns batch + item + lecture snapshot from the shared snapshot service', async () => {
    const snapshot = makeLectureSnapshot()
    hoisted.getLectureSupportSnapshot.mockResolvedValue(snapshot)

    const result = await getSupportEntityContext(1, 'lecture', 7)

    expect(hoisted.getLectureSupportSnapshot).toHaveBeenCalledWith(1, 7)
    expect(result).toMatchObject({
      batchId: 42,
      category: 'lecture',
      item: {
        id: 7,
        title: 'Intro to JS',
        meta: 'Module A',
        type: 'live',
      },
      lectureSnapshot: snapshot,
    })
  })

  it('preserves scrum display type from the snapshot', async () => {
    const snapshot = makeLectureSnapshot({
      lectureDisplayType: 'scrum',
      lectureKind: 'live',
    })
    hoisted.getLectureSupportSnapshot.mockResolvedValue(snapshot)

    const result = await getSupportEntityContext(1, 'lecture', 7)

    expect(result.item.type).toBe('scrum')
    expect(result.lectureSnapshot?.lectureDisplayType).toBe('scrum')
  })

  it('rejects unknown categories', async () => {
    await expect(getSupportEntityContext(1, 'general', 1)).rejects.toThrow(
      'SUPPORT_INVALID_ENTITY_CATEGORY',
    )
  })
})
