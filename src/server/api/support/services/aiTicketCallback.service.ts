/**
 * Support module — resolve the AI agent's webhook callback.
 *
 * `resolveAiTicketDraftCallback` runs inside one row-locked transaction (a
 * `SELECT ... FOR UPDATE` on the correlated draft) so a concurrent duplicate
 * webhook can never double-send. DB failures while sending are left to
 * propagate as a real 500 — unlike the best-effort create/reply trigger path,
 * this is the delivery channel, so the agent should retry.
 */

import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { aiTicketDrafts, comments, tickets } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import type { AiTicketCallbackPayload } from '@/server/api/support/services/aiTicketCallback.schema'
import { sendFallbackForDraft } from '@/server/api/support/services/aiTicketDraftFallback.service'
import { supportNow } from '@/server/api/support/services/supportTime'

export type AiDraftSendDecision = 'send_ai' | 'send_fallback' | 'wait'

/**
 * Pure, unit-testable send-decision. `ready` with an empty/missing message is
 * never shown as-is (falls through to the fallback); `generating` arriving as
 * a "final" webhook, or any unrecognized `draft_kind`, is never guessed at —
 * the draft just keeps waiting for a real terminal callback.
 */
export function evaluateAiDraftSendDecision(payload: {
  status: 'generating' | 'ready' | 'failed'
  draft_kind?: 'answer' | 'clarifying_question' | 'handoff' | null
  generated_message?: string | null
}): AiDraftSendDecision {
  if (
    payload.status === 'ready' &&
    (payload.draft_kind === 'answer' ||
      payload.draft_kind === 'clarifying_question')
  ) {
    return payload.generated_message?.trim() ? 'send_ai' : 'send_fallback'
  }
  if (payload.status === 'failed' || payload.draft_kind === 'handoff') {
    return 'send_fallback'
  }
  return 'wait'
}

export type AiTicketCallbackOutcome =
  | 'sent_ai'
  | 'sent_fallback'
  | 'waiting'
  | 'duplicate'
  | 'ticket_not_found'

export async function resolveAiTicketDraftCallback(
  payload: AiTicketCallbackPayload,
): Promise<{ outcome: AiTicketCallbackOutcome }> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(aiTicketDrafts)
      .where(
        and(
          eq(aiTicketDrafts.ticketId, payload.ticket_id),
          eq(aiTicketDrafts.conversationTurn, payload.conversation_turn),
          eq(aiTicketDrafts.workflowRunId, payload.workflow_run_id),
        ),
      )
      .for('update')

    if (rows.length === 0) {
      throw new ApiError(
        404,
        'AI_TICKET_DRAFT_NOT_FOUND',
        'Draft not found for ticket, turn, and workflow run.',
      )
    }
    const draft = rows[0]

    // Duplicate/late webhook — already resolved, log only, never re-send.
    if (draft.sentCommentId != null) {
      return { outcome: 'duplicate' as const }
    }

    await tx
      .update(aiTicketDrafts)
      .set({
        agentResponse: payload,
        generatedMessage: payload.generated_message ?? '',
        status: payload.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(aiTicketDrafts.id, draft.id))

    const decision = evaluateAiDraftSendDecision(payload)

    if (decision === 'wait') {
      return { outcome: 'waiting' as const }
    }

    if (decision === 'send_fallback') {
      // agent_response was just written above — that's already proof this
      // draft is resolved, so don't also clobber the agent's true status.
      await sendFallbackForDraft(
        {
          id: draft.id,
          ticketId: draft.ticketId,
          conversationTurn: draft.conversationTurn,
        },
        { dbOrTx: tx, markFailed: false },
      )
      return { outcome: 'sent_fallback' as const }
    }

    // send_ai — re-verify the ticket still exists between trigger and callback.
    const ticketRows = await tx
      .select({ id: tickets.id, assigneeId: tickets.assigneeId })
      .from(tickets)
      .where(eq(tickets.id, draft.ticketId))
    if (ticketRows.length === 0) {
      console.error(
        `[support] ai callback: ticket ${draft.ticketId} not found, skipping AI comment`,
      )
      return { outcome: 'ticket_not_found' as const }
    }
    const ticket = ticketRows[0]

    const now = supportNow()
    const [result] = await tx.insert(comments).values({
      ticketId: draft.ticketId,
      userId: ticket.assigneeId,
      message: payload.generated_message!.trim(),
      public: 1,
      createdAt: now,
      updatedAt: now,
      data: { source: 'ai', aiTicketDraftId: draft.id },
    })
    await tx
      .update(aiTicketDrafts)
      .set({
        sentCommentId: Number(result.insertId),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(aiTicketDrafts.id, draft.id))
    await tx
      .update(tickets)
      .set({ updatedAt: now })
      .where(eq(tickets.id, draft.ticketId))

    return { outcome: 'sent_ai' as const }
  })
}
