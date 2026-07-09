export const ONBOARDING_LMS_WEB_VIDEO_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/47112992-c5fc-4d05-869a-90a4c53b5654/ciMpbypYUXGkMgHn.mp4'

export const ONBOARDING_LMS_APP_VIDEO_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/1bf6eecd-adba-4ff4-8a7c-8918d19995a6/kjfYWNpFgLfFSVyI.mp4'

export const ONBOARDING_ID_CARD_URL = 'https://example.com/id-card.pdf'
export const ONBOARDING_PROFILE_PHOTO_URL = 'https://example.com/profile-photo.jpg'
export const ONBOARDING_PAYMENT_URL = 'https://example.com/pay-fees'
export const ONBOARDING_KIT_TRACKING_URL = 'https://tracking.example.com/ABC123'

export const SECTION_TYPE_LMS_WEB = 'lms-walkthrough-web'
export const SECTION_TYPE_LMS_APP = 'lms-walkthrough-app'
export const SECTION_TYPE_PROGRAM_WEB = 'program-onboarding-web'
export const SECTION_TYPE_PROGRAM_APP = 'program-onboarding-app'

export const SECTION_NAME_LMS_WEB = 'LMS Walkthrough - Web'
export const SECTION_NAME_LMS_APP = 'LMS Walkthrough - App'
export const SECTION_NAME_PROGRAM_WEB = 'Program Onboarding - Web'
export const SECTION_NAME_PROGRAM_APP = 'Program Onboarding - App'

export const LMS_LECTURE_TITLES = [
  'How to navigate the dashboard',
  'How to submit assignments',
  'How to join live lectures',
] as const

export const PROGRAM_LECTURE_TITLES = [
  'Upload your documents',
  'Complete your student kit',
] as const

export function flowScopedEmail(flowId: string, role: 'admin' | 'student'): string {
  return `${flowId}.${role}@example.com`
}

/** `users.username` — the `student_code` sent to the onward admissions API. */
export function flowScopedUsername(flowId: string, role: 'admin' | 'student'): string {
  return `${flowId}-${role}`
}

export function flowScopedBatchName(flowId: string): string {
  return `SDE Batch 42 [${flowId}]`
}

export function flowScopedLectureTitle(flowId: string, baseTitle: string): string {
  return `${baseTitle} [${flowId}]`
}

export function resolveSectionVideos(sectionName: string): Array<string> {
  if (sectionName === SECTION_NAME_LMS_WEB || sectionName === SECTION_NAME_PROGRAM_WEB) {
    return [ONBOARDING_LMS_WEB_VIDEO_URL]
  }
  if (sectionName === SECTION_NAME_LMS_APP || sectionName === SECTION_NAME_PROGRAM_APP) {
    return [ONBOARDING_LMS_APP_VIDEO_URL]
  }
  return [ONBOARDING_LMS_WEB_VIDEO_URL]
}

export const PROGRAM_AGREEMENT_SETTINGS = {
  agreements: {
    shouldModalBeVisible: true,
    posh: {
      heading: 'POSH Policy Agreement',
      pdfUrl: 'https://example.com/posh-policy.pdf',
    },
  },
} as const
