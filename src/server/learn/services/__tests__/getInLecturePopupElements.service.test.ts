import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

type MetaRow = {
  id: number
  lectureId: number
  scheduledAt: string | null
  meta: unknown
  source: 'zef' | 'lms'
  createdAt: string | null
  updatedAt: string | null
}

type ElementRow = {
  id: number
  status: 'active' | 'inactive'
  startTimestamp: string | null
  endTimestamp: string | null
}

const META_DEFAULTS = {
  id: 92,
  lectureId: 156972,
  source: 'zef' as const,
  createdAt: '2026-08-14T12:35:56Z',
  updatedAt: null,
}

/**
 * The three selects the service issues, in order: the meta row, then the quiz
 * and poll rows in parallel. Timestamps are written the way each source really
 * stamps them — `istDatetime` columns arrive `+05:30`, ZEF's JSON arrives `Z`.
 */
function mockSelects({
  metaRow,
  quizRows = [],
  pollRows = [],
}: {
  metaRow: MetaRow | null
  quizRows?: Array<ElementRow & { assessmentId: string }>
  pollRows?: Array<ElementRow & { question: string; options: unknown }>
}) {
  hoisted.dbSelect
    .mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(metaRow ? [metaRow] : []),
        }),
      }),
    })
    .mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(quizRows) }),
    })
    .mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(pollRows) }),
    })
}

const quizRow = (overrides: Partial<ElementRow> = {}) => ({
  id: 538,
  assessmentId: '6a7f065e1caa074f350b12f5',
  status: 'active' as const,
  // ZEF stores quiz windows 5h30m ahead of everything else, so 17:43:48 here is
  // the 12:13:48 the panel shows once it is pulled back onto the shared clock.
  startTimestamp: '2026-08-14T17:43:48+05:30',
  endTimestamp: '2026-08-14T17:45:02+05:30',
  ...overrides,
})

// Polls are stored on the same clock as the reference and need no correction.
const pollRow = (overrides: Partial<ElementRow> = {}) => ({
  id: 66,
  question: 'Did you understand the concept we just covered?',
  options: ['Yes, completely', 'Somewhat', 'Not really'],
  status: 'active' as const,
  startTimestamp: '2026-08-14T12:11:24+05:30',
  endTimestamp: '2026-08-14T12:12:04+05:30',
  ...overrides,
})

describe('getInLecturePopupElements', () => {
  beforeEach(() => {
    // `mockReset`, not `clearAllMocks`: the early-return cases leave unconsumed
    // `mockReturnValueOnce` entries that would shift the next test's queue.
    hoisted.dbSelect.mockReset()
  })

  it('measures offsets from meta.effectiveScheduledAt.value when ZEF has synced one', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: '2026-08-14T11:55:00+05:30',
        meta: {
          learningObjectives: [{ id: '3', text: 'test_LO_003' }],
          effectiveScheduledAt: {
            value: '2026-08-14T12:11:16.006Z',
            source: 'recording',
            syncedAt: '2026-08-14T12:36:08.028Z',
            leadingTrimSeconds: 29,
          },
        },
      },
      quizRows: [quizRow()],
      pollRows: [pollRow()],
    })

    const result = await getInLecturePopupElements(156972)

    expect(result.metaData).toEqual({
      id: 92,
      lectureId: 156972,
      scheduledAt: '2026-08-14T11:55:00+05:30',
      effectiveScheduledAt: '2026-08-14T12:11:16.006Z',
      source: 'zef',
      createdAt: '2026-08-14T12:35:56Z',
      updatedAt: null,
    })

    // 12:13:48 − 12:11:16.006 = 151.994s, not the 1128s that `scheduledAt` gives.
    expect(result.quiz).toEqual([
      {
        id: 538,
        assessmentId: '6a7f065e1caa074f350b12f5',
        status: 'active',
        startSec: 152,
        endSec: 226,
      },
    ])
    expect(result.polls[0]).toMatchObject({ id: 66, startSec: 8, endSec: 48 })
  })

  it('ignores leadingTrimSeconds — effectiveScheduledAt is already post-trim', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: '2026-08-14T11:55:00+05:30',
        meta: {
          effectiveScheduledAt: {
            value: '2026-08-14T12:11:16.006Z',
            source: 'recording',
            leadingTrimSeconds: 600,
          },
        },
      },
      quizRows: [quizRow()],
    })

    const result = await getInLecturePopupElements(156972)

    expect(result.quiz[0]?.startSec).toBe(152)
  })

  it('falls back to scheduledAt when meta has no effectiveScheduledAt', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: '2026-08-14T11:55:00+05:30',
        meta: { learningObjectives: [] },
      },
      quizRows: [quizRow()],
    })

    const result = await getInLecturePopupElements(156972)

    expect(result.metaData?.effectiveScheduledAt).toBeNull()
    // 12:13:48 − 11:55:00 = 1128s — unchanged from before the effective-origin change.
    expect(result.quiz[0]?.startSec).toBe(1128)
    expect(result.quiz[0]?.endSec).toBe(1202)
  })

  it.each([
    ['null meta', null],
    ['a non-object meta', 42],
    ['an unparseable meta string', '{not json'],
    ['a meta without the effective key', { learningObjectives: [] }],
    ['a non-object effectiveScheduledAt', { effectiveScheduledAt: 'soon' }],
    ['an effectiveScheduledAt with no value', { effectiveScheduledAt: {} }],
    [
      'an effectiveScheduledAt with a blank value',
      { effectiveScheduledAt: { value: '   ' } },
    ],
    [
      'an effectiveScheduledAt with a non-string value',
      { effectiveScheduledAt: { value: 1786000000000 } },
    ],
  ])('falls back to scheduledAt for %s', async (_label, meta) => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: '2026-08-14T11:55:00+05:30',
        meta,
      },
      quizRows: [quizRow()],
    })

    const result = await getInLecturePopupElements(156972)

    expect(result.metaData?.effectiveScheduledAt).toBeNull()
    expect(result.quiz[0]?.startSec).toBe(1128)
  })

  it('reads effectiveScheduledAt out of a JSON string meta', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: '2026-08-14T11:55:00+05:30',
        meta: JSON.stringify({
          effectiveScheduledAt: { value: '2026-08-14T12:11:16.006Z' },
        }),
      },
      quizRows: [quizRow()],
    })

    const result = await getInLecturePopupElements(156972)

    expect(result.quiz[0]?.startSec).toBe(152)
  })

  it('prefers effectiveScheduledAt even when scheduledAt is missing', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: null,
        meta: {
          effectiveScheduledAt: { value: '2026-08-14T12:11:16.006Z' },
        },
      },
      quizRows: [quizRow()],
    })

    const result = await getInLecturePopupElements(156972)

    expect(result.metaData?.scheduledAt).toBeNull()
    expect(result.quiz[0]?.startSec).toBe(152)
  })

  it('returns the meta row with no elements when neither reference is usable', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: 'not-a-date',
        meta: { effectiveScheduledAt: { value: 'also-not-a-date' } },
      },
      quizRows: [quizRow()],
      pollRows: [pollRow()],
    })

    const result = await getInLecturePopupElements(156972)

    expect(result.metaData?.id).toBe(92)
    // Reported as stored, even though it was too malformed to place elements with.
    expect(result.metaData?.effectiveScheduledAt).toBe('also-not-a-date')
    expect(result.quiz).toEqual([])
    expect(result.polls).toEqual([])
  })

  it('drops elements whose start or end timestamp is missing', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: '2026-08-14T11:55:00+05:30',
        meta: {
          effectiveScheduledAt: { value: '2026-08-14T12:11:16.006Z' },
        },
      },
      quizRows: [quizRow({ endTimestamp: null })],
      pollRows: [pollRow({ startTimestamp: null })],
    })

    const result = await getInLecturePopupElements(156972)

    expect(result.quiz).toEqual([])
    expect(result.polls).toEqual([])
  })

  // ── Storage conventions ────────────────────────────────────────────────────
  // The correction is keyed on the meta row's `source`, matching the admin
  // panel's `zefQuizTimestampTz`. Both apps must agree, or the same lecture
  // reads differently in the panel and in the player.

  it('drops a zef quiz that was not stored ahead of the shared clock', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    // A `zef` row whose quiz was stored on the shared clock rather than 5h30m
    // ahead of it. Keying on `source` corrects it anyway and lands it 5h30m low,
    // so it fails the client's `startSec < 0` check and never shows. This is the
    // known cost of deciding the convention from `source`; only normalising at
    // ingest fixes it.
    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: '2026-08-14T11:55:00+05:30',
        meta: {
          effectiveScheduledAt: { value: '2026-08-14T12:11:16.006Z' },
        },
      },
      quizRows: [
        quizRow({
          startTimestamp: '2026-08-14T12:13:48+05:30',
          endTimestamp: '2026-08-14T12:15:02+05:30',
        }),
      ],
      pollRows: [pollRow()],
    })

    const result = await getInLecturePopupElements(156972)

    expect(result.quiz[0]?.startSec).toBe(-19648)
    // The poll on the same row is untouched and lands correctly.
    expect(result.polls[0]).toMatchObject({ startSec: 8, endSec: 48 })
  })

  it('places a quiz on IST and a poll on UTC in the same lecture', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    // lecture 156981 / meta 101: a 70s recording from 12:16:43.984. Quiz 564 is
    // stored 5h30m ahead at 17:47:23; poll 72 is on the reference's clock. These
    // are the verbatim prod rows, and the offsets below are what the admin
    // panel shows for the same lecture.
    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        id: 101,
        lectureId: 156981,
        scheduledAt: '2026-08-18T12:20:00+05:30',
        meta: {
          effectiveScheduledAt: {
            value: '2026-08-18T12:16:43.984Z',
            source: 'recording',
            leadingTrimSeconds: 0,
          },
        },
      },
      quizRows: [
        quizRow({
          startTimestamp: '2026-08-18T17:47:23+05:30',
          endTimestamp: '2026-08-18T17:47:40+05:30',
        }),
      ],
      pollRows: [
        pollRow({
          startTimestamp: '2026-08-18T12:16:52+05:30',
          endTimestamp: '2026-08-18T12:17:47+05:30',
        }),
      ],
    })

    const result = await getInLecturePopupElements(156981)

    // Matches the admin panel: quiz 39/56, poll 8/63.
    expect(result.quiz[0]).toMatchObject({ startSec: 39, endSec: 56 })
    expect(result.polls[0]).toMatchObject({ startSec: 8, endSec: 63 })
  })

  it('returns empties when the lecture has no meta row', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({ metaRow: null })

    const result = await getInLecturePopupElements(999)

    expect(result).toEqual({ metaData: null, quiz: [], polls: [] })
  })
})
