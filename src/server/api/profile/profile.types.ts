/** Shared response shapes for the `/api/profile/**` endpoints. */

/** A student code as recorded on a batch enrolment (`batch_user`). */
export interface ProfileStudentCode {
  code: string
  /**
   * `batches.id` is MySQL `UNSIGNED INT`, so real ids go above the signed
   * 32-bit range. Kept as a plain JS number; never narrow it.
   */
  batchId: number | null
  batchName: string | null
}

/** Header card payload plus the flags that decide which tabs exist. */
export interface ProfileOverview {
  name: string
  email: string
  /** `profiles.meta.profile_pic`, falling back to `users.profile_photo_path`. */
  avatarUrl: string | null
  phone: string | null
  studentCodes: Array<ProfileStudentCode>
  /** Any `user_batch_admission_data` row — gates Invoices and Student Kit. */
  isNewUserJourney: boolean
  /** `full_fees_paid` on any admission row — gates Student Kit. */
  hasFullFees: boolean
}

/** One browser/device session from the `sessions` table. */
export interface ProfileSession {
  id: string
  /** Humanised user agent, e.g. `Chrome 120.0 (Mac OS X)`. */
  device: string
  deviceKind: 'laptop' | 'tablet' | 'phone'
  /** Unix seconds, as stored. */
  lastActiveAt: number
  /** True for the session making this request — never offered for revoke. */
  isCurrent: boolean
}

export const EMAIL_PREFERENCE_KEYS = [
  'lectures',
  'assignments',
  'evaluations',
  'announcements',
  'tickets',
  'discussions',
] as const

export type EmailPreferenceKey = (typeof EMAIL_PREFERENCE_KEYS)[number]

export type EmailPreferences = Record<EmailPreferenceKey, boolean>

/** A pending acknowledgement the student has not accepted yet. */
export interface PendingUndertaking {
  sectionId: number
  sectionName: string
  batchId: number | null
  batchName: string | null
  program: string | null
  heading: string
  pdfUrl: string
}

export interface AchievementBadgeDetail {
  id: number
  title: string
  description: string
  image: string
  linkedinShareText: string | null
  lockedDescription: string | null
  /** `theme1` | `theme2` | `theme3`; anything else falls back to `theme1`. */
  theme: string | null
}

/** One badge slot for the student: earned (with a count) or still locked. */
export interface AchievementItem {
  badgeConfigId: number
  badgeId: number
  /** Earliest unlock date across duplicate awards; null while locked. */
  releaseDate: string | null
  /** How many times this badge was awarded. 0 while locked. */
  count: number
  isLocked: boolean
  courseTitle: string | null
  sectionModuleName: string | null
  /**
   * Opaque signed key for the API's public badge landing page. Null for locked
   * badges, and for every badge when `BADGE_SHARE_SECRET` is unconfigured.
   */
  shareKey: string | null
  badge: AchievementBadgeDetail
}

/** Welcome-kit state, proxied from the Admissions API. */
export interface StudentKitStatus {
  showKit: boolean
  detailsFilled: boolean
  /** Where to send the student to fill kit details, when they haven't. */
  admissionsFormUrl: string | null
  trackingId: string | null
  trackingUrl: string | null
}

/** A paid-fee invoice, proxied from the Admissions API. */
export interface ProfileInvoice {
  paymentType: string
  amount: number | null
  paidOn: string | null
  invoiceUrl: string | null
}
