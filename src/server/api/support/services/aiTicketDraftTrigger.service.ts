/**
 * Support module — kick off an AI draft for one conversation turn.
 *
 * Called from both `createTicket` (turn 1) and `addReply` (turn 2, 3, …) once
 * the triggering row is already committed, so the history this reads back
 * always includes the message that triggered it. Never throws — a failure
 * here must not fail ticket creation / reply submission.
 */

import { randomUUID } from 'node:crypto'
import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { aiTicketDrafts, comments, tickets } from '@/db/schema'
import type { AiTicketAgentMessage } from '@/server/api/support/services/aiTicketAgentTrigger.service'
import { triggerAiTicketAgent } from '@/server/api/support/services/aiTicketAgentTrigger.service'
import { sendFallbackForDraft } from '@/server/api/support/services/aiTicketDraftFallback.service'

/** 1 for a ticket's first turn, else one more than the highest turn already drafted. */
export async function nextConversationTurn(ticketId: number): Promise<number> {
  const [row] = await db
    .select({
      maxTurn: sql<number | null>`max(${aiTicketDrafts.conversationTurn})`,
    })
    .from(aiTicketDrafts)
    .where(eq(aiTicketDrafts.ticketId, ticketId))
  return (row?.maxTurn ?? 0) + 1
}

/** The full public conversation so far, oldest → newest, as {role, content}. */
async function buildConversationMessages(ticket: {
  id: number
  userId: number
  message: string
}): Promise<Array<AiTicketAgentMessage>> {
  const commentRows = await db
    .select({ authorId: comments.userId, message: comments.message })
    .from(comments)
    .where(and(eq(comments.ticketId, ticket.id), eq(comments.public, 1)))
    .orderBy(asc(comments.id))

  return [
    { role: 'user', content: ticket.message },
    ...commentRows.map(
      (c): AiTicketAgentMessage => ({
        role: c.authorId === ticket.userId ? 'user' : 'assistant',
        content: c.message,
      }),
    ),
  ]
}

export async function triggerAiTicketDraft(input: {
  ticketId: number
}): Promise<void> {
  try {
    const ticketRows = await db
      .select({
        id: tickets.id,
        userId: tickets.userId,
        message: tickets.message,
        category: tickets.category,
        data: tickets.data,
      })
      .from(tickets)
      .where(eq(tickets.id, input.ticketId))
    if (ticketRows.length === 0) return
    const ticket = ticketRows[0]

    const messages = await buildConversationMessages(ticket)
    const conversationTurn = await nextConversationTurn(input.ticketId)
    const workflowRunId = randomUUID()

    const [inserted] = await db.insert(aiTicketDrafts).values({
      ticketId: input.ticketId,
      conversationTurn,
      workflowRunId,
      generatedMessage: '',
      status: 'generating',
    })
    const draftId = Number(inserted.insertId)

    const batchId = ticket.data?.batch_id ? Number(ticket.data.batch_id) : 0
    const entityId =
      ticket.data?.entity_id != null ? Number(ticket.data.entity_id) : 0

    const accepted = await triggerAiTicketAgent({
      ticketId: input.ticketId,
      conversationTurn,
      workflowRunId,
      userId: ticket.userId,
      batchId,
      entityId,
      category: ticket.category,
      messages,
    })

    if (!accepted) {
      await sendFallbackForDraft({
        id: draftId,
        ticketId: input.ticketId,
        conversationTurn,
      })
    }
  } catch (error) {
    console.error(
      `[support] triggerAiTicketDraft failed for ticket ${input.ticketId}`,
      error,
    )
  }
}
