/**
 * Legacy tickets.info audit — parse, append log lines, build mutation patches.
 * Log strings mirror experience-api; timestamps use {@link supportNow} format.
 */

export type TicketInfo = Record<string, unknown> & { log?: string }

export function parseTicketInfo(raw: unknown): TicketInfo {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) }
  }
  return {}
}

export function appendInfoLog(info: TicketInfo, line: string): TicketInfo {
  const trimmed = line.trim()
  if (!trimmed) return info
  const normalized = trimmed.endsWith('\n') ? trimmed : `${trimmed}\n`
  const existing = typeof info.log === 'string' ? info.log : ''
  return { ...info, log: existing ? `${existing}${normalized}` : normalized }
}

function ordinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

export function patchEscalationAudit(input: {
  info: unknown
  logstamps: Record<string, unknown> | null | undefined
  meta: Record<string, unknown> | null | undefined
  now: string
  fromLevel: string
  toLevel: string
  currentAssigneeId: number
  nextAssigneeId: number
  nextAssigneeLabel?: string | null
}): {
  info: TicketInfo
  logstamps: Record<string, unknown>
  meta: Record<string, unknown>
} {
  const from = input.fromLevel.toUpperCase()
  const to = input.toLevel.toUpperCase()
  let info = appendInfoLog(
    parseTicketInfo(input.info),
    `Ticket status changed to re-opened at ${input.now}.`,
  )
  info = appendInfoLog(
    info,
    `Ticket escalated from ${from} to ${to} at ${input.now}. Previous assignee_id: ${input.currentAssigneeId}, New assignee_id: ${input.nextAssigneeId}.`,
  )
  info = appendInfoLog(
    info,
    input.nextAssigneeLabel
      ? `Escalated to ${to} -> ${input.nextAssigneeLabel}.`
      : `Escalated to ${to} -> assignee_id: ${input.nextAssigneeId}.`,
  )

  const logstamps = { ...(input.logstamps ?? {}) }
  logstamps.reopened_at = input.now
  logstamps[`escalated_to_${input.toLevel}_at`] = input.now
  logstamps.previous_assignee_id = input.currentAssigneeId
  logstamps.new_assignee_id = input.nextAssigneeId

  const meta = { ...(input.meta ?? {}) }
  meta.escalation_count = Number(meta.escalation_count ?? 0) + 1

  return { info, logstamps, meta }
}

export function patchReopenAudit(input: {
  info: unknown
  logstamps: Record<string, unknown> | null | undefined
  meta: Record<string, unknown> | null | undefined
  now: string
  status: string
  assigneeId: number
}): {
  info: TicketInfo
  logstamps: Record<string, unknown>
  meta: Record<string, unknown>
} {
  const prefix =
    input.status === 'resolved'
      ? 'Ticket was marked resolved manually, but student has requested to reopen the ticket.'
      : 'Ticket is being reopened from closed status. Student requested to re-open.'

  const meta = { ...(input.meta ?? {}) }
  const totalReopenCount = Number(meta.reopen_count ?? 0) + 1
  const assigneeReopenCounts = {
    ...((meta.assignee_reopen_counts as Record<string, number> | undefined) ??
      {}),
  }
  const assigneeKey = String(input.assigneeId)
  const assigneeReopenCount = Number(assigneeReopenCounts[assigneeKey] ?? 0) + 1
  assigneeReopenCounts[assigneeKey] = assigneeReopenCount

  const reopenHistory = Array.isArray(meta.reopen_history)
    ? [...meta.reopen_history]
    : []
  reopenHistory.push({
    reopen_number: totalReopenCount,
    reopened_at: input.now,
    assignee_id: input.assigneeId,
    assignee_reopen_count: assigneeReopenCount,
  })

  meta.reopen_count = totalReopenCount
  meta.reopen_history = reopenHistory
  meta.assignee_reopen_counts = assigneeReopenCounts
  meta.last_reopened_at = input.now
  meta.last_reopened_assignee_id = input.assigneeId

  let info = appendInfoLog(parseTicketInfo(input.info), prefix)
  info = appendInfoLog(
    info,
    `Ticket reopened for the ${ordinal(totalReopenCount)} time (${ordinal(assigneeReopenCount)} time with assignee_id: ${input.assigneeId}) at ${input.now}.`,
  )

  const logstamps = { ...(input.logstamps ?? {}) }
  logstamps.reopened_at = input.now
  logstamps[`reopened_at_${totalReopenCount}`] = input.now
  logstamps[`reopened_assignee_id_${totalReopenCount}`] = input.assigneeId
  logstamps[`reopened_at_assignee_${assigneeKey}_${assigneeReopenCount}`] =
    input.now

  return { info, logstamps, meta }
}
