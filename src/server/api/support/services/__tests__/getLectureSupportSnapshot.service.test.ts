import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  ensureAccess: vi.fn(),
  batchId: vi.fn(),
  fetchAttendance: vi.fn(),
  resolveRecording: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: hoisted.ensureAccess,
}))

vi.mock('@/server/batches/getBatchIdsForSections', () => ({
  getBatchIdForSection: hoisted.batchId,
}))

vi.mock('@/server/attendance/services/fetchLectureAttendanceSummaries', () => ({
  fetchLectureAttendanceSummaries: hoisted.fetchAttendance,
}))

vi.mock('@/server/learn/utils/resolveLectureRecordingForSupport', () => ({
  resolveLectureRecordingForSupport: hoisted.resolveRecording,
}))

const SCHEDULE = '2020-01-01 10:00:00'
const CONCLUDES = '2020-01-01 12:00:00'

function lectureSelectRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 99,
    title: '  Live DSA  ',
    type: 'live',
    optional: 0,
    schedule: SCHEDULE,
    concludes: CONCLUDES,
    week: 2,
    module: 'Week 2',
    sectionId: 5,
    zoomLink: 'https://zoom.example/j/1',
    videos: null,
    vimeoDownloadLinks: null,
    settings: null,
    ...overrides,
  }
}

function mockDb(lectureRow: Record<string, unknown> | null) {
  hoisted.dbSelect
    .mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(lectureRow ? [lectureRow] : []),
        }),
      }),
    })
    .mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    })
}

describe('getLectureSupportSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.ensureAccess.mockResolvedValue(true)
    hoisted.batchId.mockResolvedValue(42)
    hoisted.fetchAttendance.mockResolvedValue(new Map())
    hoisted.resolveRecording.mockResolvedValue({
      recordingStatus: 'available',
      recordingUrl: 'https://cdn.example/hls.m3u8',
    })
  })

  it('maps mandatory live lecture fields after the session ends', async () => {
    const { getLectureSupportSnapshot } =
      await import('../getLectureSupportSnapshot.service')
    mockDb(lectureSelectRow())

    const snapshot = await getLectureSupportSnapshot(7, 99)

    expect(snapshot).toMatchObject({
      lectureId: 99,
      batchId: 42,
      lectureKind: 'live',
      title: 'Live DSA',
      meta: 'Week 2',
      lectureDisplayType: 'live',
      isMandatory: true,
      isOptional: false,
      livePhase: 'after',
      videoPhase: null,
      isSessionPending: false,
      showAttendance: true,
      recordingStatus: 'available',
      aiSummaryStatus: 'not_available',
    })
    expect(hoisted.fetchAttendance).toHaveBeenCalledWith(
      7,
      expect.any(Array),
      expect.any(Number),
      true,
    )
  })

  it('maps optional lectures from optional=1', async () => {
    const { getLectureSupportSnapshot } =
      await import('../getLectureSupportSnapshot.service')
    mockDb(lectureSelectRow({ optional: 1 }))

    const snapshot = await getLectureSupportSnapshot(7, 99)

    expect(snapshot.isMandatory).toBe(false)
    expect(snapshot.isOptional).toBe(true)
  })

  it('treats scrum as live kind with scrum display type', async () => {
    const { getLectureSupportSnapshot } =
      await import('../getLectureSupportSnapshot.service')
    mockDb(lectureSelectRow({ type: 'scrum' }))

    const snapshot = await getLectureSupportSnapshot(7, 99)

    expect(snapshot.lectureKind).toBe('live')
    expect(snapshot.lectureDisplayType).toBe('scrum')
  })

  it('maps video lectures with during_after phase when schedule has passed', async () => {
    const { getLectureSupportSnapshot } =
      await import('../getLectureSupportSnapshot.service')
    mockDb(
      lectureSelectRow({
        type: 'video',
        zoomLink: null,
      }),
    )

    const snapshot = await getLectureSupportSnapshot(7, 99)

    expect(snapshot).toMatchObject({
      lectureKind: 'video',
      lectureDisplayType: 'video',
      livePhase: null,
      videoPhase: 'during_after',
      joinLiveButtonState: null,
      isSessionPending: false,
      showAttendance: true,
    })
  })

  it('hides attendance while the live session is still pending', async () => {
    const { getLectureSupportSnapshot } =
      await import('../getLectureSupportSnapshot.service')
    mockDb(
      lectureSelectRow({
        schedule: '2099-06-01 10:00:00',
        concludes: '2099-06-01 12:00:00',
      }),
    )

    const snapshot = await getLectureSupportSnapshot(7, 99)

    expect(snapshot.isSessionPending).toBe(true)
    expect(snapshot.showAttendance).toBe(false)
    expect(snapshot.attendance).toBeNull()
    expect(snapshot.livePhase).toBe('before')
  })

  it('throws when the lecture is missing or unsupported', async () => {
    const { getLectureSupportSnapshot } =
      await import('../getLectureSupportSnapshot.service')
    mockDb(null)

    await expect(getLectureSupportSnapshot(7, 99)).rejects.toThrow(
      'SUPPORT_LECTURE_NOT_FOUND',
    )
  })

  it('throws when batch cannot be resolved', async () => {
    const { getLectureSupportSnapshot } =
      await import('../getLectureSupportSnapshot.service')
    mockDb(lectureSelectRow())
    hoisted.batchId.mockResolvedValue(null)

    await expect(getLectureSupportSnapshot(7, 99)).rejects.toThrow(
      'SUPPORT_LECTURE_NOT_FOUND',
    )
  })
})
