import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ScheduleEntityRow } from '../../schedule/scheduleTypes'

const hoisted = vi.hoisted(() => ({
  getSectionIds: vi.fn(),
  getBatchIds: vi.fn(),
  getCutoff: vi.fn(),
  fetchAssignments: vi.fn(),
  fetchLectures: vi.fn(),
  fetchStartState: vi.fn(),
  fetchSubmissions: vi.fn(),
  fetchAttendance: vi.fn(),
}))

vi.mock('@/server/batches/getSectionIdsForUser', () => ({ getSectionIdsForUser: hoisted.getSectionIds }))
vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({ getBatchIdsForEnrolledUser: hoisted.getBatchIds }))
vi.mock('@/server/users/getBannedContentCutoffForUser', () => ({ getBannedContentCutoffForUser: hoisted.getCutoff }))
vi.mock('../fetchPendingAssignments', () => ({ fetchPendingAssignments: hoisted.fetchAssignments }))
vi.mock('../fetchPendingLectures', () => ({ fetchPendingLectures: hoisted.fetchLectures }))
vi.mock('../fetchAssignmentStartState', () => ({ fetchAssignmentStartState: hoisted.fetchStartState }))
vi.mock('@/server/learn/queries/fetchLatestSubmissionByAssignment', () => ({
  fetchLatestSubmissionByAssignment: hoisted.fetchSubmissions,
}))
vi.mock('@/server/attendance/services/fetchLectureAttendanceSummaries', () => ({
  fetchLectureAttendanceSummaries: hoisted.fetchAttendance,
}))

const NOW = new Date('2026-07-02T06:30:00Z')

const row = (over: Partial<ScheduleEntityRow> = {}): ScheduleEntityRow => ({
  id: 1,
  title: 'Task',
  category: 'IIM-M DM',
  type: 'assignment',
  optional: 0,
  schedule: '2026-07-01 09:00:00',
  concludes: '2026-07-05 09:00:00',
  sectionId: 5,
  week: 1,
  module: null,
  hostName: 'Prof. A',
  zoomLink: null,
  sectionName: 'Full Stack',
  batchName: 'FS Batch',
  sectionSettings: {},
  ...over,
})

describe('getDashboardPendingTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getSectionIds.mockResolvedValue([5])
    hoisted.getBatchIds.mockResolvedValue([1])
    hoisted.getCutoff.mockResolvedValue(null)
    hoisted.fetchAssignments.mockResolvedValue([])
    hoisted.fetchLectures.mockResolvedValue([])
    hoisted.fetchStartState.mockResolvedValue(new Set())
    hoisted.fetchSubmissions.mockResolvedValue(new Map())
    hoisted.fetchAttendance.mockResolvedValue(new Map())
  })

  it('returns [] without querying when the user has no sections', async () => {
    hoisted.getSectionIds.mockResolvedValue([])
    const { getDashboardPendingTasks } = await import('../getDashboardPendingTasks.service')
    expect(await getDashboardPendingTasks(42, NOW)).toEqual([])
    expect(hoisted.fetchAssignments).not.toHaveBeenCalled()
  })

  it('keeps only not-begun assignments', async () => {
    hoisted.fetchAssignments.mockResolvedValue([
      row({ id: 1, type: 'assignment' }),
      row({ id: 2, type: 'assignment' }),
    ])
    hoisted.fetchStartState.mockResolvedValue(new Set([2])) // 2 begun → excluded
    const { getDashboardPendingTasks } = await import('../getDashboardPendingTasks.service')

    const result = await getDashboardPendingTasks(42, NOW)
    expect(result.map((i) => i.id)).toEqual([1])
    expect(result[0].learningType).toBe('assignment')
  })

  it('keeps only lectures whose catch-up window is still open', async () => {
    hoisted.fetchLectures.mockResolvedValue([
      row({ id: 10, type: 'live' }),
      row({ id: 11, type: 'live' }),
    ])
    hoisted.fetchAttendance.mockResolvedValue(
      new Map([
        [10, { isCatchupWindowOver: false, overallStatus: 0, daysRemaining: 2 }],
        [11, { isCatchupWindowOver: true, overallStatus: 0, daysRemaining: 0 }],
      ]),
    )
    const { getDashboardPendingTasks } = await import('../getDashboardPendingTasks.service')

    const result = await getDashboardPendingTasks(42, NOW)
    expect(result.map((i) => i.id)).toEqual([10])
    expect(result[0].learningType).toBe('lecture')
  })

  it('sorts pending items by urgency (least time remaining first), mixing types', async () => {
    hoisted.fetchAssignments.mockResolvedValue([
      row({ id: 1, type: 'assignment', concludes: '2026-07-09 09:00:00' }), // ~7 days
      row({ id: 2, type: 'assignment', concludes: '2026-07-02 18:00:00' }), // hours
    ])
    hoisted.fetchLectures.mockResolvedValue([row({ id: 10, type: 'live' })])
    hoisted.fetchAttendance.mockResolvedValue(
      new Map([[10, { isCatchupWindowOver: false, overallStatus: 0, daysRemaining: 2 }]]),
    )
    const { getDashboardPendingTasks } = await import('../getDashboardPendingTasks.service')

    const result = await getDashboardPendingTasks(42, NOW)
    // hours-away assignment → 2-day catch-up lecture → 7-day assignment.
    expect(result.map((i) => [i.learningType, i.id])).toEqual([
      ['assignment', 2],
      ['lecture', 10],
      ['assignment', 1],
    ])
  })

  it('drops rows scheduled after a banned cutoff', async () => {
    hoisted.getCutoff.mockResolvedValue(new Date('2026-07-01T12:00:00+05:30'))
    hoisted.fetchAssignments.mockResolvedValue([
      row({ id: 1, type: 'assignment', schedule: '2026-06-20 09:00:00' }),
      row({ id: 2, type: 'assignment', schedule: '2026-07-05 09:00:00' }),
    ])
    const { getDashboardPendingTasks } = await import('../getDashboardPendingTasks.service')

    const result = await getDashboardPendingTasks(42, NOW)
    expect(result.map((i) => i.id)).toEqual([1])
  })
})
