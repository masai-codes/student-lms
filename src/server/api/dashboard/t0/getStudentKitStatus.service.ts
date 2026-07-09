import type { T0AdmissionsStatus } from './getT0AdmissionsStatus.service'

/**
 * Student-kit status as the guided tour renders it. Derived entirely from the
 * admissions `student-status` API (via {@link getT0AdmissionsStatus}) — the four
 * states are: not-applicable → details-not-filled (offer the SSO form link) →
 * filled-pending-tracking → tracking available.
 */
export interface StudentKitStatus {
  /** Whether this student is due a welcome kit (admissions `kit.showKit`). */
  applicable: boolean
  /** Whether the student has submitted shipping details. */
  detailsFilled: boolean
  /** Courier tracking URL once the kit ships. */
  trackingUrl: string | null
  /** Tracking id, when the admissions courier record carries one. */
  trackingId: string | null
  /** SSO link to the admissions form to fill shipping details (only when not filled). */
  admissionsFormUrl: string | null
}

/** Project the shared admissions status onto the kit view the client consumes. */
export function toStudentKitStatus(status: T0AdmissionsStatus): StudentKitStatus {
  if (!status.kitApplicable) {
    return { applicable: false, detailsFilled: false, trackingUrl: null, trackingId: null, admissionsFormUrl: null }
  }
  return {
    applicable: true,
    detailsFilled: status.kitDetailsFilled,
    trackingUrl: status.trackingUrl,
    trackingId: status.trackingId,
    // The SSO form link is only actionable while details are unfilled.
    admissionsFormUrl: status.kitDetailsFilled ? null : status.admissionsFormUrl,
  }
}
