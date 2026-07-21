import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ScheduleEntityRow } from '../scheduleTypes'

const hoisted = vi.hoisted(() => ({
  getSectionIds: vi.fn(),
  getBatchIds: vi.fn(),
  fetchLectures: vi.fn(),
  fetchAssignments: vi.fn(),
  fetchAttendance: vi.fn(),
  fetchSubmissions: vi.fn(),
}))

vi.mock('@/server/batches/getSectionIdsForUser', () => ({
  getSectionIdsForUser: hoisted.getSectionIds,
}))
vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIds,
}))
vi.mock('@/server/restrictions/getUserBatchRestrictions', () => ({
  getUserBatchRestrictions: vi.fn(async () => new Map()),
}))
vi.mock('@/server/batches/getBatchIdsForSections', () => ({
  getBatchIdsForSections: vi.fn(async () => new Map()),
  getBatchIdForSection: vi.fn(async () => null),
}))
vi.mock('../fetchScheduleLectures.service', () => ({
  fetchScheduleLectures: hoisted.fetchLectures,
}))
vi.mock('../fetchScheduleAssignments.service', () => ({
  fetchScheduleAssignments: hoisted.fetchAssignments,
}))
vi.mock('@/server/attendance/services/fetchLectureAttendanceSummaries', () => ({
  fetchLectureAttendanceSummaries: hoisted.fetchAttendance,
}))
vi.mock('@/server/learn/queries/fetchLatestSubmissionByAssignment', () => ({
  fetchLatestSubmissionByAssignment: hoisted.fetchSubmissions,
}))

const NOW = new Date('2026-07-02T06:30:00Z')

const row = (over: Partial<ScheduleEntityRow> = {}): ScheduleEntityRow => ({
  id: 1,
  title: 'Workshop',
  category: 'IIM-M DM',
  type: 'live',
  optional: 0,
  schedule: '2026-07-03 10:00:00',
  concludes: '2026-07-03 11:00:00',
  sectionId: 5,
  week: 1,
  module: 'Module 1',
  hostName: 'Prof. A',
  zoomLink: 'https://zoom/1',
  sectionName: 'Full Stack Section A',
  batchName: 'FS Batch',
  sectionSettings: { enableZoomWebView: true },
  ...over,
})

describe('getDashboardSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getSectionIds.mockResolvedValue([5])
    hoisted.getBatchIds.mockResolvedValue([1])
    hoisted.fetchAttendance.mockResolvedValue(new Map())
    hoisted.fetchSubmissions.mockResolvedValue(new Map())
    hoisted.fetchLectures.mockResolvedValue([])
    hoisted.fetchAssignments.mockResolvedValue([])
  })

  it('returns [] without querying when the user has no sections', async () => {
    hoisted.getSectionIds.mockResolvedValue([])
    const { getDashboardSchedule } =
      await import('../getDashboardSchedule.service')
    expect(await getDashboardSchedule(42, NOW)).toEqual([])
    expect(hoisted.fetchLectures).not.toHaveBeenCalled()
  })

  it('merges lectures + assignments soonest-first with the right learning types', async () => {
    hoisted.fetchLectures.mockResolvedValue([
      row({ id: 1, schedule: '2026-07-03 10:00:00' }),
    ])
    hoisted.fetchAssignments.mockResolvedValue([
      row({ id: 2, type: 'assignment', schedule: '2026-07-02 09:00:00' }),
    ])
    const { getDashboardSchedule } =
      await import('../getDashboardSchedule.service')

    const result = await getDashboardSchedule(42, NOW)
    expect(result.map((i) => [i.learningType, i.id])).toEqual([
      ['assignment', 2],
      ['lecture', 1],
    ])
  })

  it('omits the course name unless the user is in more than one batch', async () => {
    hoisted.fetchLectures.mockResolvedValue([row()])
    const { getDashboardSchedule } =
      await import('../getDashboardSchedule.service')

    expect((await getDashboardSchedule(42, NOW))[0].courseName).toBeNull()

    hoisted.getBatchIds.mockResolvedValue([1, 2])
    expect((await getDashboardSchedule(42, NOW))[0].courseName).toBe(
      'Full Stack Section A',
    )
  })

  it('falls back to the batch name when the section has no name', async () => {
    hoisted.getBatchIds.mockResolvedValue([1, 2])
    hoisted.fetchLectures.mockResolvedValue([
      row({ sectionName: '  ', batchName: 'FS Batch' }),
    ])
    const { getDashboardSchedule } =
      await import('../getDashboardSchedule.service')

    expect((await getDashboardSchedule(42, NOW))[0].courseName).toBe('FS Batch')
  })

  it('surfaces enableZoomWebView from section settings', async () => {
    hoisted.fetchLectures.mockResolvedValue([
      row({ id: 1, sectionSettings: { enableZoomWebView: true } }),
      row({ id: 2, sectionSettings: {} }),
    ])
    const { getDashboardSchedule } =
      await import('../getDashboardSchedule.service')

    const result = await getDashboardSchedule(42, NOW)
    expect(result.find((i) => i.id === 1)?.enableZoomWebView).toBe(true)
    expect(result.find((i) => i.id === 2)?.enableZoomWebView).toBe(false)
  })

  it('computes assignmentProgressStatus from the latest submission', async () => {
    // Assignment window has already ended, no submission → overdue.
    hoisted.fetchAssignments.mockResolvedValue([
      row({
        id: 2,
        type: 'assignment',
        schedule: '2026-06-20 09:00:00',
        concludes: '2026-06-25 09:00:00',
      }),
    ])
    hoisted.fetchSubmissions.mockResolvedValue(new Map())
    const { getDashboardSchedule } =
      await import('../getDashboardSchedule.service')

    const [assignment] = await getDashboardSchedule(42, NOW)
    expect(assignment.assignmentProgressStatus).toBe('overdue')
    expect(hoisted.fetchSubmissions).toHaveBeenCalledWith(42, [2])
  })
})
