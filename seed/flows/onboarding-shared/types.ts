import type { userBatchAdmissionData } from '@/db/schema'

import type { SimulatedOnwardOverrides } from '../../onward-simulation/buildSimulatedOnwardStatus'
import {
  LMS_LECTURE_TITLES,
  PROGRAM_LECTURE_TITLES,
  SECTION_NAME_LMS_APP,
  SECTION_NAME_LMS_WEB,
  SECTION_NAME_PROGRAM_APP,
  SECTION_NAME_PROGRAM_WEB,
  SECTION_TYPE_LMS_APP,
  SECTION_TYPE_LMS_WEB,
  SECTION_TYPE_PROGRAM_APP,
  SECTION_TYPE_PROGRAM_WEB,
} from './constants'

import type { OnboardingSectionKey } from '../../types'

export type SectionDef = {
  key: OnboardingSectionKey
  type: string
  name: string
  isProgram: boolean
  lectureTitles: ReadonlyArray<string>
}

export const ONBOARDING_SECTION_DEFS: ReadonlyArray<SectionDef> = [
  {
    key: 'lmsWalkthroughWeb',
    type: SECTION_TYPE_LMS_WEB,
    name: SECTION_NAME_LMS_WEB,
    isProgram: false,
    lectureTitles: LMS_LECTURE_TITLES,
  },
  {
    key: 'lmsWalkthroughApp',
    type: SECTION_TYPE_LMS_APP,
    name: SECTION_NAME_LMS_APP,
    isProgram: false,
    lectureTitles: LMS_LECTURE_TITLES,
  },
  {
    key: 'programOnboardingWeb',
    type: SECTION_TYPE_PROGRAM_WEB,
    name: SECTION_NAME_PROGRAM_WEB,
    isProgram: true,
    lectureTitles: PROGRAM_LECTURE_TITLES,
  },
  {
    key: 'programOnboardingApp',
    type: SECTION_TYPE_PROGRAM_APP,
    name: SECTION_NAME_PROGRAM_APP,
    isProgram: true,
    lectureTitles: PROGRAM_LECTURE_TITLES,
  },
]

export type AdmissionOverrides = Partial<
  typeof userBatchAdmissionData.$inferInsert
>

export type OnboardingScenario = {
  includeAdmission: boolean
  userMeta?: Record<string, unknown>
  admission?: AdmissionOverrides
  profile?: {
    legalData?: Record<string, unknown>
    meta?: Record<string, unknown>
  }
  deviceToken?: boolean
  videoAttendances?: 'none' | 'all-lms' | 'all'
  /** Sign the Program Onboarding agreement outright, independent of `videoAttendances`. */
  agreementSigned?: boolean
  /**
   * Base values for a simulated onward `/lms/student-status` response (see
   * `seed/onward-simulation/`). Presence of this field opts the flow into the
   * simulated-onward model for Documents + Student Kit instead of raw
   * `admission` DB overrides.
   */
  simulatedOnward?: SimulatedOnwardOverrides
}

export type OnboardingFlowId =
  | 'onboarding-legacy-user'
  | 'onboarding-welcome-modal'
  | 'onboarding-welcome-seen'
  | 'onboarding-fees-unpaid'
  | 'onboarding-fees-unpaid-with-app-download'
  | 'onboarding-fees-paid'
  | 'onboarding-complete'
  | 'onboarding-fees-overdue'
