import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  createUser: vi.fn(),
  createBatch: vi.fn(),
  createSection: vi.fn(),
  createEnrollment: vi.fn(),
  createLecture: vi.fn(),
  createLecturesAi: vi.fn(),
  createAssignment: vi.fn(),
  createProfile: vi.fn(),
  createUserDeviceToken: vi.fn(),
}))

vi.mock('../../factories/index.ts', () => ({
  createUser: hoisted.createUser,
  createBatch: hoisted.createBatch,
  createSection: hoisted.createSection,
  createEnrollment: hoisted.createEnrollment,
  createLecture: hoisted.createLecture,
  createLecturesAi: hoisted.createLecturesAi,
  createAssignment: hoisted.createAssignment,
  createProfile: hoisted.createProfile,
  createUserDeviceToken: hoisted.createUserDeviceToken,
}))

import { resolveJoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { resolveLiveLecturePhase } from '@/server/learn/utils/resolveLiveLecturePhase'
import { resolveLectureVideoUrl } from '@/server/learn/utils/resolveLectureVideoUrl'

import type { CreateLectureOverrides } from '../../factories/createLecture'
import type { CreateSectionOverrides } from '../../factories/createSection'
import { ONBOARDING_PROFILE_PHOTO_URL } from '../onboarding-shared/constants'
import { LIVE_LECTURE_PHASES_TIMING, LIVE_LECTURE_RECORDING_HLS_URL } from './config'
import { buildLiveLecturePhasesWorld } from './buildLiveLecturePhasesWorld'
import { seedLiveLecturePhases } from './seed'

describe('buildLiveLecturePhasesWorld', () => {
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
    hoisted.createSection.mockImplementation(async (input: CreateSectionOverrides) => {
      const name = input.name ?? ''
      return {
        id: name.includes('OFF') ? 21 : name.includes('ON') ? 22 : 20,
        name,
        settings: input.settings,
      }
    })
    hoisted.createEnrollment.mockResolvedValue({ id: 30 })
    hoisted.createLecturesAi.mockResolvedValue({ id: 40, lectureId: 104 })
    hoisted.createAssignment.mockResolvedValue({ id: 50, title: 'Associated assignment' })
    hoisted.createProfile.mockResolvedValue({ id: 70, userId: 2 })
    hoisted.createUserDeviceToken.mockResolvedValue({ id: 80, userId: 2 })

    let lectureId = 100
    hoisted.createLecture.mockImplementation(async (input: CreateLectureOverrides) => ({
      id: lectureId++,
      title: input.title ?? '',
      schedule: input.schedule,
      concludes: input.concludes,
      zoomLink: input.zoomLink,
      videos: input.videos,
      notes: input.notes,
      data: input.data,
    }))
  })

  it('pre-completes profile photo and download-app guided-tour steps', async () => {
    await buildLiveLecturePhasesWorld('live-lecture-phases')

    expect(hoisted.createProfile).toHaveBeenCalledWith({
      userId: 2,
      meta: { profile_pic: ONBOARDING_PROFILE_PHOTO_URL },
    })
    expect(hoisted.createUserDeviceToken).toHaveBeenCalledWith({
      userId: 2,
      token: 'seed-device-live-lecture-phases',
      deviceType: 'ios',
    })
  })

  it('seeds phase lectures including video and optional live variants', async () => {
    const world = await buildLiveLecturePhasesWorld('live-lecture-phases')

    expect(hoisted.createSection).toHaveBeenCalledTimes(3)
    expect(hoisted.createEnrollment).toHaveBeenCalledTimes(3)
    // 11 primary variants + OFF associated + ON associated live + ON associated notes
    expect(hoisted.createLecture).toHaveBeenCalledTimes(14)
    // attendance-ON summary/transcript + the two transcript-QA lectures
    expect(hoisted.createLecturesAi).toHaveBeenCalledTimes(3)
    expect(world.lectures.transcriptSegmented.title).toContain('timestamped segments')
    expect(world.lectures.transcriptPlainText.title).toContain('plain text only')
    expect(world.lectures.afterWithRecordingAttendanceOff.title).toContain('attendance OFF')
    expect(world.lectures.afterWithRecordingAttendanceOn.title).toContain('attendance ON')
    expect(world.lectures.videoMandatory.title).toContain('Video lecture — mandatory')
    expect(world.lectures.videoOptional.title).toContain('Video lecture — optional')
    expect(world.lectures.optionalLiveBeforeUnlock.title).toContain('Optional live — before unlock')
    expect(world.lectures.optionalLiveDuringJoin.title).toContain('Optional live — during join')
  })

  it('seeds type=video lectures (mandatory + optional) with playable HLS', async () => {
    await buildLiveLecturePhasesWorld('live-lecture-phases')

    for (const titlePart of ['Video lecture — mandatory', 'Video lecture — optional'] as const) {
      expect(hoisted.createLecture).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining(titlePart),
          type: 'video',
          optional: titlePart.includes('optional') ? 1 : 0,
          zoomLink: null,
          vimeoDownloadLinks: {
            gumlet: { hls_url: LIVE_LECTURE_RECORDING_HLS_URL },
          },
        }),
      )
    }
  })

  it('seeds optional live lectures for before-unlock and during-join windows', async () => {
    await buildLiveLecturePhasesWorld('live-lecture-phases')

    expect(hoisted.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Optional live — before unlock'),
        type: 'live',
        optional: 1,
        zoomLink: expect.any(String),
      }),
    )
    expect(hoisted.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Optional live — during join'),
        type: 'live',
        optional: 1,
        zoomLink: expect.any(String),
      }),
    )
  })

  it('configures section video-attendance settings for recording disclaimers', async () => {
    await buildLiveLecturePhasesWorld('live-lecture-phases')

    expect(hoisted.createSection).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: {
          enableVideoAttendance: false,
          considerVideoAttendanceForActualAttendance: false,
        },
      }),
    )
    expect(hoisted.createSection).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: {
          enableVideoAttendance: true,
          considerVideoAttendanceForActualAttendance: true,
          minimumVideoWatchPercentage: 5,
          catchUpDays: 7,
        },
      }),
    )
  })

  it('seeds an associated lecture for the attendance-OFF recording', async () => {
    const world = await buildLiveLecturePhasesWorld('live-lecture-phases')

    expect(hoisted.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Associated lecture — follow-up: DOM APIs'),
        type: 'live',
        data: {
          associatedLecture: { id: world.lectures.afterWithRecordingAttendanceOff.id },
        },
      }),
    )
    expect(world.attendanceOffExtras.associatedLecture.title).toContain('DOM APIs')
  })

  it('seeds description, AI, transcript, and associated content for attendance-ON lecture', async () => {
    const world = await buildLiveLecturePhasesWorld('live-lecture-phases')

    const attendanceOnCall = hoisted.createLecture.mock.calls
      .map((call) => call[0] as { title: string; notes?: string })
      .find((input) => input.title.includes('video attendance ON'))

    expect(attendanceOnCall?.notes).toContain('Session notes')

    expect(hoisted.createLecturesAi).toHaveBeenCalledWith(
      expect.objectContaining({
        lectureId: world.lectures.afterWithRecordingAttendanceOn.id,
        summary: expect.stringContaining('AI summary'),
        transcript: expect.stringContaining('Welcome back'),
        transcriptSegments: expect.arrayContaining([
          expect.objectContaining({ text: expect.stringContaining('closures') }),
        ]),
        isSummaryPublished: 1,
      }),
    )

    expect(hoisted.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Associated lecture — follow-up'),
        type: 'live',
        data: {
          associatedLecture: { id: world.lectures.afterWithRecordingAttendanceOn.id },
        },
      }),
    )

    expect(hoisted.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Associated notes'),
        category: 'notes',
        type: 'reading',
        data: {
          associatedLecture: { id: world.lectures.afterWithRecordingAttendanceOn.id },
        },
      }),
    )

    expect(hoisted.createAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Associated assignment'),
        data: {
          associatedLecture: { id: world.lectures.afterWithRecordingAttendanceOn.id },
        },
      }),
    )

    expect(world.attendanceOnExtras.associatedLecture.title).toContain('Associated lecture')
    expect(world.attendanceOnExtras.associatedNotesLecture.title).toContain('Associated notes')
    expect(world.attendanceOnExtras.associatedAssignment.title).toContain(
      'Associated assignment',
    )
  })

  it('seeds a segmented transcript lecture for transcript / caption / download QA', async () => {
    const world = await buildLiveLecturePhasesWorld('live-lecture-phases')

    expect(hoisted.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Transcript — timestamped segments'),
        type: 'video',
        optional: 0,
        vimeoDownloadLinks: {
          gumlet: { hls_url: LIVE_LECTURE_RECORDING_HLS_URL },
        },
      }),
    )

    const aiCall = hoisted.createLecturesAi.mock.calls
      .map((call) => call[0] as { lectureId: number; transcript: string; transcriptSegments: unknown })
      .find((input) => input.lectureId === world.lectures.transcriptSegmented.id)

    const segments = aiCall?.transcriptSegments as Array<{ start: number; text: string }>
    expect(segments.length).toBeGreaterThan(20)
    expect(segments[0].start).toBe(0)
    // The closing block crosses the hour so QA sees `h:mm:ss` timestamps too.
    expect(segments.some((segment) => segment.start >= 3600)).toBe(true)
    expect(aiCall?.transcript).toContain('closure')
  })

  it('seeds a plain-text-only transcript lecture for the fallback path', async () => {
    const world = await buildLiveLecturePhasesWorld('live-lecture-phases')

    expect(hoisted.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Transcript — plain text only'),
        type: 'video',
        optional: 1,
      }),
    )

    const aiCall = hoisted.createLecturesAi.mock.calls
      .map((call) => call[0] as { lectureId: number; transcript: string; transcriptSegments: unknown })
      .find((input) => input.lectureId === world.lectures.transcriptPlainText.id)

    expect(aiCall?.transcriptSegments).toBeNull()
    expect(aiCall?.transcript).toContain('plain text')
    expect(world.transcriptExtras.plainTextAi).toBeDefined()
    expect(world.transcriptExtras.segmentedAi).toBeDefined()
  })

  it('seeds recording lectures with a playable video url and no attendance rows', async () => {
    await buildLiveLecturePhasesWorld('live-lecture-phases')

    const recordingCalls = hoisted.createLecture.mock.calls
      .map(
        (call) =>
          call[0] as {
            title: string
            videos: string | null
            vimeoDownloadLinks: { gumlet: { hls_url: string } } | null
          },
      )
      .filter((input) => input.title.includes('recording available'))

    expect(recordingCalls).toHaveLength(2)
    for (const input of recordingCalls) {
      expect(input.videos).toBeNull()
      expect(input.vimeoDownloadLinks?.gumlet.hls_url).toBe(LIVE_LECTURE_RECORDING_HLS_URL)
      expect(
        resolveLectureVideoUrl({
          videos: input.videos,
          vimeoDownloadLinks: input.vimeoDownloadLinks,
          vimeoPlayerEmbedUrl: null,
        }),
      ).toBe(LIVE_LECTURE_RECORDING_HLS_URL)
    }
  })

  it('maps seeded timings to the expected live phases at seed time', async () => {
    await buildLiveLecturePhasesWorld('live-lecture-phases')
    const nowMs = Date.now()

    const byTitle = (needle: string) =>
      hoisted.createLecture.mock.calls
        .map(
          (call) =>
            call[0] as {
              title: string
              schedule: string
              concludes: string
              zoomLink: string | null
            },
        )
        .find((input) => input.title.includes(needle))!

    const beforeArgs = byTitle('Before unlock (>10 min to start)')
    const duringArgs = byTitle('During join window')
    const optionalBeforeArgs = byTitle('Optional live — before unlock')
    const optionalDuringArgs = byTitle('Optional live — during join')
    const afterNoRecordingArgs = byTitle('recording not available yet')
    const afterRecordingOffArgs = byTitle('video attendance OFF')

    expect(
      resolveLiveLecturePhase({
        schedule: beforeArgs.schedule,
        concludes: beforeArgs.concludes,
        nowMs,
      }),
    ).toBe('before')
    expect(
      resolveLiveLecturePhase({
        schedule: optionalBeforeArgs.schedule,
        concludes: optionalBeforeArgs.concludes,
        nowMs,
      }),
    ).toBe('before')

    expect(
      resolveLiveLecturePhase({
        schedule: duringArgs.schedule,
        concludes: duringArgs.concludes,
        nowMs,
      }),
    ).toBe('during')
    expect(
      resolveJoinLiveButtonState({
        schedule: duringArgs.schedule,
        concludes: duringArgs.concludes,
        nowMs,
        zoomLink: duringArgs.zoomLink,
      }),
    ).toBe('active')
    expect(
      resolveJoinLiveButtonState({
        schedule: optionalDuringArgs.schedule,
        concludes: optionalDuringArgs.concludes,
        nowMs,
        zoomLink: optionalDuringArgs.zoomLink,
      }),
    ).toBe('active')

    for (const args of [afterNoRecordingArgs, afterRecordingOffArgs]) {
      expect(
        resolveLiveLecturePhase({
          schedule: args.schedule,
          concludes: args.concludes,
          nowMs,
        }),
      ).toBe('after')
    }
  })
})

describe('seedLiveLecturePhases', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hoisted.createUser
      .mockResolvedValueOnce({ id: 1, email: 'admin@example.com', name: 'Host' })
      .mockResolvedValueOnce({ id: 2, email: 'student@example.com', name: 'Student' })
    hoisted.createBatch.mockResolvedValue({ id: 10 })
    hoisted.createSection.mockResolvedValue({ id: 20 })
    hoisted.createEnrollment.mockResolvedValue({ id: 30 })
    hoisted.createLecturesAi.mockResolvedValue({ id: 40 })
    hoisted.createAssignment.mockResolvedValue({ id: 50 })
    hoisted.createProfile.mockResolvedValue({ id: 70 })
    hoisted.createUserDeviceToken.mockResolvedValue({ id: 80 })

    let lectureId = 100
    hoisted.createLecture.mockImplementation(async (input: { title: string }) => ({
      id: lectureId++,
      title: input.title,
    }))
  })

  it('returns flow metadata and timing keys', async () => {
    const result = await seedLiveLecturePhases()

    expect(result.flowId).toBe('live-lecture-phases')
    expect(result.testUsers).toHaveLength(2)
    expect(result.timing).toMatchObject({
      beforeUnlockSchedule: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
      duringJoinSchedule: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
      afterWithRecordingSchedule: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    })
    expect(LIVE_LECTURE_PHASES_TIMING.beforeUnlockScheduleMinutesFromNow).toBe(20)
  })
})
