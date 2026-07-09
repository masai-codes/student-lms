import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}))

import { resolveJoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'

import { isLoginAndJoinLectureEntities } from '../types'

const hoisted = vi.hoisted(() => ({
  createUser: vi.fn(),
  createBatch: vi.fn(),
  createSection: vi.fn(),
  createEnrollment: vi.fn(),
  createLecture: vi.fn(),
}))

vi.mock('../factories/index.ts', () => ({
  createUser: hoisted.createUser,
  createBatch: hoisted.createBatch,
  createSection: hoisted.createSection,
  createEnrollment: hoisted.createEnrollment,
  createLecture: hoisted.createLecture,
}))

import { loginAndJoinLectureConfig } from './login-and-join-lecture/config'
import { seedLoginAndJoinLecture } from './login-and-join-lecture/seed'

describe('seedLoginAndJoinLecture', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hoisted.createUser
      .mockResolvedValueOnce({
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      })
      .mockResolvedValueOnce({
        id: 2,
        name: 'Student User',
        email: 'student@example.com',
        role: 'student',
      })

    hoisted.createBatch.mockResolvedValue({
      id: 10,
      name: 'FT-MOCK-1',
      starting: '2026-07-02',
    })

    hoisted.createSection.mockResolvedValue({
      id: 20,
      name: 'FT-MOCK-1-SEC-A',
      batchId: 10,
    })

    hoisted.createEnrollment.mockResolvedValue({
      id: 30,
      sectionId: 20,
      userId: 2,
      managerId: 1,
      role: 'student',
    })

    hoisted.createLecture.mockResolvedValue({
      id: 40,
      batchId: 10,
      sectionId: 20,
      userId: 1,
      schedule: '2026-07-02 10:00:00',
      concludes: '2026-07-02 12:00:00',
      zoomLink: 'https://us06web.zoom.us/j/89929641190',
    })
  })

  it('composes factories in order and returns test users from seeded rows', async () => {
    const result = await seedLoginAndJoinLecture()

    expect(hoisted.createUser).toHaveBeenCalledTimes(2)
    expect(hoisted.createBatch).toHaveBeenCalledOnce()
    expect(hoisted.createSection).toHaveBeenCalledWith({ batchId: 10 })
    expect(hoisted.createEnrollment).toHaveBeenCalledWith({
      sectionId: 20,
      userId: 2,
      managerId: 1,
    })
    expect(hoisted.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        schedule: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
        concludes: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        zoomLink: expect.any(String),
      }),
    )

    const lectureArgs = hoisted.createLecture.mock.calls[0][0] as {
      schedule: string
      concludes: string
      startDate: string
      endDate: string
    }
    expect(lectureArgs.startDate).toBe(lectureArgs.schedule.slice(0, 10))
    expect(lectureArgs.endDate).toBe(lectureArgs.concludes.slice(0, 10))

    expect(result.flowId).toBe('login-and-join-lecture')
    expect(result.testUsers).toHaveLength(2)
    expect(result.testUsers[1]).toMatchObject({
      role: 'student',
      email: 'student@example.com',
      password: 'password',
      userId: 2,
    })
    expect(result.timing).toHaveProperty('lectureSchedule')
    expect(result.timing).toHaveProperty('lectureConcludes')
  })

  it('exposes machine-readable metadata', () => {
    expect(loginAndJoinLectureConfig.timing.lectureScheduledMinutesAgo).toBe(0)
    expect(loginAndJoinLectureConfig.defaultCredentialEmails).toHaveLength(2)
  })
})

describe('loginAndJoinLecture integration', () => {
  const shouldRun =
    process.env.SEED_INTEGRATION === '1' && Boolean(process.env.DATABASE_URL)

  it.skipIf(!shouldRun)(
    'seeds a lecture with an active join button',
    async () => {
      const { seedFlow } = await import('../index')
      const result = await seedFlow('login-and-join-lecture')

      if (!isLoginAndJoinLectureEntities(result.entities)) {
        throw new Error('Expected login-and-join-lecture entities')
      }

      const state = resolveJoinLiveButtonState({
        schedule: result.entities.lecture.schedule,
        concludes: result.entities.lecture.concludes,
        nowMs: Date.now(),
        zoomLink: result.entities.lecture.zoomLink,
      })

      expect(state).toBe('active')
    },
    60_000,
  )
})
