import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  ensureAccess: vi.fn(),
  listDiscussions: vi.fn(),
  associatedContent: vi.fn(),
  videoAttendance: vi.fn(),
  fetchAttendance: vi.fn(),
  bookmarkState: vi.fn(),
  feedbackRecord: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/server/restrictions/getUserBatchRestrictions', () => ({
  getUserBatchRestrictions: vi.fn(async () => new Map()),
}))
vi.mock('@/server/batches/getBatchIdsForSections', () => ({
  getBatchIdForSection: vi.fn(async () => null),
  getBatchIdsForSections: vi.fn(async () => new Map()),
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: hoisted.ensureAccess,
}))

vi.mock(
  '@/server/new-discussions/services/listDiscussionsWithThreadsForLearnEntity',
  () => ({
    listDiscussionsWithThreadsForLearnEntity: hoisted.listDiscussions,
  }),
)

vi.mock('@/server/learn/services/getAllAssociatedEntities.service', () => ({
  getAllAssociatedEntities: hoisted.associatedContent,
}))

vi.mock('@/server/learn/utils/buildLectureVideoAttendanceState', () => ({
  buildLectureVideoAttendanceState: hoisted.videoAttendance,
}))

vi.mock('@/server/attendance/services/fetchLectureAttendanceSummaries', () => ({
  fetchLectureAttendanceSummaries: hoisted.fetchAttendance,
}))

vi.mock('@/server/learn/services/learnEntityBookmark.service', () => ({
  getLearnEntityBookmarkState: hoisted.bookmarkState,
}))

vi.mock('@/server/learn/services/lectureFeedback.service', () => ({
  getLectureFeedbackRecord: hoisted.feedbackRecord,
}))

describe('getLectureLearningDetailForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.ensureAccess.mockResolvedValue(true)
    hoisted.listDiscussions.mockResolvedValue([])
    hoisted.associatedContent.mockResolvedValue([])
    hoisted.videoAttendance.mockResolvedValue(null)
    hoisted.fetchAttendance.mockResolvedValue(new Map())
    hoisted.bookmarkState.mockResolvedValue(false)
    hoisted.feedbackRecord.mockResolvedValue({
      mode: 'legacy',
      rating: null,
      text: null,
      tags: [],
    })
  })

  it('returns lecture detail payload for supported live lectures', async () => {
    const { getLectureLearningDetailForUser } =
      await import('../services/getLectureLearningDetail.service')

    hoisted.dbSelect
      .mockReturnValueOnce({
        from: () => ({
          leftJoin: () => ({
            leftJoin: () => ({
              where: () => ({
                limit: () =>
                  Promise.resolve([
                    {
                      id: 227,
                      title: 'Live DSA',
                      category: 'coding',
                      type: 'live',
                      optional: 0,
                      schedule: '2020-01-01 10:00:00',
                      concludes: '2020-01-01 12:00:00',
                      week: 1,
                      module: null,
                      batchId: 1,
                      sectionId: 2,
                      hostName: 'Ravi',
                      hostAvatarUrl: null,
                      zoomLink: null,
                      videos: null,
                      vimeoDownloadLinks: null,
                      vimeoPlayerEmbedUrl: null,
                      settings: { hide_notes: 0 },
                      notes: '# Session notes',
                      isNewZoomRedirection: 1,
                      sectionSettings: { enableZoomWebView: true },
                      data: null,
                    },
                  ]),
              }),
            }),
          }),
        }),
      })
      // lecturesAi select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      })
      // lectureZoomChat select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      })
      // zef_lms_meta_data select (getInLecturePopupElements) — no meta row
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      })

    const result = await getLectureLearningDetailForUser(9, 227)

    expect(result.id).toBe(227)
    expect(result.notes).toBe('# Session notes')
    expect(result.tabs.notes).toBe('# Session notes')
    expect(result.hideNotes).toBe(false)
    expect(result.lectureKind).toBe('live')
    expect(result.livePhase).toBe('after')
    expect(result.discussions).toEqual([])
    expect(result.attendance).toBeNull()
    expect(result.isBookmarked).toBe(false)
    expect(result.aiChatSuggestions).toEqual([
      {
        kind: 'summary',
        question: 'Summarize the key points of this lecture',
      },
      {
        kind: 'explain',
        question: 'What are the core concepts I should understand?',
      },
      {
        kind: 'quiz',
        question: 'Quiz me on this lecture',
      },
    ])
    expect(result.isNewZoomRedirection).toBe(true)
    expect(result.enableZoomWebView).toBe(true)
    expect(hoisted.bookmarkState).toHaveBeenCalledWith(9, 'lecture', 227)
    // No attendance row for this lecture (empty map) -> attended: false,
    // reusing the same summary the "Present" badge reads instead of a
    // second independent `student_attendances` query.
    expect(hoisted.feedbackRecord).toHaveBeenCalledWith(9, 227, false)
    // No lectures_ai row → nothing to fetch.
    expect(result.tabs.transcript).toEqual({ available: false, url: null })
  })

  it('passes attended: true through to the feedback record when the attendance summary is present', async () => {
    const { getLectureLearningDetailForUser } =
      await import('../services/getLectureLearningDetail.service')

    hoisted.fetchAttendance.mockResolvedValue(
      new Map([[227, { overallStatus: 1 }]]),
    )
    hoisted.dbSelect
      .mockReturnValueOnce({
        from: () => ({
          leftJoin: () => ({
            leftJoin: () => ({
              where: () => ({
                limit: () =>
                  Promise.resolve([
                    {
                      id: 227,
                      title: 'Live DSA',
                      category: 'coding',
                      type: 'live',
                      optional: 0,
                      schedule: '2020-01-01 10:00:00',
                      concludes: '2020-01-01 12:00:00',
                      week: 1,
                      module: null,
                      batchId: 1,
                      sectionId: 2,
                      hostName: 'Ravi',
                      hostAvatarUrl: null,
                      zoomLink: null,
                      videos: null,
                      vimeoDownloadLinks: null,
                      vimeoPlayerEmbedUrl: null,
                      settings: { hide_notes: 0 },
                      notes: '# Session notes',
                      isNewZoomRedirection: 1,
                      sectionSettings: { enableZoomWebView: true },
                      data: null,
                    },
                  ]),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
      })
      .mockReturnValueOnce({
        from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
      })
      // zef_lms_meta_data select (getInLecturePopupElements) — no meta row
      .mockReturnValueOnce({
        from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
      })

    await getLectureLearningDetailForUser(9, 227)

    expect(hoisted.feedbackRecord).toHaveBeenCalledWith(9, 227, true)
  })

  it('exposes the transcript as a cache URL, never as text (#353)', async () => {
    const { getLectureLearningDetailForUser } =
      await import('../services/getLectureLearningDetail.service')

    hoisted.dbSelect
      .mockReturnValueOnce({
        from: () => ({
          leftJoin: () => ({
            leftJoin: () => ({
              where: () => ({
                limit: () =>
                  Promise.resolve([
                    {
                      id: 227,
                      title: 'Live DSA',
                      category: 'coding',
                      type: 'live',
                      optional: 0,
                      schedule: '2020-01-01 10:00:00',
                      concludes: '2020-01-01 12:00:00',
                      week: 1,
                      module: null,
                      batchId: 1,
                      sectionId: 2,
                      hostName: 'Ravi',
                      hostAvatarUrl: null,
                      zoomLink: null,
                      videos: null,
                      vimeoDownloadLinks: null,
                      vimeoPlayerEmbedUrl: null,
                      settings: { hide_notes: 0 },
                      notes: null,
                      isNewZoomRedirection: 0,
                      sectionSettings: null,
                      data: null,
                    },
                  ]),
              }),
            }),
          }),
        }),
      })
      // lecturesAi select — MySQL returns the existence probe as 0/1, and the
      // transcript columns are deliberately absent from the projection.
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  summary: 'Key points',
                  faqs: [{ question: 'What is X?', answer: 'X is Y.' }],
                  hasTranscript: 1,
                },
              ]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({ limit: () => Promise.resolve([]) }),
        }),
      })
      // zef_lms_meta_data select (getInLecturePopupElements) — no meta row
      .mockReturnValueOnce({
        from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
      })

    const result = await getLectureLearningDetailForUser(9, 227)

    expect(result.tabs.aiSummary).toBe('Key points')
    expect(result.tabs.transcript).toEqual({
      available: true,
      url: '/api/cache/transcript/1/2/227',
    })
    expect(result.aiChatSuggestions[0]).toEqual({
      kind: 'faq',
      question: 'What is X?',
    })
    expect(result.aiChatSuggestions.slice(-3)).toEqual([
      {
        kind: 'summary',
        question: 'Summarize the key points of this lecture',
      },
      {
        kind: 'explain',
        question: 'What are the core concepts I should understand?',
      },
      {
        kind: 'quiz',
        question: 'Quiz me on this lecture',
      },
    ])
  })

  it('throws when lecture type is unsupported', async () => {
    const { getLectureLearningDetailForUser } =
      await import('../services/getLectureLearningDetail.service')

    hoisted.dbSelect.mockReturnValue({
      from: () => ({
        leftJoin: () => ({
          leftJoin: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    id: 1,
                    title: 'Unknown type',
                    category: 'coding',
                    type: 'unknown',
                    optional: 0,
                    schedule: null,
                    concludes: null,
                    week: 1,
                    module: null,
                    batchId: 1,
                    sectionId: 2,
                    hostName: 'Ravi',
                    hostAvatarUrl: null,
                    zoomLink: null,
                    videos: null,
                    vimeoDownloadLinks: null,
                    vimeoPlayerEmbedUrl: null,
                    settings: null,
                    notes: null,
                    data: null,
                  },
                ]),
            }),
          }),
        }),
      }),
    })

    await expect(getLectureLearningDetailForUser(9, 1)).rejects.toThrow(
      'LEARN_DETAIL_NOT_FOUND',
    )
  })
})
