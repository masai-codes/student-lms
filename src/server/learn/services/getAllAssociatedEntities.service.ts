import { and, eq, inArray, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, lectures } from '@/db/schema'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import {
  makeAssociationNodeKey,
  parseAssociationNodeKey,
} from '@/server/learn/utils/associationGraphTypes'
import { buildAssociationGraph } from '@/server/learn/utils/buildAssociationGraph'
import { collectAssociatedNodeKeys } from '@/server/learn/utils/collectAssociatedNodeKeys'
import { dedupeLearnAssociatedItems } from '@/server/learn/utils/dedupeLearnAssociatedItems'
import { formatAssociatedMeta } from '@/server/learn/utils/formatAssociatedMeta'
import { readAssociatedLectureIds } from '@/server/learn/utils/parseLectureDataJson'
import { resolveLearnAssociatedKindFromLectureType } from '@/server/learn/utils/resolveLearnAssociatedKind'

export type AssociatedEntityKind = LearnAssociatedListItem['kind']

type LectureRow = {
  id: number
  title: string
  schedule: string | null
  type: string
  data: unknown
}

type AssignmentRow = {
  id: number
  title: string
  schedule: string | null
  data: unknown
}

function toLectureItem(row: LectureRow): LearnAssociatedListItem {
  return {
    id: row.id,
    kind: resolveLearnAssociatedKindFromLectureType(row.type),
    title: row.title,
    meta: formatAssociatedMeta(row.schedule),
  }
}

function toAssignmentItem(row: AssignmentRow): LearnAssociatedListItem {
  return {
    id: row.id,
    kind: 'assignment',
    title: row.title,
    meta: formatAssociatedMeta(row.schedule),
  }
}

/**
 * Resolves EVERY entity associated with the given lecture/resource/assignment —
 * the transitive closure across the section's association graph, in both
 * directions. A resource is a lecture row, so it shares the lecture node space.
 *
 * Optimised: it reads the section's lectures and assignments in exactly two
 * queries and does all traversal in memory (O(V + E)), replacing the previous
 * per-link re-scan that issued a fresh section query for every linked lecture.
 *
 * When the entity has no section (e.g. a recommended lecture) the section corpus
 * is unavailable, so we fall back to its direct forward links only.
 */
export async function getAllAssociatedEntities(input: {
  entityId: number
  entityKind: AssociatedEntityKind
  sectionId: number | null
  entityData: unknown
}): Promise<Array<LearnAssociatedListItem>> {
  const exclude = { kind: input.entityKind, id: input.entityId }

  if (input.sectionId == null) {
    return resolveDirectForwardItems(input.entityData, exclude)
  }

  const [lectureRows, assignmentRows] = await Promise.all([
    db
      .select({
        id: lectures.id,
        title: lectures.title,
        schedule: lectures.schedule,
        type: lectures.type,
        data: lectures.data,
      })
      .from(lectures)
      .where(and(eq(lectures.sectionId, input.sectionId), isNull(lectures.deletedAt))),
    db
      .select({
        id: assignments.id,
        title: assignments.title,
        schedule: assignments.schedule,
        data: assignments.data,
      })
      .from(assignments)
      .where(
        and(eq(assignments.sectionId, input.sectionId), isNull(assignments.deletedAt)),
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

  const lectureById = new Map(lectureRows.map(row => [row.id, row]))
  const assignmentById = new Map(assignmentRows.map(row => [row.id, row]))

  const items: Array<LearnAssociatedListItem> = []
  for (const key of reachable) {
    const { kind, id } = parseAssociationNodeKey(key)
    if (kind === 'lecture') {
      const row = lectureById.get(id)
      if (row) items.push(toLectureItem(row))
    } else {
      const row = assignmentById.get(id)
      if (row) items.push(toAssignmentItem(row))
    }
  }

  return dedupeLearnAssociatedItems(items, exclude)
}

async function resolveDirectForwardItems(
  entityData: unknown,
  exclude: { kind: AssociatedEntityKind; id: number },
): Promise<Array<LearnAssociatedListItem>> {
  const forwardIds = readAssociatedLectureIds(entityData)
  if (forwardIds.length === 0) return []

  const rows = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      schedule: lectures.schedule,
      type: lectures.type,
      data: lectures.data,
    })
    .from(lectures)
    .where(and(inArray(lectures.id, forwardIds), isNull(lectures.deletedAt)))

  return dedupeLearnAssociatedItems(rows.map(toLectureItem), exclude)
}
