/**
 * Server-to-server: fire the "draft a reply" trigger to the external AI
 * ticket-resolution agent, modeled on `triggerExperienceApiCommunityNotify.ts`.
 * This call only needs an acceptance ack — the agent does the actual drafting
 * out of band and calls our webhook (`/api/support/ai/callback`) later with the
 * result, correlated by `(ticket_id, conversation_turn, workflow_run_id)`.
 *
 * Env (student-lms):
 * - AI_TICKET_AGENT_TRIGGER_URL — full URL to POST the trigger payload to
 *   (not just a host — this is the exact endpoint, no path is appended;
 *   the agent serves it at `/api/v1/drafts/generate`)
 * - AI_TICKET_AGENT_INTERNAL_SECRET — shared secret, sent as both
 *   `x-ai-ticket-agent-secret` and the agent's `x-api-key` on this outbound
 *   call, and required on the inbound webhook
 * - AI_TICKET_AGENT_CALLBACK_BASE_URL — our own publicly reachable base url; the
 *   agent POSTs its answer to `${this}/api/support/ai/callback`
 */
const HEADER = 'x-ai-ticket-agent-secret'
/** Bounds the trigger call so ticket creation / reply submission never hangs on it — this is only an "accepted" ack, never the actual answer. */
const REQUEST_TIMEOUT_MS = 4000

function triggerUrl(): string | null {
  const raw = process.env.AI_TICKET_AGENT_TRIGGER_URL?.trim()
  return raw || null
}

function secret(): string | null {
  const raw = process.env.AI_TICKET_AGENT_INTERNAL_SECRET?.trim()
  return raw || null
}

function callbackUrl(): string | null {
  const raw = process.env.AI_TICKET_AGENT_CALLBACK_BASE_URL?.trim()
  if (!raw) return null
  return `${raw.replace(/\/$/, '')}/api/support/ai/callback`
}

export type AiTicketAgentMessage = {
  role: 'user' | 'assistant'
  content: string
}

/** The agent's entity-category enum spells the general bucket with a space. */
const AGENT_CATEGORIES = new Set([
  'lecture',
  'assignment',
  'resource',
  'evaluation',
  'general query',
])

function agentCategory(category: string): string | null {
  const normalized = category === 'general_query' ? 'general query' : category
  return AGENT_CATEGORIES.has(normalized) ? normalized : null
}

/** The agent rejects non-positive ids; absent context must travel as null. */
function positiveOrNull(value: number): number | null {
  return Number.isFinite(value) && value > 0 ? value : null
}

/**
 * Fires the trigger and reports whether the agent acked it (2xx). `false`
 * (any misconfiguration, network error, non-2xx, or timeout) tells the caller
 * no AI attempt will happen for this turn, so it should resolve the draft with
 * the fallback immediately. Never throws.
 */
export async function triggerAiTicketAgent(input: {
  ticketId: number
  conversationTurn: number
  workflowRunId: string
  userId: number
  batchId: number
  entityId: number
  category: string
  messages: Array<AiTicketAgentMessage>
}): Promise<boolean> {
  const url = triggerUrl()
  const sec = secret()
  const callback = callbackUrl()
  if (!url || !sec || !callback) {
    console.warn(
      '[aiTicketAgent] Skip trigger: set AI_TICKET_AGENT_TRIGGER_URL, AI_TICKET_AGENT_INTERNAL_SECRET, AI_TICKET_AGENT_CALLBACK_BASE_URL',
    )
    return false
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [HEADER]: sec,
        'x-api-key': sec,
      },
      body: JSON.stringify({
        ticket_id: input.ticketId,
        conversation_turn: input.conversationTurn,
        workflow_run_id: input.workflowRunId,
        user_id: positiveOrNull(input.userId),
        batch_id: positiveOrNull(input.batchId),
        entity_id: positiveOrNull(input.entityId),
        category: agentCategory(input.category),
        messages: input.messages,
        callback_url: callback,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn(
        '[aiTicketAgent] trigger HTTP',
        res.status,
        text.slice(0, 200),
      )
      return false
    }
    return true
  } catch (e) {
    console.warn('[aiTicketAgent] trigger failed', e)
    return false
  }
}
