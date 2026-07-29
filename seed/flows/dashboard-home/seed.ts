import type { SeedFlowResult, TestUser } from '../../types'
import { DEV_PASSWORD_PLAINTEXT } from '../../utils/constants'
import { buildDashboardHomeWorld } from './buildDashboardHomeWorld'
import { dashboardHomeConfig, DASHBOARD_HOME_FLOW_ID } from './config'

function buildTestUsers(
  world: Awaited<ReturnType<typeof buildDashboardHomeWorld>>,
): TestUser[] {
  return [
    {
      role: 'admin',
      email: world.admin.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: world.admin.id,
      name: world.admin.name,
    },
    {
      role: 'student',
      email: world.student.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: world.student.id,
      name: world.student.name,
    },
  ]
}

export async function seedDashboardHome(): Promise<SeedFlowResult> {
  const world = await buildDashboardHomeWorld(DASHBOARD_HOME_FLOW_ID)

  return {
    flowId: dashboardHomeConfig.id,
    entities: {
      admin: world.admin,
      student: world.student,
      batch: world.batch,
      section: world.section,
      enrollment: world.enrollment,
      scheduleLectures: world.scheduleLectures,
      scheduleAssignment: world.scheduleAssignment,
      pastIncompleteScheduleAssignment: world.pastIncompleteScheduleAssignment,
      pendingCatchupLecture: world.pendingCatchupLecture,
      pendingAssignment: world.pendingAssignment,
      visibleAnnouncements: world.visibleAnnouncements,
      visibleMessages: world.visibleMessages,
      productUpdates: world.productUpdates,
      exclusions: world.exclusions,
    },
    testUsers: buildTestUsers(world),
    timing: {
      scheduleWindowStart: 'today (IST)',
      scheduleWindowEnd: 'today + 6 days (IST)',
    },
  }
}
