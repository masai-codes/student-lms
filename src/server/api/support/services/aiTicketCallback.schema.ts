import { z } from 'zod'

/**
 * Payload the AI ticket-resolution agent POSTs to `/api/support/ai/callback`
 * once a draft is ready (or has failed / handed off). `.passthrough()` at both
 * levels: the full envelope is stored as-is in `ai_ticket_drafts.agent_response`
 * (meta.category/subcategory, confidences, etc.), so an unrecognized extra
 * field from the agent should never fail validation.
 */
export const aiTicketCallbackSchema = z
  .object({
    ticket_id: z.number().int().positive(),
    conversation_turn: z.number().int().positive(),
    workflow_run_id: z.string().min(1),
    thread_id: z.string().min(1).nullish(),
    status: z.enum(['generating', 'ready', 'failed']),
    generated_message: z.string().nullish(),
    draft_kind: z.enum(['answer', 'clarifying_question', 'handoff']).nullish(),
    meta: z
      .object({
        is_answerable: z.boolean().nullish(),
        needs_human_review: z.boolean().nullish(),
        category: z.string().nullish(),
        subcategory: z.string().nullish(),
        category_confidence: z.number().nullish(),
        subcategory_confidence: z.number().nullish(),
        answer_confidence: z.number().nullish(),
        sources_used: z.array(z.string()).nullish(),
        escalation_reason: z.string().nullish(),
        sufficiency_reasoning: z.string().nullish(),
        clarification_phase: z.string().nullish(),
        clarification_exhausted: z.boolean().nullish(),
      })
      .passthrough()
      .nullish(),
    error: z.string().nullish(),
  })
  .passthrough()

export type AiTicketCallbackPayload = z.infer<typeof aiTicketCallbackSchema>
