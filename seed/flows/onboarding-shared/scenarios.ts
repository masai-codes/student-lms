import { addDays, formatMysqlDatetime, offsetFromNow } from '../../utils/time'
import { ONBOARDING_ID_CARD_URL, ONBOARDING_KIT_TRACKING_URL, ONBOARDING_PAYMENT_URL, ONBOARDING_PROFILE_PHOTO_URL } from './constants'
import type { OnboardingFlowId, OnboardingScenario } from './types'

const now = () => formatMysqlDatetime(offsetFromNow({ minutesAgo: 0 }))
const inDays = (days: number) => formatMysqlDatetime(addDays(offsetFromNow({ minutesAgo: 0 }), days))
const daysAgo = (days: number) => formatMysqlDatetime(offsetFromNow({ daysAgo: days }))

const paidAdmissionBase = {
  fullFeesPaid: 1 as const,
  fullFeesPaidDate: now(),
  fullFeesAmount: '150000.00',
  paymentUrl: ONBOARDING_PAYMENT_URL,
}

export const ONBOARDING_SCENARIOS: Record<OnboardingFlowId, OnboardingScenario> = {
  'onboarding-legacy-user': {
    includeAdmission: false,
  },
  'onboarding-welcome-modal': {
    includeAdmission: true,
    userMeta: {},
    admission: {
      lmsAccessDate: now(),
      courseFeeDeadline: inDays(7),
    },
  },
  'onboarding-welcome-seen': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    admission: {
      lmsAccessDate: now(),
      courseFeeDeadline: inDays(7),
    },
  },
  /**
   * Interactive LMS Walkthrough test bed (program tab locked):
   * - welcome already dismissed → lands in guided tour
   * - 3 playable LMS videos (auto-next) + profile photo + download-app where
   *   none of photo / device token / video_attendances are pre-completed
   * - payment countdown banner still visible
   */
  'onboarding-fees-unpaid': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    videoAttendances: 'none',
    admission: {
      lmsAccessDate: now(),
      courseFeeDeadline: inDays(7),
      fullFeesPaid: 0,
      paymentUrl: ONBOARDING_PAYMENT_URL,
    },
  },
  /**
   * Program Onboarding test bed (program tab unlocked): agreement pending,
   * Upload Documents + Student Kit both visible-but-incomplete via a
   * simulated onward `/lms/student-status` response — see
   * `seed/onward-simulation/`. ID card unlock is untouched (still just
   * videos watched + agreement signed).
   */
  'onboarding-fees-paid': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    admission: { ...paidAdmissionBase, lmsAccessDate: now() },
    profile: {},
    agreementSigned: false,
    simulatedOnward: {
      documentsRequired: true,
      documentsUploaded: false,
      kitShowKit: true,
      kitDetailsFilled: false,
      kitTrackingUrl: null,
    },
  },
  'onboarding-complete': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    admission: {
      ...paidAdmissionBase,
      lmsAccessDate: now(),
      studentKitExists: 1,
      studentKitDetailsFilled: 1,
      studentKitTrackingUrl: ONBOARDING_KIT_TRACKING_URL,
      idCardUrl: ONBOARDING_ID_CARD_URL,
    },
    deviceToken: true,
    videoAttendances: 'all',
    profile: { meta: { profile_pic: ONBOARDING_PROFILE_PHOTO_URL } },
  },
  'onboarding-fees-overdue': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    admission: {
      lmsAccessDate: daysAgo(30),
      courseFeeDeadline: daysAgo(7),
      fullFeesPaid: 0,
      paymentUrl: ONBOARDING_PAYMENT_URL,
    },
  },
}

export function getOnboardingScenario(flowId: OnboardingFlowId): OnboardingScenario {
  const scenario = ONBOARDING_SCENARIOS[flowId]
  if (!scenario) {
    throw new Error(`Unknown onboarding flow id: ${flowId}`)
  }
  return scenario
}
