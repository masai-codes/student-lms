import { describe, expect, it } from 'vitest'
import { buildLmsSteps, buildProgramSteps } from './steps'
import type { T0FlowLecturesResult } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

function lectures(over: Partial<T0FlowLecturesResult> = {}): T0FlowLecturesResult {
  return {
    lmsLectures: [],
    programLectures: [],
    completedLectureIds: [],
    legalAgreementSections: [],
    isDocumentsRequired: false,
    isStudentKitApplicable: false,
    idCardUrl: null,
    ...over,
  }
}

function status(over: Partial<T0FlowStatus> = {}): T0FlowStatus {
  return {
    showT0Flow: true,
    batches: [],
    profilePhotoUrl: null,
    downloadAppCompleted: false,
    showGuidedTour: true,
    ...over,
  }
}

describe('buildLmsSteps', () => {
  it('lists videos then the two fixed steps, reflecting completion', () => {
    const steps = buildLmsSteps(
      lectures({
        lmsLectures: [
          { id: 'a', lectureId: 1, title: 'Intro', videoUrl: 'v1', lectureType: 'video' },
          { id: 'b', lectureId: 2, title: 'Tools', videoUrl: 'v2', lectureType: 'video' },
        ],
        completedLectureIds: [1],
      }),
      status({ profilePhotoUrl: 'https://x/p.jpg', downloadAppCompleted: false }),
    )

    expect(steps.map((s) => s.key)).toEqual(['lecture-1', 'lecture-2', 'profile-photo', 'download-app'])
    expect(steps[0].completed).toBe(true) // lecture 1 done
    expect(steps[1].completed).toBe(false) // lecture 2 not done
    expect(steps[2].completed).toBe(true) // photo present
    expect(steps[3].completed).toBe(false) // app not installed
  })
})

describe('buildProgramSteps', () => {
  it('lists program videos, agreement, and the applicable extras', () => {
    const steps = buildProgramSteps(
      lectures({
        programLectures: [{ id: 'p', lectureId: 9, title: 'Program intro', videoUrl: 'v', lectureType: 'video' }],
        completedLectureIds: [9],
        legalAgreementSections: [{ sectionId: 7, name: 'Enrolment agreement', completed: false }],
        isDocumentsRequired: true,
        isStudentKitApplicable: true,
        idCardUrl: 'https://x/id.png',
      }),
    )

    expect(steps.map((s) => s.key)).toEqual(['lecture-9', 'agreement-7', 'documents', 'student-kit', 'id-card'])
    expect(steps[0].completed).toBe(true)
    expect(steps[1]).toMatchObject({ action: 'agreement', sectionId: 7, completed: false })
    expect(steps.at(-1)).toMatchObject({ action: 'id-card', completed: true })
  })

  it('omits extras that are not applicable', () => {
    const steps = buildProgramSteps(lectures({ programLectures: [], legalAgreementSections: [] }))
    expect(steps).toEqual([])
  })
})
