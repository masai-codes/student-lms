/**
 * Support module — the AI draft's "no usable answer" fallback.
 *
 * Shared by (a) an immediate trigger-call failure and (b) the webhook's
 * `send_fallback` decision — one implementation, one behavior. (A later
 * staleness sweep for the "agent never calls back at all" case will reuse this
 * too, once `getTicketThread` is wired to call it.)
 *
 * Turn 1 gets the legacy templated first-response comment (identical to what
 * `createTicket` used to insert synchronously). Turn > 1 gets **no comment at
 * all** — a failed/handoff reply-turn just waits for a human coordinator,
 * exactly as if there were no AI.
 *
 * `sent_comment_id` can't hold a sentinel for that no-comment case (it FK's to
 * `comments.id`), so the draft's `status` is stamped `failed` as the only
 * other "resolved" signal available — but **only** when the caller has no
 * better signal already on the row. The webhook path (`markFailed: false`)
 * already wrote a real `agent_response` moments earlier in the same
 * transaction, which is itself proof the draft is resolved, so it's left
 * untouched there instead of clobbering the agent's true reported status. A
 * trigger-call failure never gets a response at all, so it still needs the
 * stamp (the default).
 */

import { and, eq, isNull, lt } from 'drizzle-orm'
import { db } from '@/db'
import { aiTicketDrafts, comments, tickets } from '@/db/schema'
import { buildFirstTemplateResponse } from '@/server/api/support/services/ticketReplyTemplate'
import { supportNow } from '@/server/api/support/services/supportTime'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const DEFAULT_STALE_TIMEOUT_MINUTES = 5

function staleTimeoutMinutes(): number {
  const parsed = Number(process.env.AI_TICKET_DRAFT_TIMEOUT_MINUTES)
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_STALE_TIMEOUT_MINUTES
}

export async function sendFallbackForDraft(
  draft: { id: number; ticketId: number; conversationTurn: number },
  options: {
    dbOrTx?: typeof db | DbTransaction
    /** Set false when the caller already wrote a resolved `agent_response`
     * onto this row (the webhook path) — there's nothing to signal. */
    markFailed?: boolean
  } = {},
): Promise<void> {
  const { dbOrTx = db, markFailed = true } = options

  if (draft.conversationTurn !== 1) {
    if (markFailed) {
      await dbOrTx
        .update(aiTicketDrafts)
        .set({ status: 'failed', updatedAt: new Date().toISOString() })
        .where(eq(aiTicketDrafts.id, draft.id))
    }
    return
  }

  const ticketRows = await dbOrTx
    .select({
      data: tickets.data,
      category: tickets.category,
      assigneeId: tickets.assigneeId,
    })
    .from(tickets)
    .where(eq(tickets.id, draft.ticketId))

  if (ticketRows.length === 0) {
    console.error(
      `[support] ai fallback: ticket ${draft.ticketId} not found, skipping template reply`,
    )
    return
  }
  const ticket = ticketRows[0]
  const batchId = ticket.data?.batch_id ? Number(ticket.data.batch_id) : null

  const { message, displayName } = await buildFirstTemplateResponse({
    batchId,
    category: ticket.category,
    assigneeId: ticket.assigneeId,
  })

  const now = supportNow()
  const [result] = await dbOrTx.insert(comments).values({
    ticketId: draft.ticketId,
    userId: ticket.assigneeId,
    message,
    public: 1,
    createdAt: now,
    updatedAt: now,
    data: {
      firstTemplateResponse: true,
      ticket_level: 'l1',
      displayName,
    },
  })

  await dbOrTx
    .update(aiTicketDrafts)
    .set({
      sentCommentId: Number(result.insertId),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(aiTicketDrafts.id, draft.id))
}

/**
 * Lazily resolves any draft for this ticket stuck in `generating` past the
 * timeout — the agent crashed, or its webhook never arrived. Called from the
 * top of `getTicketThread` so a student who reopens the ticket is never left
 * waiting on a dead draft forever; this is not a cron, just "resolve it the
 * next time anyone looks." Best-effort: a failure here must never break
 * reading the thread.
 */
export async function resolveStaleAiDraftIfNeeded(
  ticketId: number,
): Promise<void> {
  try {
    const cutoff = new Date(
      Date.now() - staleTimeoutMinutes() * 60_000,
    ).toISOString()

    await db.transaction(async (tx) => {
      const staleDrafts = await tx
        .select({
          id: aiTicketDrafts.id,
          ticketId: aiTicketDrafts.ticketId,
          conversationTurn: aiTicketDrafts.conversationTurn,
        })
        .from(aiTicketDrafts)
        .where(
          and(
            eq(aiTicketDrafts.ticketId, ticketId),
            eq(aiTicketDrafts.status, 'generating'),
            isNull(aiTicketDrafts.sentCommentId),
            lt(aiTicketDrafts.createdAt, cutoff),
          ),
        )
        .for('update')

      for (const draft of staleDrafts) {
        await sendFallbackForDraft(draft, { dbOrTx: tx })
      }
    })
  } catch (error) {
    console.error(
      `[support] resolveStaleAiDraftIfNeeded failed for ticket ${ticketId}`,
      error,
    )
  }
}
