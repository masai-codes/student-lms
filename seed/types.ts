import type {
  batches,
  lectures,
  profiles,
  sectionUser,
  sections,
  userBatchAdmissionData,
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

export type DashboardHomeEntities = {
  admin: typeof users.$inferSelect
  student: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  section: typeof sections.$inferSelect
  enrollment: typeof sectionUser.$inferSelect
  scheduleLectures: Array<typeof lectures.$inferSelect>
  scheduleAssignment: typeof import('@/db/schema').assignments.$inferSelect
  pendingCatchupLecture: typeof lectures.$inferSelect
  pendingAssignment: typeof import('@/db/schema').assignments.$inferSelect
  visibleAnnouncements: Array<typeof import('@/db/schema').announcements.$inferSelect>
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

export type SeedFlowEntities = LoginAndJoinLectureEntities | OnboardingEntities | DashboardHomeEntities

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

export function isOnboardingEntities(entities: SeedFlowEntities): entities is OnboardingEntities {
  return 'sections' in entities
}

export function isDashboardHomeEntities(entities: SeedFlowEntities): entities is DashboardHomeEntities {
  return 'scheduleLectures' in entities && 'visibleAnnouncements' in entities
}
