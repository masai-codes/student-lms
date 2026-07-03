import { addDays, formatMysqlDatetime, offsetFromNow } from '../../utils/time'
import { ONBOARDING_ID_CARD_URL, ONBOARDING_KIT_TRACKING_URL, ONBOARDING_PAYMENT_URL } from './constants'
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
  'onboarding-fees-unpaid': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    admission: {
      lmsAccessDate: now(),
      courseFeeDeadline: inDays(7),
      fullFeesPaid: 0,
      paymentUrl: ONBOARDING_PAYMENT_URL,
    },
  },
  'onboarding-fees-paid': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    admission: { ...paidAdmissionBase, lmsAccessDate: now() },
    profile: {},
  },
  'onboarding-kit-waiting': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    admission: {
      ...paidAdmissionBase,
      lmsAccessDate: now(),
      studentKitExists: 1,
      studentKitDetailsFilled: 1,
    },
    profile: {},
  },
  'onboarding-kit-tracking': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    admission: {
      ...paidAdmissionBase,
      lmsAccessDate: now(),
      studentKitExists: 1,
      studentKitDetailsFilled: 1,
      studentKitTrackingUrl: ONBOARDING_KIT_TRACKING_URL,
    },
    profile: {},
  },
  'onboarding-agreement-pending': {
    includeAdmission: true,
    userMeta: { showWelcomeModal: true },
    admission: { ...paidAdmissionBase, lmsAccessDate: now() },
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
