import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(hoisted.selectQueue.shift() ?? []),
        }),
      }),
    }),
  },
}))

vi.mock('@/db/schema', () => ({
  lectures: {},
}))

vi.mock('@/server/learn/utils/resolveLectureLearningType', () => ({
  LECTURE_RESOURCE_TYPE: 'reading',
}))

async function importDiagnostics() {
  return import('../notesPreviewDiagnostics')
}

describe('notesPreviewDiagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('warnLectureRowNotMatched', () => {
    it('logs no_row when the lecture id does not exist', async () => {
      hoisted.selectQueue = [[]]
      const { warnLectureRowNotMatched } = await importDiagnostics()

      await warnLectureRowNotMatched(7, 999)

      expect(console.warn).toHaveBeenCalledWith(
        '[notes-preview] lecture row not matched',
        expect.objectContaining({
          userId: 7,
          lectureId: 999,
          probe: null,
          reason: 'no_row',
        }),
      )
    })

    it('logs soft_deleted when deletedAt is set', async () => {
      hoisted.selectQueue = [
        [
          {
            id: 42,
            type: 'live',
            sectionId: 2,
            deletedAt: new Date('2026-01-01'),
          },
        ],
      ]
      const { warnLectureRowNotMatched } = await importDiagnostics()

      await warnLectureRowNotMatched(7, 42)

      expect(console.warn).toHaveBeenCalledWith(
        '[notes-preview] lecture row not matched',
        expect.objectContaining({ reason: 'soft_deleted' }),
      )
    })

    it('logs is_reading_resource_use_category_resource for reading type', async () => {
      hoisted.selectQueue = [
        [{ id: 42, type: 'reading', sectionId: 2, deletedAt: null }],
      ]
      const { warnLectureRowNotMatched } = await importDiagnostics()

      await warnLectureRowNotMatched(7, 42)

      expect(console.warn).toHaveBeenCalledWith(
        '[notes-preview] lecture row not matched',
        expect.objectContaining({
          reason: 'is_reading_resource_use_category_resource',
        }),
      )
    })

    it('logs unknown when the row exists but still failed the filter', async () => {
      hoisted.selectQueue = [
        [{ id: 42, type: 'live', sectionId: 2, deletedAt: null }],
      ]
      const { warnLectureRowNotMatched } = await importDiagnostics()

      await warnLectureRowNotMatched(7, 42)

      expect(console.warn).toHaveBeenCalledWith(
        '[notes-preview] lecture row not matched',
        expect.objectContaining({ reason: 'unknown' }),
      )
    })
  })

  describe('warnResourceRowNotMatched', () => {
    it('logs no_row when the resource id does not exist', async () => {
      hoisted.selectQueue = [[]]
      const { warnResourceRowNotMatched } = await importDiagnostics()

      await warnResourceRowNotMatched(7, 999)

      expect(console.warn).toHaveBeenCalledWith(
        '[notes-preview] resource row not matched',
        expect.objectContaining({
          userId: 7,
          resourceId: 999,
          probe: null,
          reason: 'no_row',
        }),
      )
    })

    it('logs soft_deleted when deletedAt is set', async () => {
      hoisted.selectQueue = [
        [
          {
            id: 515,
            type: 'reading',
            sectionId: 3,
            deletedAt: new Date('2026-01-01'),
          },
        ],
      ]
      const { warnResourceRowNotMatched } = await importDiagnostics()

      await warnResourceRowNotMatched(7, 515)

      expect(console.warn).toHaveBeenCalledWith(
        '[notes-preview] resource row not matched',
        expect.objectContaining({ reason: 'soft_deleted' }),
      )
    })

    it('logs wrong_type_use_category_lecture when type is not reading', async () => {
      hoisted.selectQueue = [
        [{ id: 515, type: 'live', sectionId: 3, deletedAt: null }],
      ]
      const { warnResourceRowNotMatched } = await importDiagnostics()

      await warnResourceRowNotMatched(7, 515)

      expect(console.warn).toHaveBeenCalledWith(
        '[notes-preview] resource row not matched',
        expect.objectContaining({ reason: 'wrong_type_use_category_lecture' }),
      )
    })

    it('logs unknown when the row is reading and not deleted', async () => {
      hoisted.selectQueue = [
        [{ id: 515, type: 'reading', sectionId: 3, deletedAt: null }],
      ]
      const { warnResourceRowNotMatched } = await importDiagnostics()

      await warnResourceRowNotMatched(7, 515)

      expect(console.warn).toHaveBeenCalledWith(
        '[notes-preview] resource row not matched',
        expect.objectContaining({ reason: 'unknown' }),
      )
    })
  })
})
