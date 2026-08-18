import type {
  badgeConfigs,
  badges,
  batches,
  batchUser,
  lectures,
  lecturesAi,
  profiles,
  sectionUser,
  sections,
  sessions,
  userBadges,
  userBatchAdmissionData,
  userDeviceTokens,
  users,
} from '@/db/schema'

export type TestUser = {
  role: string
  email: string
  password: string
  userId: number
  name: string
}

export type SeedFlowTimingMeta = Record<string, number>

export type SeedFlowMeta = {
  id: string
  description: string
  timing: SeedFlowTimingMeta
  seedCommand: string
  defaultCredentialEmails?: Array<{ role: string; email: string }>
  /** Role from testUsers used by the catalog Login button. Defaults to first test user. */
  primaryLoginRole?: string
}

export type LoginAndJoinLectureEntities = {
  admin: typeof users.$inferSelect
  student: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  section: typeof sections.$inferSelect
  enrollment: typeof sectionUser.$inferSelect
  lecture: typeof lectures.$inferSelect
}

export type LiveLecturePhasesEntities = {
  admin: typeof users.$inferSelect
  student: typeof users.$inferSelect
  student2: typeof users.$inferSelect
  student3: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  section: typeof sections.$inferSelect
  enrollment: typeof sectionUser.$inferSelect
  enrollmentStudent2: typeof sectionUser.$inferSelect
  enrollmentStudent3: typeof sectionUser.$inferSelect
  sections: {
    recordingAttendanceOff: typeof sections.$inferSelect
    recordingAttendanceOn: typeof sections.$inferSelect
  }
  enrollments: {
    recordingAttendanceOff: typeof sectionUser.$inferSelect
    recordingAttendanceOn: typeof sectionUser.$inferSelect
  }
  lectures: {
    beforeUnlock: typeof lectures.$inferSelect
    duringJoin: typeof lectures.$inferSelect
    afterNoRecording: typeof lectures.$inferSelect
    afterWithRecordingAttendanceOff: typeof lectures.$inferSelect
    afterWithRecordingAttendanceOn: typeof lectures.$inferSelect
    videoMandatory: typeof lectures.$inferSelect
    videoOptional: typeof lectures.$inferSelect
    optionalLiveBeforeUnlock: typeof lectures.$inferSelect
    optionalLiveDuringJoin: typeof lectures.$inferSelect
    transcriptSegmented: typeof lectures.$inferSelect
    transcriptPlainText: typeof lectures.$inferSelect
    operatorsInJavascript: typeof lectures.$inferSelect
  }
  attendanceOffExtras: {
    associatedLecture: typeof lectures.$inferSelect
  }
  transcriptExtras: {
    segmentedAi: typeof lecturesAi.$inferSelect
    plainTextAi: typeof lecturesAi.$inferSelect
  }
  operatorsExtras: {
    lecturesAi: typeof lecturesAi.$inferSelect
  }
  attendanceOnExtras: {
    lecturesAi: typeof import('@/db/schema').lecturesAi.$inferSelect
    associatedLecture: typeof lectures.$inferSelect
    associatedNotesLecture: typeof lectures.$inferSelect
    associatedAssignment: typeof import('@/db/schema').assignments.$inferSelect
  }
  discussions: {
    onLecture: typeof import('@/db/schema').discussions.$inferSelect
    onLectureThreads: Array<typeof import('@/db/schema').threads.$inferSelect>
    onAssignment: typeof import('@/db/schema').discussions.$inferSelect
    onResource: typeof import('@/db/schema').discussions.$inferSelect
    onResourceThreads: Array<typeof import('@/db/schema').threads.$inferSelect>
    onLectureByStudent2: typeof import('@/db/schema').discussions.$inferSelect
    onAssignmentByStudent3: typeof import('@/db/schema').discussions.$inferSelect
  }
}

export type DashboardHomeEntities = {
  admin: typeof users.$inferSelect
  student: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  section: typeof sections.$inferSelect
  enrollment: typeof sectionUser.$inferSelect
  scheduleLectures: Array<typeof lectures.$inferSelect>
  scheduleAssignment: typeof import('@/db/schema').assignments.$inferSelect
  pastIncompleteScheduleAssignment: typeof import('@/db/schema').assignments.$inferSelect
  pendingCatchupLecture: typeof lectures.$inferSelect
  pendingAssignment: typeof import('@/db/schema').assignments.$inferSelect
  visibleAnnouncements: Array<
    typeof import('@/db/schema').announcements.$inferSelect
  >
  visibleMessages: Array<typeof import('@/db/schema').messages.$inferSelect>
  productUpdates: Array<typeof import('@/db/schema').whatsnew.$inferSelect>
  exclusions: {
    readAnnouncementId: number
    expiredAnnouncementId: number
    futureAnnouncementId: number
    startedAssignmentId: number
    overdueAssignmentId: number
    optionalCatchupLectureId: number
  }
}

export type OnboardingSectionKey =
  | 'lmsWalkthroughWeb'
  | 'lmsWalkthroughApp'
  | 'programOnboardingWeb'
  | 'programOnboardingApp'

export type OnboardingEntities = {
  admin: typeof users.$inferSelect
  student: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  sections: Record<OnboardingSectionKey, typeof sections.$inferSelect>
  lectures: Record<OnboardingSectionKey, Array<typeof lectures.$inferSelect>>
  enrollments: Array<typeof sectionUser.$inferSelect>
  admission: typeof userBatchAdmissionData.$inferSelect | null
  profile: typeof profiles.$inferSelect | null
}

export type MasaiverseAccessEntities = {
  admin: typeof users.$inferSelect
  student: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  section: typeof sections.$inferSelect
  enrollment: typeof sectionUser.$inferSelect
}

export type AppInstalledEntities = {
  admin: typeof users.$inferSelect
  student: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  section: typeof sections.$inferSelect
  enrollment: typeof sectionUser.$inferSelect
  deviceToken: typeof userDeviceTokens.$inferSelect
}

export type MultiProgramStudentEntities = LiveLecturePhasesEntities & {
  secondBatch: typeof batches.$inferSelect
  secondSection: typeof sections.$inferSelect
  secondEnrollment: typeof sectionUser.$inferSelect
  secondBatchLecture: typeof lectures.$inferSelect
  /** Third batch, enrolment paused — the "Paused Programs" case on /my-courses. */
  pausedBatch: typeof batches.$inferSelect
  pausedSection: typeof sections.$inferSelect
  pausedEnrollment: typeof sectionUser.$inferSelect
  /** Carries `meta.batchPaused` / `meta.batchPausedDate` for `pausedBatch`. */
  pausedBatchUser: typeof batchUser.$inferSelect
  /** Scheduled before the pause cutoff — stays visible. */
  prePauseLecture: typeof lectures.$inferSelect
  /** Scheduled after the pause cutoff — hidden while the pause stands. */
  postPauseLecture: typeof lectures.$inferSelect
}

export type DiscussionsCancelledEnrollmentEntities = {
  admin: typeof users.$inferSelect
  /**
   * Enrolled in both batches — cancelled at the batch level in `batch`,
   * still active (healthy) in `secondBatch`.
   */
  student: typeof users.$inferSelect
  /** Healthy student, `batch`/`section` only — discussion author there. */
  authorStudent: typeof users.$inferSelect
  /** Healthy student, `secondBatch`/`secondSection` only — discussion author there. */
  authorStudent2: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  section: typeof sections.$inferSelect
  secondBatch: typeof batches.$inferSelect
  secondSection: typeof sections.$inferSelect
  cancelledEnrollment: typeof sectionUser.$inferSelect
  authorEnrollment: typeof sectionUser.$inferSelect
  /** `student`'s healthy enrolment into `secondSection`/`secondBatch`. */
  secondEnrollment: typeof sectionUser.$inferSelect
  secondAuthorEnrollment: typeof sectionUser.$inferSelect
  lecture: typeof lectures.$inferSelect
  secondLecture: typeof lectures.$inferSelect
  /** `authorStudent`'s public discussion on `lecture` (batch A). */
  discussion: typeof import('@/db/schema').discussions.$inferSelect
  /** `student`'s public discussion on `lecture` (batch A) — posted while their `section_user` row is still active. */
  discussionByStudentOnBatch: typeof import('@/db/schema').discussions.$inferSelect
  /** `authorStudent2`'s public discussion on `secondLecture` (batch B). */
  secondDiscussion: typeof import('@/db/schema').discussions.$inferSelect
  /** `student`'s public discussion on `secondLecture` (batch B), where their enrolment is healthy. */
  discussionByStudentOnSecondBatch: typeof import('@/db/schema').discussions.$inferSelect
  /** Batch-level cancellation for `student` on `batch` only. */
  cancelledBatchUser: typeof batchUser.$inferSelect
}

export type SectionDropdownBatchEntities = {
  admin: typeof users.$inferSelect
  student: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  sections: Array<typeof sections.$inferSelect>
  enrollments: Array<typeof sectionUser.$inferSelect>
  lectures: Array<typeof lectures.$inferSelect>
  assignments: Array<typeof import('@/db/schema').assignments.$inferSelect>
}

export type ProfilePageEntities = {
  admin: typeof users.$inferSelect
  /** Enrolled in both batches, with a student code in each. */
  student: typeof users.$inferSelect
  /** The primary (first) batch — also present in `batches`. Shared tooling reads this. */
  batch: typeof batches.$inferSelect
  batches: Array<typeof batches.$inferSelect>
  /** Two modules per batch, so achievements group two levels deep. */
  sections: Array<typeof sections.$inferSelect>
  enrollments: Array<typeof sectionUser.$inferSelect>
  /** `batch_user.username` per batch — what the profile header renders. */
  studentCodes: Array<string>
  badges: Array<typeof badges.$inferSelect>
  badgeConfigs: Array<typeof badgeConfigs.$inferSelect>
  /** Only the earned badges get a `user_badges` row; the rest render locked. */
  awards: Array<typeof userBadges.$inferSelect>
  devices: Array<typeof sessions.$inferSelect>
  /** The section whose settings carry the pending acknowledgement. */
  pendingUndertakingSectionId: number
}

export type SeedFlowEntities =
  | LoginAndJoinLectureEntities
  | LiveLecturePhasesEntities
  | OnboardingEntities
  | DashboardHomeEntities
  | MasaiverseAccessEntities
  | MultiProgramStudentEntities
  | AppInstalledEntities
  | SectionDropdownBatchEntities
  | DiscussionsCancelledEnrollmentEntities
  | ProfilePageEntities

export type SeedFlowResult = {
  flowId: string
  entities: SeedFlowEntities
  testUsers: TestUser[]
  timing: Record<string, string>
}

export type SeedFlowModule = {
  meta: SeedFlowMeta
  seed: () => Promise<SeedFlowResult>
}

export function isLoginAndJoinLectureEntities(
  entities: SeedFlowEntities,
): entities is LoginAndJoinLectureEntities {
  return 'lecture' in entities && !('scheduleLectures' in entities)
}

export function isLiveLecturePhasesEntities(
  entities: SeedFlowEntities,
): entities is LiveLecturePhasesEntities {
  return 'lectures' in entities && 'beforeUnlock' in entities.lectures
}

export function isOnboardingEntities(
  entities: SeedFlowEntities,
): entities is OnboardingEntities {
  return 'sections' in entities
}

export function isMultiProgramStudentEntities(
  entities: SeedFlowEntities,
): entities is MultiProgramStudentEntities {
  return 'secondBatch' in entities && 'secondEnrollment' in entities
}

export function isDashboardHomeEntities(
  entities: SeedFlowEntities,
): entities is DashboardHomeEntities {
  return 'scheduleLectures' in entities && 'visibleAnnouncements' in entities
}
