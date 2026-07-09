import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildLmsSteps, buildProgramSteps, getIdCardState } from './steps'
import type { T0FlowLecturesResult } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

const hoisted = vi.hoisted(() => ({ isIHub: false }))
vi.mock('@/utils/portal', () => ({
  isIHubPortal: () => hoisted.isIHub,
}))

afterEach(() => {
  hoisted.isIHub = false
})

function lectures(
  over: Partial<T0FlowLecturesResult> = {},
): T0FlowLecturesResult {
  return {
    lmsLectures: [],
    programLectures: [],
    completedLectureIds: [],
    legalAgreementSections: [],
    isDocumentsRequired: false,
    documentsUploaded: false,
    studentKit: {
      applicable: false,
      detailsFilled: false,
      trackingUrl: null,
      trackingId: null,
      admissionsFormUrl: null,
    },
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
    flowVariant: 'full',
    ...over,
  }
}

describe('buildLmsSteps', () => {
  it('lists videos then the two fixed steps, reflecting completion', () => {
    const steps = buildLmsSteps(
      lectures({
        lmsLectures: [
          {
            id: 'a',
            lectureId: 1,
            title: 'Intro',
            videoUrl: 'v1',
            lectureType: 'video',
          },
          {
            id: 'b',
            lectureId: 2,
            title: 'Tools',
            videoUrl: 'v2',
            lectureType: 'video',
          },
        ],
        completedLectureIds: [1],
      }),
      status({
        profilePhotoUrl: 'https://x/p.jpg',
        downloadAppCompleted: false,
      }),
    )

    expect(steps.map((s) => s.key)).toEqual([
      'lecture-1',
      'lecture-2',
      'profile-photo',
      'download-app',
    ])
    expect(steps[0].completed).toBe(true) // lecture 1 done
    expect(steps[1].completed).toBe(false) // lecture 2 not done
    expect(steps[2].completed).toBe(true) // photo present
    expect(steps[3].completed).toBe(false) // app not installed
  })

  it('drops the download-app step on the iHub portal', () => {
    hoisted.isIHub = true
    const steps = buildLmsSteps(
      lectures({
        lmsLectures: [
          {
            id: 'a',
            lectureId: 1,
            title: 'Intro',
            videoUrl: 'v1',
            lectureType: 'video',
          },
        ],
        completedLectureIds: [1],
      }),
      status({ profilePhotoUrl: 'https://x/p.jpg' }),
    )

    expect(steps.map((s) => s.key)).toEqual(['lecture-1', 'profile-photo'])
    expect(steps.some((s) => s.action === 'download-app')).toBe(false)
  })
})

describe('buildProgramSteps', () => {
  it('lists program videos, agreement, and the applicable extras', () => {
    const steps = buildProgramSteps(
      lectures({
        programLectures: [
          {
            id: 'p',
            lectureId: 9,
            title: 'Program intro',
            videoUrl: 'v',
            lectureType: 'video',
          },
        ],
        completedLectureIds: [9],
        legalAgreementSections: [
          {
            sectionId: 7,
            sectionName: 'Enrolment agreement',
            programName: 'MERN',
            batchName: 'B1',
            steps: [
              {
                key: 'program_agreement',
                heading: 'Program Agreement',
                pdfUrl: 'https://x/a.pdf',
                order: null,
              },
            ],
            savedValues: {},
            acceptedStepKeys: [],
            completed: false,
            referenceNumber: 'TC-1-section_7',
            agreementPdfUrl: null,
            viewTime: null,
            daysSinceFirstView: 0,
            daysLeft: 7,
            isClosable: true,
          },
        ],
        isDocumentsRequired: true,
        studentKit: {
          applicable: true,
          detailsFilled: false,
          trackingUrl: null,
          trackingId: null,
          admissionsFormUrl: 'https://sso/kit',
        },
        idCardUrl: 'https://x/id.png',
      }),
      status(),
    )

    // No id-card step — it's a capstone rendered below the list (getIdCardState).
    expect(steps.map((s) => s.key)).toEqual([
      'lecture-9',
      'agreement-7',
      'documents',
      'student-kit',
    ])
    expect(steps[0].completed).toBe(true)
    expect(steps[1]).toMatchObject({ action: 'agreement', completed: false })
    expect(steps[1].agreement?.sectionId).toBe(7)
    expect(steps.some((s) => s.action === 'id-card')).toBe(false)
    // Documents + kit are always available (no per-step lock); completion tracks
    // the admissions state, so with nothing uploaded/filled they're not done.
    expect(steps.find((s) => s.action === 'documents')?.completed).toBe(false)
    expect(steps.find((s) => s.action === 'student-kit')?.completed).toBe(false)
  })

  it('green-checks the documents step once the admissions API reports it uploaded', () => {
    const steps = buildProgramSteps(
      lectures({
        isDocumentsRequired: true,
        documentsUploaded: true,
        studentKit: {
          applicable: true,
          detailsFilled: true,
          trackingUrl: null,
          trackingId: null,
          admissionsFormUrl: null,
        },
      }),
      status(),
    )
    expect(steps.find((s) => s.action === 'documents')?.completed).toBe(true)
    expect(steps.find((s) => s.action === 'student-kit')?.completed).toBe(true)
  })

  it('never includes the ID card as a step (full flow)', () => {
    const steps = buildProgramSteps(
      lectures({ programLectures: [], legalAgreementSections: [] }),
      status(),
    )
    expect(steps.map((s) => s.key)).toEqual([])
    expect(steps.some((s) => s.action === 'id-card')).toBe(false)
  })

  it('lite flow: only the agreement step — no videos, documents, kit, or ID card', () => {
    const steps = buildProgramSteps(
      lectures({
        legalAgreementSections: [
          {
            sectionId: 7,
            sectionName: 'Enrolment agreement',
            programName: 'MERN',
            batchName: 'B1',
            steps: [],
            savedValues: {},
            acceptedStepKeys: [],
            completed: false,
            referenceNumber: 'r',
            agreementPdfUrl: null,
            viewTime: null,
            daysSinceFirstView: 0,
            daysLeft: 7,
            isClosable: true,
          },
        ],
        // These would add steps in the full flow but must be ignored in lite.
        isDocumentsRequired: true,
        studentKit: {
          applicable: true,
          detailsFilled: false,
          trackingUrl: null,
          trackingId: null,
          admissionsFormUrl: 'https://sso/kit',
        },
        idCardUrl: 'https://x/id.png',
      }),
      status({ flowVariant: 'lite' }),
    )
    expect(steps.map((s) => s.key)).toEqual(['agreement-7'])
  })

  it('lite flow: an empty program tab when the batch has no agreement', () => {
    const steps = buildProgramSteps(
      lectures({ legalAgreementSections: [] }),
      status({ flowVariant: 'lite' }),
    )
    expect(steps).toEqual([])
  })
})

describe('getIdCardState', () => {
  it('is shown but locked until every program video + agreement is done', () => {
    const state = getIdCardState(
      lectures({
        programLectures: [
          {
            id: 'p',
            lectureId: 9,
            title: 'Intro',
            videoUrl: 'v',
            lectureType: 'video',
          },
        ],
        completedLectureIds: [],
        idCardUrl: 'https://x/id.png',
      }),
      status(),
    )
    expect(state).toEqual({
      show: true,
      url: 'https://x/id.png',
      unlocked: false,
    })
  })

  it('unlocks once every program video is watched and every agreement signed', () => {
    const state = getIdCardState(
      lectures({
        programLectures: [
          {
            id: 'p',
            lectureId: 9,
            title: 'Intro',
            videoUrl: 'v',
            lectureType: 'video',
          },
        ],
        completedLectureIds: [9],
        idCardUrl: 'https://x/id.png',
      }),
      status(),
    )
    expect(state).toEqual({
      show: true,
      url: 'https://x/id.png',
      unlocked: true,
    })
  })

  it('is hidden for the lite (non-T0) flow', () => {
    expect(
      getIdCardState(
        lectures({ idCardUrl: 'https://x/id.png' }),
        status({ flowVariant: 'lite' }),
      ),
    ).toEqual({
      show: false,
      url: null,
      unlocked: false,
    })
  })
})
