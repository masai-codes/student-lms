import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batches, users, profiles, sectionUser, sections } from '@/db/schema'
import { resolveStudentCode } from '@/server/users/getStudentCode'
import {
  arr,
  asRecord,
  computeCourseProgress,
  readCourseTimeline,
  resolveCourseTitle,
  resolveInstituteName,
  str,
} from '@/server/api/course/courseMeta'

export interface CoursePerson {
  name: string
  designation: string
  avatarUrl: string | null
}

export interface CourseRoleGroup {
  role: string
  people: CoursePerson[]
}

export interface CourseTimelineItem {
  date: string
  label: string
  status: 'completed' | 'inprogress' | 'upcoming'
}

export interface CourseStructureModule {
  code: string
  title: string
  status: 'completed' | 'inprogress' | 'upcoming'
  topics: string[]
}

export interface CourseResource {
  title: string
  uploadedOn: string
  url: string | null
}

export interface CourseBatchData {
  batchId: number
  courseTitle: string
  instituteName: string
  courseImage: string | null
  courseDetails: string[]
  courseProgress: number
  studentCode: string
  courseTimeline: CourseTimelineItem[]
  courseStructure: CourseStructureModule[]
  resources: CourseResource[]
  supportGroups: CourseRoleGroup[]
  showAttendanceReport: boolean
  showEvaluationReport: boolean
}

function computeTimelineStatuses(
  items: Array<{ date: string; label: string }>,
): CourseTimelineItem[] {
  const now = Date.now()
  let foundInProgress = false

  // Walk from last to first to find the first upcoming after a completed run
  const parsed = items.map((item) => ({
    ...item,
    ts: new Date(item.date).getTime(),
  }))

  return parsed.map((item, i) => {
    const completed = item.ts <= now
    if (!completed && !foundInProgress) {
      foundInProgress = true
      return {
        date: item.date,
        label: item.label,
        status: 'inprogress' as const,
      }
    }
    if (!completed)
      return { date: item.date, label: item.label, status: 'upcoming' as const }
    // Completed — if the next one is also completed, it's done
    // Check if *all* remaining are also completed (edge: last milestone)
    const nextUncompleted = parsed.slice(i + 1).some((x) => x.ts > now)
    if (!nextUncompleted && i === parsed.length - 1 && completed) {
      return {
        date: item.date,
        label: item.label,
        status: 'completed' as const,
      }
    }
    return { date: item.date, label: item.label, status: 'completed' as const }
  })
}

async function buildSupportGroups(
  settings: Record<string, unknown>,
): Promise<CourseRoleGroup[]> {
  const support = arr<unknown>(settings.curriculumnSupport)
  const groups = support
    .map((g) => {
      const group = asRecord(g)
      return {
        role: str(group.role),
        userIds: arr<unknown>(group.users)
          .map(Number)
          .filter((id) => !isNaN(id) && id > 0),
      }
    })
    .filter((g) => g.role && g.userIds.length > 0)

  const allIds = [...new Set(groups.flatMap((g) => g.userIds))]
  if (allIds.length === 0) return []

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      title: users.title,
      meta: users.meta,
      profilePhotoPath: users.profilePhotoPath,
    })
    .from(users)
    .where(inArray(users.id, allIds))

  const profileRows = await db
    .select({ userId: profiles.userId, meta: profiles.meta })
    .from(profiles)
    .where(and(inArray(profiles.userId, allIds), isNull(profiles.deletedAt)))

  const profileMetaMap = new Map(
    profileRows.map((p) => [p.userId, asRecord(p.meta)]),
  )

  const userMap = new Map(userRows.map((u) => [u.id, u]))

  function resolveAvatar(userId: number): string | null {
    const profileMeta = profileMetaMap.get(userId)
    const u = userMap.get(userId)
    return (
      str(profileMeta?.profile_pic) ||
      str(asRecord(u?.meta).profile_pic) ||
      str(u?.profilePhotoPath) ||
      null
    )
  }

  return groups.map((g) => ({
    role: g.role,
    people: g.userIds.map((id) => {
      const u = userMap.get(id)
      return {
        name: u?.name ?? 'NA',
        designation: u?.title ?? '',
        avatarUrl: resolveAvatar(id),
      }
    }),
  }))
}

export async function getCourseBatchData(
  batchId: number,
  userId: number,
): Promise<CourseBatchData | null> {
  // Verify enrollment
  const [enrollment] = await db
    .select({ id: sectionUser.id })
    .from(sectionUser)
    .innerJoin(sections, eq(sectionUser.sectionId, sections.id))
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sections.batchId, batchId),
        isNull(sectionUser.deletedAt),
        isNull(sections.deletedAt),
      ),
    )
    .limit(1)

  if (!enrollment) return null

  const [batchRow] = await db
    .select({
      id: batches.id,
      name: batches.name,
      meta: batches.meta,
      settings: batches.settings,
    })
    .from(batches)
    .where(and(eq(batches.id, batchId), isNull(batches.deletedAt)))
    .limit(1)

  if (!batchRow) return null

  // Student code is per batch enrolment (batch_user), not users.username.
  const studentCode = await resolveStudentCode(userId, batchId)

  const meta = asRecord(batchRow.meta)
  const settings = asRecord(batchRow.settings)

  const courseTitle = resolveCourseTitle(meta, batchRow.name)
  const instituteName = resolveInstituteName(meta)
  const courseImage = str(meta.courseImage ?? meta.courseLogo) || null
  const courseDetails = arr<unknown>(meta.courseDetails)
    .map((d) => str(d))
    .filter(Boolean)

  const rawTimeline = readCourseTimeline(meta)
  const courseTimeline = computeTimelineStatuses(rawTimeline)

  // Shared with the /my-programs listing so the two surfaces can never disagree.
  const courseProgress = computeCourseProgress(rawTimeline)

  const courseStructure = arr<unknown>(meta.courseStructure).map((m) => {
    const mod = asRecord(m)
    return {
      code: '',
      title: str(mod.moduleName),
      status: 'upcoming' as const,
      topics: arr<unknown>(mod.moduleDetails)
        .map((t) => str(t))
        .filter(Boolean),
    }
  })

  const resources = arr<unknown>(meta.resources).map((r) => {
    const res = asRecord(r)
    return {
      title: str(res.title),
      uploadedOn: str(res.uploadDate ?? res.uploadedOn ?? res.date),
      url: str(res.resource ?? res.url ?? res.pdfUrl) || null,
    }
  })

  const supportGroups = await buildSupportGroups(settings)

  return {
    batchId,
    courseTitle,
    instituteName,
    courseImage,
    courseDetails,
    courseProgress,
    studentCode,
    courseTimeline,
    courseStructure,
    resources,
    supportGroups,
    showAttendanceReport: settings.showAttendanceReport === true,
    showEvaluationReport: settings.showEvaluationReport === true,
  }
}
