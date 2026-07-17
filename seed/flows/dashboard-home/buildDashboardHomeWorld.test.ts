import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  createUser: vi.fn(),
  createBatch: vi.fn(),
  createSection: vi.fn(),
  createEnrollment: vi.fn(),
  createLecture: vi.fn(),
  createAssignment: vi.fn(),
  createAnnouncement: vi.fn(),
  createAnnouncementRead: vi.fn(),
  createMessage: vi.fn(),
  createWhatsnew: vi.fn(),
  createSubmission: vi.fn(),
}))

vi.mock('../../factories/index.ts', () => ({
  createUser: hoisted.createUser,
  createBatch: hoisted.createBatch,
  createSection: hoisted.createSection,
  createEnrollment: hoisted.createEnrollment,
  createLecture: hoisted.createLecture,
  createAssignment: hoisted.createAssignment,
  createAnnouncement: hoisted.createAnnouncement,
  createAnnouncementRead: hoisted.createAnnouncementRead,
  createMessage: hoisted.createMessage,
  createWhatsnew: hoisted.createWhatsnew,
  createSubmission: hoisted.createSubmission,
}))

import { buildDashboardHomeWorld } from './buildDashboardHomeWorld'

describe('buildDashboardHomeWorld', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hoisted.createUser.mockImplementation(
      async (input: { email?: string; name?: string }) => ({
        id: input.email?.includes('admin') ? 1 : 2,
        email: input.email,
        name: input.name ?? 'Test',
      }),
    )
    hoisted.createBatch.mockResolvedValue({ id: 10 })
    hoisted.createSection.mockResolvedValue({ id: 20, name: 'Section' })
    hoisted.createEnrollment.mockResolvedValue({ id: 30 })

    let lectureId = 100
    hoisted.createLecture.mockImplementation(
      async (input: { title: string }) => ({
        id: lectureId++,
        title: input.title,
      }),
    )

    let assignmentId = 200
    hoisted.createAssignment.mockImplementation(
      async (input: { title: string }) => ({
        id: assignmentId++,
        title: input.title,
      }),
    )

    let announcementId = 300
    hoisted.createAnnouncement.mockImplementation(
      async (input: { subject: string }) => ({
        id: announcementId++,
        subject: input.subject,
      }),
    )

    let messageId = 400
    hoisted.createMessage.mockImplementation(
      async (input: { subject: string }) => ({
        id: messageId++,
        subject: input.subject,
      }),
    )

    let whatsnewId = 500
    hoisted.createWhatsnew.mockImplementation(
      async (input: { subject: string }) => ({
        id: whatsnewId++,
        subject: input.subject,
      }),
    )

    hoisted.createAnnouncementRead.mockResolvedValue({ id: 600 })
    hoisted.createSubmission.mockResolvedValue({ id: 700 })
  })

  it('seeds schedule, pending, announcements, product updates, and exclusions', async () => {
    const world = await buildDashboardHomeWorld('dashboard-home')

    expect(hoisted.createLecture).toHaveBeenCalledTimes(4)
    expect(hoisted.createAssignment).toHaveBeenCalledTimes(5)
    expect(hoisted.createAnnouncement).toHaveBeenCalledTimes(6)
    expect(hoisted.createMessage).toHaveBeenCalledTimes(2)
    expect(hoisted.createWhatsnew).toHaveBeenCalledTimes(7)
    expect(hoisted.createSubmission).toHaveBeenCalledOnce()
    expect(hoisted.createAnnouncementRead).toHaveBeenCalledOnce()

    expect(world.scheduleLectures).toHaveLength(2)
    expect(world.visibleAnnouncements).toHaveLength(3)
    expect(world.visibleMessages).toHaveLength(2)
    expect(world.productUpdates).toHaveLength(7)
    expect(world.exclusions.startedAssignmentId).toBeGreaterThan(0)
  })

  it('configures catch-up section settings', async () => {
    await buildDashboardHomeWorld('dashboard-home')

    expect(hoisted.createSection).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: { enableVideoAttendance: true, catchUpDays: 7 },
      }),
    )
  })
})
