/**
 * Legacy createTicketV2 audit fields — assignee info log, logstamps, and
 * timestamps written on ticket creation (ported from experience-api).
 */

import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { batchUser, batches, helpFaqs, users } from '@/db/schema'
import {
  ladderFromBatchSettings,
  trackForCategory,
} from '@/server/api/support/services/resolveAssignees'

const LEGACY_DEFAULT_ASSIGNEE_ID = Number(
  process.env.SUPPORT_FALLBACK_ASSIGNEE_ID ?? 1079,
)
const DISCUSSION_PC_FALLBACK_ASSIGNEE_ID = 300

export type BatchDuration = 'full-time' | 'part-time'

/** Matches legacy getBatchDurationOfUser (latest batch_user → batches.duration). */
export async function getBatchDurationOfUser(
  userId: number,
): Promise<BatchDuration> {
  const rows = await db
    .select({ duration: batches.duration })
    .from(batchUser)
    .innerJoin(batches, eq(batches.id, batchUser.batchId))
    .where(eq(batchUser.userId, userId))
    .orderBy(desc(batchUser.batchId))
    .limit(1)

  const duration = rows[0]?.duration
  if (duration === 'full-time' || duration === 'part-time') return duration
  return 'full-time'
}

type AssigneeUser = {
  email: string
  id: number
  name: string
}

async function loadAssigneeUser(userId: number): Promise<AssigneeUser | null> {
  const rows = await db
    .select({ email: users.email, id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return rows[0] ?? null
}

function assigneeLabel(user: AssigneeUser | null): string {
  if (!user) return 'unknown (unknown)'
  return `${user.email} (${user.id}) - ${user.name}`
}

function assigneeLabelWithoutName(user: AssigneeUser | null): string {
  if (!user) return 'unknown (unknown)'
  return `${user.email} (${user.id})`
}

export type CreateTicketAssignment = {
  assigneeId: number
  info: { log: string }
  logstamps: Record<string, string>
}

/** Resolve L1 assignee and build the legacy info / logstamps audit trail. */
export async function resolveCreateTicketAssignment(input: {
  batchId: number
  category: string
  questionId?: number | null
  timestamp: string
}): Promise<CreateTicketAssignment> {
  const info: { log: string } = { log: '' }
  const logstamps: Record<string, string> = {}
  const usesDiscussionPc = trackForCategory(input.category) === 'discussionPC'
  let assigneeId = LEGACY_DEFAULT_ASSIGNEE_ID
  let assigneeAssigned = false
  const questionId = input.questionId ?? null

  if (questionId != null && questionId > 0) {
    const faqRows = await db
      .select({ assignees: helpFaqs.assignees })
      .from(helpFaqs)
      .where(eq(helpFaqs.id, questionId))
      .limit(1)

    const l1 = Number(
      (faqRows[0]?.assignees as Record<string, unknown> | undefined)?.l1,
    )
    if (Number.isFinite(l1) && l1 > 0) {
      assigneeId = l1
      const assigneeUser = await loadAssigneeUser(l1)
      info.log += `Ticket assigned to L1 -> ${assigneeLabelWithoutName(assigneeUser)} at ${input.timestamp} based on question_id ${questionId}.\n`
      logstamps.L1_assigned_at = input.timestamp
      assigneeAssigned = true
    }
  }

  if (!assigneeAssigned) {
    const batchRows = await db
      .select({ settings: batches.settings })
      .from(batches)
      .where(eq(batches.id, input.batchId))
      .limit(1)

    const ladder = ladderFromBatchSettings(
      batchRows[0]?.settings,
      input.category,
    )
    if (ladder.l1 != null) {
      assigneeId = ladder.l1
      const assigneeUser = await loadAssigneeUser(ladder.l1)
      if (questionId) {
        info.log += `Question ID L1 assignee not found, ticket assigned to L1 -> ${assigneeLabel(assigneeUser)} at ${input.timestamp} based on batch_id ${input.batchId}.\n`
      } else {
        info.log += `Question ID not provided, ticket assigned to L1 -> ${assigneeLabel(assigneeUser)} at ${input.timestamp} based on batch_id ${input.batchId}.\n`
      }
      logstamps.L1_assigned_at = input.timestamp
      assigneeAssigned = true
    } else if (usesDiscussionPc) {
      assigneeId = DISCUSSION_PC_FALLBACK_ASSIGNEE_ID
      const assigneeUser = await loadAssigneeUser(assigneeId)
      info.log += `Discussion PC category (${input.category}) L1 not found, ticket assigned -> ${assigneeLabel(assigneeUser)} at ${input.timestamp} based on batch_id ${input.batchId}.\n`
      logstamps.assigned_at = input.timestamp
      assigneeAssigned = true
    }
  }

  if (!assigneeAssigned) {
    assigneeId = LEGACY_DEFAULT_ASSIGNEE_ID
    const assigneeUser = await loadAssigneeUser(assigneeId)
    if (questionId) {
      info.log += `Question ID L1 assignee not found and no batch assignee found, ticket assigned to default user -> ${assigneeLabel(assigneeUser)} at ${input.timestamp}.\n`
    } else {
      info.log += `Question ID not provided and no batch assignee found, ticket assigned to default user -> ${assigneeLabel(assigneeUser)} at ${input.timestamp}.\n`
    }
    logstamps.assigned_at = input.timestamp
  }

  return { assigneeId, info, logstamps }
}

/** Append the shared section / duration footer every createTicketV2 ticket gets. */
export function appendCreateTicketSectionInfo(input: {
  info: { log: string }
  activeSections: Array<string>
  duration: BatchDuration
}): { log: string } {
  input.info.log +=
    'When the ticket was raised, student was in these sections: '
  input.info.log += input.activeSections.join(', ')
  input.info.log += '.\n'
  input.info.log += `Student belongs to ${input.duration} batch.\n`
  input.info.log += `Ticket created on students.masaischool.com.\n`
  return input.info
}
