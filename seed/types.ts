import type {
  batches,
  lectures,
  lecturesAi,
  profiles,
  sectionUser,
  sections,
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
  batch: typeof batches.$inferSelect
  section: typeof sections.$inferSelect
  enrollment: typeof sectionUser.$inferSelect
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
  }
  attendanceOffExtras: {
    associatedLecture: typeof lectures.$inferSelect
  }
  transcriptExtras: {
    segmentedAi: typeof lecturesAi.$inferSelect
    plainTextAi: typeof lecturesAi.$inferSelect
  }
  attendanceOnExtras: {
    lecturesAi: typeof import('@/db/schema').lecturesAi.$inferSelect
    associatedLecture: typeof lectures.$inferSelect
    associatedNotesLecture: typeof lectures.$inferSelect
    associatedAssignment: typeof import('@/db/schema').assignments.$inferSelect
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
}

export type SeedFlowEntities =
  | LoginAndJoinLectureEntities
  | LiveLecturePhasesEntities
  | OnboardingEntities
  | DashboardHomeEntities
  | MasaiverseAccessEntities
  | MultiProgramStudentEntities
  | AppInstalledEntities

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
