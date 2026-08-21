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

type SqlSandboxRow = {
  id: number
  query: string
  status: 'pending' | 'success' | 'error'
  error: string | null
  executedAt: string | null
}

function isPlaygroundEnabled(zoomDetails: unknown): boolean {
  return (
    typeof zoomDetails === 'object' &&
    zoomDetails !== null &&
    (zoomDetails as Record<string, unknown>).enableSqlPlayground === true
  )
}

/**
 * The selects the service issues, in order: the meta row, then
 * `lectures.zoom_details` (whenever a meta row exists), then the SQL sandbox
 * rows (only when `zoomDetails.enableSqlPlayground` is true), then the quiz
 * and poll rows in parallel (skipped when there's no usable reference to
 * place them against). Timestamps are written the way each source really
 * stamps them — `istDatetime` columns arrive `+05:30`, ZEF's JSON arrives `Z`.
 */
function mockSelects({
  metaRow,
  zoomDetails = null,
  sqlSandboxRows = [],
  quizRows = [],
  pollRows = [],
  submissionRows = [],
  pollSubmissionRows = [],
}: {
  metaRow: MetaRow | null
  zoomDetails?: unknown
  sqlSandboxRows?: Array<SqlSandboxRow>
  quizRows?: Array<ElementRow & { assessmentId: string }>
  pollRows?: Array<ElementRow & { question: string; options: unknown }>
  submissionRows?: Array<{
    zefLmsQuizId: number
    evaluatedAt: string | null
    createdAt: string | null
  }>
  pollSubmissionRows?: Array<{
    zefLmsPollsQuestionsId: number
    submittedAt: string | null
    createdAt: string | null
  }>
}) {
  let chain = hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(metaRow ? [metaRow] : []),
      }),
    }),
  })

  if (!metaRow) return

  chain = chain.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([{ zoomDetails }]),
      }),
    }),
  })

  if (isPlaygroundEnabled(zoomDetails)) {
    chain = chain.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(sqlSandboxRows) }),
    })
  }

  chain = chain
    .mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(quizRows) }),
    })
    .mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(pollRows) }),
    })

  // The service only queries submissions when there are ids to match against
  // — mirrors the `quizIds.length` / `pollIds.length` guards in the service
  // itself. Quiz submissions are dispatched before poll submissions (same
  // `Promise.all` array order as the service).
  if (quizRows.length > 0) {
    chain = chain.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve(submissionRows),
      }),
    })
  }
  if (pollRows.length > 0) {
    chain.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve(pollSubmissionRows),
      }),
    })
  }
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

const DEFAULT_META_DATA_EXTRAS = {
  enableSqlPlayground: false,
  editorType: 'sqlite' as const,
  sqlTemplateFile: null,
}

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

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.metaData).toEqual({
      id: 92,
      lectureId: 156972,
      scheduledAt: '2026-08-14T11:55:00+05:30',
      effectiveScheduledAt: '2026-08-14T12:11:16.006Z',
      source: 'zef',
      createdAt: '2026-08-14T12:35:56Z',
      updatedAt: null,
      ...DEFAULT_META_DATA_EXTRAS,
    })

    // 12:13:48 − 12:11:16.006 = 151.994s, not the 1128s that `scheduledAt` gives.
    expect(result.quiz).toEqual([
      {
        id: 538,
        assessmentId: '6a7f065e1caa074f350b12f5',
        status: 'active',
        startSec: 152,
        endSec: 226,
        submittedAt: null,
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

    const result = await getInLecturePopupElements(156972, 501)

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

    const result = await getInLecturePopupElements(156972, 501)

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

    const result = await getInLecturePopupElements(156972, 501)

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

    const result = await getInLecturePopupElements(156972, 501)

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

    const result = await getInLecturePopupElements(156972, 501)

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

    const result = await getInLecturePopupElements(156972, 501)

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

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.quiz).toEqual([])
    expect(result.polls).toEqual([])
  })

  // ── Attempted assessments (zef_lms_quiz_submission) ───────────────────────

  it("attaches the current user's submittedAt to a quiz they already submitted", async () => {
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
      quizRows: [quizRow()],
      submissionRows: [
        {
          zefLmsQuizId: 538,
          evaluatedAt: '2026-08-14T12:20:00Z',
          createdAt: '2026-08-14T12:18:00Z',
        },
      ],
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.quiz[0]?.submittedAt).toBe('2026-08-14T12:20:00Z')
  })

  it('falls back to createdAt when a submission has no evaluatedAt yet', async () => {
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
      quizRows: [quizRow()],
      submissionRows: [
        {
          zefLmsQuizId: 538,
          evaluatedAt: null,
          createdAt: '2026-08-14T12:18:00Z',
        },
      ],
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.quiz[0]?.submittedAt).toBe('2026-08-14T12:18:00Z')
  })

  it('leaves submittedAt null for a quiz the user has not submitted, and skips the quiz-submissions query when there are no quizzes', async () => {
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
      quizRows: [],
      pollRows: [pollRow()],
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.quiz).toEqual([])
    expect(result.polls[0]?.submittedAt).toBeNull()
    // meta, zoom_details, quiz, poll, poll-submissions — no quiz-submissions
    // call since there were no quiz ids.
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(5)
  })

  it("attaches the current user's submittedAt to a poll they already responded to", async () => {
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
      pollRows: [pollRow()],
      pollSubmissionRows: [
        {
          zefLmsPollsQuestionsId: 66,
          submittedAt: '2026-08-14T12:15:00Z',
          createdAt: '2026-08-14T12:14:30Z',
        },
      ],
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.polls[0]?.submittedAt).toBe('2026-08-14T12:15:00Z')
  })

  it('leaves submittedAt null for polls with no quizzes present, and skips both submissions queries when neither exists', async () => {
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
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.quiz).toEqual([])
    expect(result.polls).toEqual([])
    // meta, zoom_details, quiz, poll — no submissions calls at all.
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(4)
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

    const result = await getInLecturePopupElements(156972, 501)

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

    const result = await getInLecturePopupElements(156981, 501)

    // Matches the admin panel: quiz 39/56, poll 8/63.
    expect(result.quiz[0]).toMatchObject({ startSec: 39, endSec: 56 })
    expect(result.polls[0]).toMatchObject({ startSec: 8, endSec: 63 })
  })

  it('returns empties when the lecture has no meta row', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({ metaRow: null })

    const result = await getInLecturePopupElements(999, 501)

    expect(result).toEqual({
      metaData: null,
      quiz: [],
      polls: [],
      sqlSandbox: [],
    })
  })

  // ── SQL playground config (lectures.zoom_details) ─────────────────────────
  // `enableSqlPlayground` / `editorType` / `sqlTemplateFile` come from the
  // lecture's own `zoom_details` JSON column, not the ZEF `meta` blob above —
  // a separate query, independent of the quiz/poll timing reference.

  it('reads an enabled sqlite playground config from zoom_details, unwindowed by referenceMs', async () => {
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
      zoomDetails: {
        editorType: 'sqlite',
        redirectionType: 'ivs',
        sqlTemplateFile: {
          url: 'https://coding-platform.s3.amazonaws.com/zef-sql-template-files/I2h31lXpWvPluGzT.sql',
          status: 'UPLOADED',
        },
        enableSqlPlayground: true,
      },
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.metaData).toMatchObject({
      enableSqlPlayground: true,
      editorType: 'sqlite',
      sqlTemplateFile: {
        url: 'https://coding-platform.s3.amazonaws.com/zef-sql-template-files/I2h31lXpWvPluGzT.sql',
        status: 'UPLOADED',
      },
    })
  })

  it('reads an enabled postgres playground config from zoom_details', async () => {
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
      zoomDetails: {
        editorType: 'postgres',
        sqlTemplateFile: {
          url: 'https://cdn.example.com/seed.sql',
          status: 'UPLOADED',
        },
        enableSqlPlayground: true,
      },
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.metaData?.editorType).toBe('postgres')
  })

  it.each([
    [
      'the flag is off',
      {
        enableSqlPlayground: false,
        sqlTemplateFile: {
          url: 'https://cdn.example.com/seed.sql',
          status: 'UPLOADED',
        },
      },
    ],
    ['there is no template file', { enableSqlPlayground: true }],
    [
      'the template url is not http(s)',
      {
        enableSqlPlayground: true,
        sqlTemplateFile: {
          url: 'ftp://cdn.example.com/seed.sql',
          status: 'UPLOADED',
        },
      },
    ],
    [
      'the template file has no url',
      { enableSqlPlayground: true, sqlTemplateFile: { status: 'UPLOADED' } },
    ],
    ['zoom_details is not an object', undefined],
  ])('handles %s', async (_label, zoomDetails) => {
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
      zoomDetails,
    })

    const result = await getInLecturePopupElements(156972, 501)

    if (
      typeof zoomDetails === 'object' &&
      zoomDetails !== null &&
      (zoomDetails as Record<string, unknown>).enableSqlPlayground === true
    ) {
      expect(result.metaData?.enableSqlPlayground).toBe(true)
    } else {
      expect(result.metaData?.enableSqlPlayground).toBe(false)
    }
    if (
      !(zoomDetails as { sqlTemplateFile?: { url?: string } })?.sqlTemplateFile
        ?.url
    ) {
      expect(result.metaData?.sqlTemplateFile).toBeNull()
    }
  })

  it('defaults editorType to sqlite when zoom_details omits it', async () => {
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
      zoomDetails: {
        enableSqlPlayground: true,
        sqlTemplateFile: {
          url: 'https://cdn.example.com/seed.sql',
          status: 'UPLOADED',
        },
      },
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.metaData?.editorType).toBe('sqlite')
  })

  it('drops an invalid template url even though the file object is otherwise well-formed', async () => {
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
      zoomDetails: {
        enableSqlPlayground: true,
        sqlTemplateFile: { url: 42, status: 'UPLOADED' },
      },
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.metaData?.sqlTemplateFile).toBeNull()
    // The flag itself is untouched by a malformed file — the tab still shows,
    // just with the "not configured" empty state client-side.
    expect(result.metaData?.enableSqlPlayground).toBe(true)
  })

  // ── sqlSandbox gating on enableSqlPlayground ──────────────────────────────

  it('returns sqlSandbox rows when the playground is enabled, unwindowed by video timing', async () => {
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
      zoomDetails: {
        enableSqlPlayground: true,
        editorType: 'sqlite',
        sqlTemplateFile: {
          url: 'https://cdn.example.com/seed.sql',
          status: 'UPLOADED',
        },
      },
      sqlSandboxRows: [
        {
          id: 7,
          query: 'SELECT * FROM students LIMIT 10;',
          status: 'success',
          error: null,
          // `executed_at` is a plain TIMESTAMP column, stamped real UTC (unlike
          // the `istDatetime` quiz/poll windows).
          executedAt: '2026-08-14T12:14:00Z',
        },
      ],
    })

    const result = await getInLecturePopupElements(156972, 501)

    // 12:14:00 − 12:11:16.006 = 163.994s, rounded to 164 — same digit-for-digit
    // conversion as the poll windows (`istStored: false`).
    expect(result.sqlSandbox).toEqual([
      {
        id: 7,
        query: 'SELECT * FROM students LIMIT 10;',
        status: 'success',
        error: null,
        executedAtSec: 164,
      },
    ])
  })

  it('returns an empty sqlSandbox and skips the query entirely when the playground is disabled', async () => {
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
      zoomDetails: { enableSqlPlayground: false },
      quizRows: [quizRow()],
      pollRows: [pollRow()],
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.sqlSandbox).toEqual([])
    // 6 selects issued: meta, zoom_details, quiz, poll, quiz-submissions,
    // poll-submissions — no sqlSandbox call.
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(6)
  })

  it('returns executedAtSec: null for a pending sandbox row with no executedAt', async () => {
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
      zoomDetails: {
        enableSqlPlayground: true,
        sqlTemplateFile: {
          url: 'https://cdn.example.com/seed.sql',
          status: 'UPLOADED',
        },
      },
      sqlSandboxRows: [
        {
          id: 8,
          query: 'SELECT 1;',
          status: 'pending',
          error: null,
          executedAt: null,
        },
      ],
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.sqlSandbox).toEqual([
      {
        id: 8,
        query: 'SELECT 1;',
        status: 'pending',
        error: null,
        executedAtSec: null,
      },
    ])
  })

  it('returns sqlSandbox rows with executedAtSec: null when no reference is usable', async () => {
    const { getInLecturePopupElements } =
      await import('../getInLecturePopupElements.service')

    mockSelects({
      metaRow: {
        ...META_DEFAULTS,
        scheduledAt: 'not-a-date',
        meta: { effectiveScheduledAt: { value: 'also-not-a-date' } },
      },
      zoomDetails: {
        enableSqlPlayground: true,
        sqlTemplateFile: {
          url: 'https://cdn.example.com/seed.sql',
          status: 'UPLOADED',
        },
      },
      sqlSandboxRows: [
        {
          id: 9,
          query: 'SELECT 2;',
          status: 'success',
          error: null,
          executedAt: '2026-08-14T12:14:00Z',
        },
      ],
    })

    const result = await getInLecturePopupElements(156972, 501)

    expect(result.sqlSandbox).toEqual([
      {
        id: 9,
        query: 'SELECT 2;',
        status: 'success',
        error: null,
        executedAtSec: null,
      },
    ])
  })
})
