import { and, eq, inArray, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, lectures, sections, users } from '@/db/schema'
import { fetchLectureAttendanceSummaries } from '@/server/attendance/services/fetchLectureAttendanceSummaries'
import type { LearningItem } from '@/server/learn/types'
import { fetchLatestSubmissionByAssignment } from '@/server/learn/queries/fetchLatestSubmissionByAssignment'
import {
  makeAssociationNodeKey,
  parseAssociationNodeKey,
} from '@/server/learn/utils/associationGraphTypes'
import { buildAssociationGraph } from '@/server/learn/utils/buildAssociationGraph'
import {
  buildAssociatedAssignmentItem,
  buildAssociatedLectureItem,
  type AssociatedLectureRow,
} from '@/server/learn/utils/buildAssociatedLearningItems'
import { collectAssociatedNodeKeys } from '@/server/learn/utils/collectAssociatedNodeKeys'
import { readAssociatedLectureIds } from '@/server/learn/utils/parseLectureDataJson'

export type AssociatedEntityKind = 'lecture' | 'resource' | 'assignment'

type LectureQueryRow = AssociatedLectureRow & { data: unknown }

const lectureColumns = {
  id: lectures.id,
  title: lectures.title,
  category: lectures.category,
  type: lectures.type,
  optional: lectures.optional,
  schedule: lectures.schedule,
  concludes: lectures.concludes,
  sectionId: lectures.sectionId,
  week: lectures.week,
  module: lectures.module,
  hostName: users.name,
  zoomLink: lectures.zoomLink,
  isNewZoomRedirection: lectures.isNewZoomRedirection,
  sectionSettings: sections.settings,
  data: lectures.data,
}

const assignmentColumns = {
  id: assignments.id,
  title: assignments.title,
  category: assignments.category,
  type: assignments.type,
  optional: assignments.optional,
  schedule: assignments.schedule,
  concludes: assignments.concludes,
  week: assignments.week,
  module: assignments.module,
  hostName: users.name,
  showScores: assignments.showScores,
  settings: assignments.settings,
  data: assignments.data,
}

function attendanceInputsFor(rows: Array<LectureQueryRow>) {
  return rows
    .filter((row) => row.sectionId != null)
    .map((row) => ({
      lectureId: row.id,
      sectionId: row.sectionId!,
      schedule: row.schedule,
      concludes: row.concludes,
      optional: row.optional,
    }))
}

/**
 * Resolves EVERY entity associated with the given lecture/resource/assignment —
 * the transitive closure across the section's association graph, in both
 * directions — as full `LearningItem`s so the UI renders the same card as the
 * `/learn` listing. A resource is a lecture row, so it shares the lecture nodes.
 *
 * Optimised: reads the section's lectures + assignments once, traverses the
 * graph in memory (O(V + E)), then enriches only the reachable rows with a
 * single attendance batch (lectures) and submission batch (assignments) before
 * mapping through the shared listing-card builders.
 *
 * When the entity has no section (e.g. a recommended lecture) the section corpus
 * is unavailable, so we fall back to its direct forward links only.
 */
export async function getAllAssociatedEntities(input: {
  entityId: number
  entityKind: AssociatedEntityKind
  sectionId: number | null
  entityData: unknown
  userId: number
  nowMs: number
}): Promise<Array<LearningItem>> {
  if (input.sectionId == null) {
    return resolveDirectForwardItems(input)
  }

  const [lectureRows, assignmentRows] = await Promise.all([
    db
      .select(lectureColumns)
      .from(lectures)
      .leftJoin(users, eq(lectures.hostId, users.id))
      .leftJoin(sections, eq(lectures.sectionId, sections.id))
      .where(
        and(
          eq(lectures.sectionId, input.sectionId),
          isNull(lectures.deletedAt),
        ),
      ),
    db
      .select(assignmentColumns)
      .from(assignments)
      .leftJoin(users, eq(assignments.userId, users.id))
      .where(
        and(
          eq(assignments.sectionId, input.sectionId),
          isNull(assignments.deletedAt),
        ),
      ),
  ])

  const graph = buildAssociationGraph({
    lectures: lectureRows,
    assignments: assignmentRows,
  })

  const startKind = input.entityKind === 'assignment' ? 'assignment' : 'lecture'
  const reachable = collectAssociatedNodeKeys(
    graph,
    makeAssociationNodeKey(startKind, input.entityId),
  )

  const lectureById = new Map(lectureRows.map((row) => [row.id, row]))
  const assignmentById = new Map(assignmentRows.map((row) => [row.id, row]))

  const reachableLectureRows: Array<LectureQueryRow> = []
  const reachableAssignmentIds: Array<number> = []
  for (const key of reachable) {
    const { kind, id } = parseAssociationNodeKey(key)
    if (kind === 'lecture') {
      const row = lectureById.get(id)
      if (row) reachableLectureRows.push(row)
    } else if (assignmentById.has(id)) {
      reachableAssignmentIds.push(id)
    }
  }

  const [attendanceByLectureId, submissionByAssignmentId] = await Promise.all([
    fetchLectureAttendanceSummaries(
      input.userId,
      attendanceInputsFor(reachableLectureRows),
      input.nowMs,
    ),
    fetchLatestSubmissionByAssignment(input.userId, reachableAssignmentIds),
  ])

  const items: Array<LearningItem> = []
  for (const key of reachable) {
    const { kind, id } = parseAssociationNodeKey(key)
    if (kind === 'lecture') {
      const row = lectureById.get(id)
      if (row) {
        items.push(
          buildAssociatedLectureItem(
            row,
            attendanceByLectureId.get(id) ?? null,
            input.nowMs,
          ),
        )
      }
    } else {
      const row = assignmentById.get(id)
      if (row) {
        items.push(
          buildAssociatedAssignmentItem(
            row,
            submissionByAssignmentId.get(id) ?? null,
            input.nowMs,
          ),
        )
      }
    }
  }

  return items
}

async function resolveDirectForwardItems(input: {
  entityData: unknown
  userId: number
  nowMs: number
}): Promise<Array<LearningItem>> {
  const forwardIds = readAssociatedLectureIds(input.entityData)
  if (forwardIds.length === 0) return []

  const rows: Array<LectureQueryRow> = await db
    .select(lectureColumns)
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .leftJoin(sections, eq(lectures.sectionId, sections.id))
    .where(and(inArray(lectures.id, forwardIds), isNull(lectures.deletedAt)))

  const attendanceByLectureId = await fetchLectureAttendanceSummaries(
    input.userId,
    attendanceInputsFor(rows),
    input.nowMs,
  )

  return rows.map((row) =>
    buildAssociatedLectureItem(
      row,
      attendanceByLectureId.get(row.id) ?? null,
      input.nowMs,
    ),
  )
}
