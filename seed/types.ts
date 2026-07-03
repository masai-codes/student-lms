import type { batches, lectures, sectionUser, sections, users } from '@/db/schema'

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

export type SeedFlowResult = {
  flowId: string
  entities: LoginAndJoinLectureEntities
  testUsers: TestUser[]
  timing: Record<string, string>
}

export type SeedFlowModule = {
  meta: SeedFlowMeta
  seed: () => Promise<SeedFlowResult>
}
