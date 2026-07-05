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
    studentKit: { applicable: false, detailsFilled: false, trackingUrl: null, trackingId: null, admissionsFormUrl: null },
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
        legalAgreementSections: [
          {
            sectionId: 7,
            sectionName: 'Enrolment agreement',
            programName: 'MERN',
            batchName: 'B1',
            steps: [{ key: 'program_agreement', heading: 'Program Agreement', pdfUrl: 'https://x/a.pdf', order: null }],
            savedValues: {},
            acceptedStepKeys: [],
            completed: false,
            referenceNumber: 'TC-1-section_7',
            agreementPdfUrl: null,
          },
        ],
        isDocumentsRequired: true,
        studentKit: { applicable: true, detailsFilled: false, trackingUrl: null, trackingId: null, admissionsFormUrl: 'https://sso/kit' },
        idCardUrl: 'https://x/id.png',
      }),
    )

    expect(steps.map((s) => s.key)).toEqual(['lecture-9', 'agreement-7', 'documents', 'student-kit', 'id-card'])
    expect(steps[0].completed).toBe(true)
    expect(steps[1]).toMatchObject({ action: 'agreement', completed: false })
    expect(steps[1].agreement?.sectionId).toBe(7)
    // ID card is locked (agreement not yet signed), so not complete.
    expect(steps.at(-1)).toMatchObject({ action: 'id-card', completed: false })
    expect(steps.at(-1)?.idCard).toEqual({ url: 'https://x/id.png', unlocked: false })
    // Documents + kit are locked until the agreement is signed.
    expect(steps.find((s) => s.action === 'documents')?.locked).toBe(true)
    expect(steps.find((s) => s.action === 'student-kit')?.locked).toBe(true)
  })

  it('unlocks documents + kit once every agreement is signed', () => {
    const steps = buildProgramSteps(
      lectures({
        legalAgreementSections: [
          { sectionId: 7, sectionName: 'A', programName: 'M', batchName: 'B', steps: [], savedValues: {}, acceptedStepKeys: [], completed: true, referenceNumber: 'r', agreementPdfUrl: null },
        ],
        isDocumentsRequired: true,
        studentKit: { applicable: true, detailsFilled: false, trackingUrl: null, trackingId: null, admissionsFormUrl: 'https://sso/kit' },
      }),
    )
    expect(steps.find((s) => s.action === 'documents')?.locked).toBe(false)
    expect(steps.find((s) => s.action === 'student-kit')?.locked).toBe(false)
  })

  it('unlocks the ID card once videos + agreements are complete', () => {
    const steps = buildProgramSteps(
      lectures({
        programLectures: [{ id: 'p', lectureId: 9, title: 'Intro', videoUrl: 'v', lectureType: 'video' }],
        completedLectureIds: [9],
        idCardUrl: 'https://x/id.png',
      }),
    )
    // Only the id-card step (no docs/kit/agreement); unlocked since the video is done.
    expect(steps.map((s) => s.key)).toEqual(['lecture-9', 'id-card'])
    expect(steps.at(-1)).toMatchObject({ action: 'id-card', completed: true })
    expect(steps.at(-1)?.idCard?.unlocked).toBe(true)
  })

  it('always appends the ID-card capstone step in the program tab', () => {
    const steps = buildProgramSteps(lectures({ programLectures: [], legalAgreementSections: [] }))
    expect(steps.map((s) => s.key)).toEqual(['id-card'])
  })
})
