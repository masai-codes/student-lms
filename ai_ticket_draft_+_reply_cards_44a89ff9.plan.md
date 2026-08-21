---
name: AI ticket draft + reply cards
overview: Add an AI-drafted-reply pipeline for support tickets and replies (external agent trigger → webhook callback → ai_ticket_drafts → conditional comment send), a distinct "AI reply" card in the floater with an "AI at work" disclaimer, and fix the "Chat with {coordinator}" divider so it never anchors on an AI or not-yet-decided reply.
todos:
  - id: schema
    content: Introspect the existing ai_ticket_drafts table into src/db/schema.ts via npm run db:pull
  - id: turn-helper
    content: Add nextConversationTurn(ticketId) helper and shared triggerAiTicketDraft() used by both createTicket and addReply
  - id: trigger
    content: Remove sync template insert from createTicket; call triggerAiTicketDraft() from createTicket and addReply, each creating a generating-status draft row + trigger-failure fallback
  - id: webhook
    content: Add /api/support/ai/callback route + handler + aiTicketCallback.service.ts with exact (ticketId, conversationTurn, workflowRunId) correlation, transaction-safe send-decision logic
  - id: fallback-service
    content: Add aiTicketDraftFallback.service.ts (shared sendFallbackForDraft + resolveStaleAiDraftIfNeeded) and wire staleness check + hasPendingAiDraft into getTicketThread
  - id: types-query
    content: Wire isAi/hasPendingAiDraft through support.types.ts, tickets.read.service.ts, supportQueries.ts (conditional refetchInterval)
  - id: ui-cards
    content: Add Message.isAi, propagate in FloatingChatModal.threadMessagesToChat, build distinct AI card + disclaimer line in ChatThread.tsx
  - id: divider-fix
    content: Fix assigneeDividerPlacements to exclude isAi messages from anchoring the Chat with {assignee} divider
  - id: tests-docs
    content: Add/update tests for send-decision logic, callback service, fallback service, createTicket/addReply, divider placements; update docs/testing files
isProject: false
---

# AI-drafted ticket replies + AI reply card

## Current behavior (baseline)

- `createTicket` (`src/server/api/support/services/tickets.write.service.ts:164-191`) **always** synchronously inserts a templated L1 "Thank you for reaching out…" comment (`buildFirstTemplateResponse`) right after creating the ticket, tagged `comments.data.firstTemplateResponse = true`.
- `getTicketThread` (`src/server/api/support/services/tickets.read.service.ts:269-287`) maps that flag to `side: 'system'`; everything else is `side: 'agent'` (human) or `'student'`.
- `ChatThread.tsx` renders 2 visual styles today: the purple "Sparkle" auto-ack bubble (`side==='system'`) and the dark "Headset" human-agent bubble. `TicketMessage.isAi` and its doc-comment already anticipate an AI flag but nothing sets it (`support.types.ts:162-176`).
- `assigneeDividerPlacements` (`ChatThread.tsx:51-83`) always anchors the "Chat with {assignee}" divider on the **first** `role==='agent' || role==='bot'` message — today that's always the auto-ack, which is why it currently reads oddly.
- No AI-agent trigger, webhook, or cron infra exists anywhere in the repo today (confirmed via full-repo search). The `ai_ticket_drafts` table, however, **already exists in the database** (real DDL supplied) — it's just not yet in `src/db/schema.ts`.

## Confirmed design decisions (from Q&A)

1. The AI agent is an **external service**. We POST a "trigger" request to it (fire-and-forget, matching the existing `triggerExperienceApiCommunityNotify.ts` server-to-server pattern) and it calls **our new webhook route** back when a response is ready — we do not block/poll for it.
2. The default templated response is **removed from `createTicket`**. Nothing is sent to the student at creation time; the first comment (AI answer or fallback template) is decided only once we know the AI's outcome.
3. The agent always eventually calls the webhook, including for "can't help" (`draft_kind: 'handoff'`) and `status: 'failed'`. We must additionally guard against it **never** calling back (crash/timeout) with a time-based fallback, resolved lazily (no cron).
4. AI drafting applies to **every conversation turn**, not just ticket creation: `createTicket` triggers turn 1, and every subsequent student reply (`addReply`) triggers a new turn.
5. Webhook correlation is a **hard, exact match on all three** of `(ticket_id, conversation_turn, workflow_run_id)`. If `workflow_run_id` doesn't match the stored value for that `(ticket_id, conversation_turn)`, the callback is rejected (404) — this naturally fences off stale/superseded retries.

## 1. Data model — the real `ai_ticket_drafts` schema

This table already exists; add a matching Drizzle definition via **`npm run db:pull`** (introspects the live DB into `src/db/schema.ts`, per this repo's existing `db:pull` script), rather than hand-writing a `db:push` migration. Exact shape supplied:

```sql
`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT
`ticket_id` INT UNSIGNED NOT NULL
`conversation_turn` INT UNSIGNED NOT NULL
`workflow_run_id` VARCHAR(255) NOT NULL
`generated_message` TEXT NOT NULL
`status` enum('generating','ready','failed') NOT NULL DEFAULT 'generating'
`outcome` enum('rejected','sent_as_is','sent_edited') NULL   -- legacy human-review flow, unused going forward
`feedback` TEXT NULL                                          -- legacy human-review flow, unused going forward
`agent_response` JSON NULL
`sent_comment_id` INT UNSIGNED NULL
`reviewed_by` BIGINT UNSIGNED NULL                             -- legacy, unused
`reviewed_at` TIMESTAMP NULL                                   -- legacy, unused
`created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
`updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
```

**Important implication of this schema vs. my initial draft:** there is no generic `pending`/`sent_ai`/`sent_fallback` lifecycle column to lean on. Idempotency and "has this draft already produced output" must instead key off **`sent_comment_id IS NULL`**, and `outcome`/`feedback`/`reviewed_by`/`reviewed_at` are left `NULL` forever in the new automated flow (they belonged to a discontinued human-review step).

At **trigger time** (before the agent responds) we insert a row with only the fields we already know:

- `ticketId`, `conversationTurn`, `workflowRunId` (generated by us, sent to the agent, echoed back)
- `generatedMessage: ''` (column is `NOT NULL TEXT` with no default — must supply a placeholder)
- `status: 'generating'` (the column default, but set explicitly for clarity)
- `agentResponse`, `sentCommentId`, `outcome`, `feedback`, `reviewedBy`, `reviewedAt` all left `NULL`

At **webhook time**, the agent's full JSON (per your sample) is stored as-is in `agent_response`, and `generated_message` / `status` are also copied onto their own columns (mirroring what the agent's top-level `status` / `generated_message` fields say) — `draft_kind` and everything else (confidence, meta, etc.) stays inside `agent_response` only, since there's no dedicated column for it.

### Comment marker (no schema change needed on `comments`)

Reuse the existing `comments.data` JSON-bag convention (same pattern as `firstTemplateResponse`):

- AI-sent comment: `data: { source: 'ai', aiTicketDraftId }`
- Fallback comment (turn 1 only — see §3): unchanged, `data: { firstTemplateResponse: true, ticket_level: 'l1', displayName }`

### Type changes (`src/server/api/support/support.types.ts`)

- `TicketMessage.isAi` already exists (line 175) — just start populating it.
- Add `TicketDetail.hasPendingAiDraft?: boolean` — lets the client show a lightweight "thinking" state and poll briefly while a draft is outstanding, without ever rendering partial/uncertain AI content.

## 2. Triggering — ticket creation AND every reply

New shared service `src/server/api/support/services/aiTicketDraftTrigger.service.ts`:

```ts
export async function triggerAiTicketDraft(input: {
  ticketId: number
  message: string // the turn's text (ticket.message for turn 1, the reply text otherwise)
  category: string
  subCategory?: string | null
  batchId: number | null
}): Promise<void>
```

Logic:

1. `conversationTurn = (max existing ai_ticket_drafts.conversation_turn for this ticket) + 1` — a small helper `nextConversationTurn(ticketId)` (1 when none exist yet).
2. `workflowRunId = randomUUID()`.
3. Insert the `ai_ticket_drafts` row (`status: 'generating'`, `generatedMessage: ''`, as above).
4. POST to the external agent (new outbound module `aiTicketAgentTrigger.service.ts`, modeled on `src/server/masaiverse/triggerExperienceApiCommunityNotify.ts`):
   - `AI_TICKET_AGENT_BASE_URL` + `AI_TICKET_AGENT_INTERNAL_SECRET` env vars (same pattern as `EXPERIENCE_API_BASE_URL` / `COMMUNITY_MASAIVERSE_INTERNAL_SECRET`).
   - POST `{ ticket_id, conversation_turn, workflow_run_id, message, category, subcategory, batch_id }` with a **short** bounded timeout (~4s) — this call only needs an "accepted" ack, never the actual answer.
5. **Trigger-call failure** (env unset, network error, non-2xx, or the short timeout elapses) → we know for certain no AI attempt will happen for this turn, so immediately resolve via `sendFallbackForDraft(draft)` (§4).
6. Whole function wrapped in try/catch by its callers — **must never fail or slow down** ticket creation / reply submission.

### Wiring into `createTicket` and `addReply`

- `createTicket` (`tickets.write.service.ts:164-191`): **remove** the unconditional `buildFirstTemplateResponse` insert; call `triggerAiTicketDraft({ ticketId, message: input.message, category, subCategory, batchId })` (turn 1) instead, best-effort exactly like the code it replaces.
- `addReply` (`tickets.write.service.ts`, student reply path): after inserting the student's reply comment, call `triggerAiTicketDraft({ ticketId, message: input.message, category: ticket.category, ... })` (turn 2, 3, …), same best-effort wrapper.

### Fallback copy differs by turn

The existing "Thank you for reaching out… within 48 hours…" template only makes sense as a **first-contact** acknowledgement. Decision: `sendFallbackForDraft` sends that templated comment **only when `conversationTurn === 1`**; for `conversationTurn > 1`, a failed/handoff/timed-out draft sends **no comment at all** — the reply simply waits for a human coordinator, exactly as if there were no AI. This is called out below as an assumption to confirm since no reply-turn fallback copy was specified.

## 3. Webhook — receive the agent's answer

New route → handler → service, following `AGENTS.md`'s layering:

- `src/routes/api/support/ai/callback.ts` → thin POST entry.
- `src/server/api/support/handlers/aiTicketCallback.handler.ts` — validates a shared-secret header (`x-ai-ticket-agent-secret` against `AI_TICKET_AGENT_INTERNAL_SECRET`), parses body with zod, delegates to the service, maps errors to responses.
- `src/server/api/support/services/aiTicketCallback.service.ts` — `resolveAiTicketDraftCallback(payload)`:

```ts
const CallbackSchema = z
  .object({
    ticket_id: z.number().int().positive(),
    conversation_turn: z.number().int().positive(),
    workflow_run_id: z.string().min(1),
    status: z.enum(['generating', 'ready', 'failed']),
    draft_kind: z.enum(['answer', 'clarifying_question', 'handoff']).optional(),
    generated_message: z.string().optional(),
  })
  .passthrough() // full agent payload (meta, confidence, etc.) stored as-is in agent_response
```

Logic (wrapped in a single `db.transaction()` with `SELECT ... FOR UPDATE` on the draft row, so a concurrent duplicate webhook can't double-send):

1. **Exact correlation lookup**:
   ```ts
   and(
     eq(aiTicketDrafts.ticketId, payload.ticket_id),
     eq(aiTicketDrafts.conversationTurn, payload.conversation_turn),
     eq(aiTicketDrafts.workflowRunId, payload.workflow_run_id),
   )
   ```
   Not found (including a mismatched `workflow_run_id`, e.g. from a superseded/stale attempt) → `404 "Draft not found for ticket, turn, and workflow run."`
2. **Idempotency**: if `draft.sentCommentId != null`, this draft is already resolved (duplicate/late webhook) → return 200 no-op, log only.
3. Update `agent_response = payload` (raw), `generated_message = payload.generated_message ?? ''`, `status = payload.status`.
4. Compute the send decision (pure function, unit-testable in isolation):
   ```ts
   function evaluateAiDraftSendDecision(
     payload,
   ): 'send_ai' | 'send_fallback' | 'wait' {
     if (
       payload.status === 'ready' &&
       (payload.draft_kind === 'answer' ||
         payload.draft_kind === 'clarifying_question')
     ) {
       return payload.generated_message?.trim() ? 'send_ai' : 'send_fallback' // "ready" with empty message is never shown as-is
     }
     if (payload.status === 'failed' || payload.draft_kind === 'handoff')
       return 'send_fallback'
     return 'wait' // status: 'generating' arriving as a "final" webhook, or any unrecognized draft_kind — never guess
   }
   ```
5. **`send_ai`** — re-verify the ticket still exists (defends against the ticket being deleted between trigger and callback); insert `comments` row `{ message: generated_message, public: 1, userId: ticket.assigneeId, data: { source: 'ai', aiTicketDraftId } }`; backfill `sentCommentId` on the draft.
6. **`send_fallback`** — call the shared `sendFallbackForDraft(draft)` helper (§4), which itself decides turn-1-vs-not (see §2). Always backfills `sentCommentId` (even the "no comment for turn > 1" case stamps a sentinel so the draft is marked resolved and the staleness sweep / `hasPendingAiDraft` stop flagging it — see note in §4).
7. **`wait`** — no DB write beyond the `agent_response`/`status` update already applied in step 3; `sentCommentId` stays `NULL` so a later genuine callback (or the staleness sweep) can still resolve it. This is the only branch where we deliberately show nothing and keep waiting — matches "nothing uncertain visible to the student."
8. Any DB failure while sending is a genuine 500 (unlike the create/reply best-effort paths) — the webhook is the delivery channel, so the agent should retry.

## 4. Silent-failure fallback (no cron — resolved lazily on read)

Shared helper `src/server/api/support/services/aiTicketDraftFallback.service.ts`:

- `sendFallbackForDraft(draft)`:
  - If `draft.conversationTurn === 1`: build + insert the existing templated first-response comment (`buildFirstTemplateResponse`, unchanged copy/behavior), backfill `sentCommentId`.
  - If `draft.conversationTurn > 1`: no comment is sent (see §2's rationale) — instead, mark the draft resolved-with-no-output. Since `sent_comment_id` can't hold a sentinel value (it FK's to `comments.id`), track "resolved, nothing sent" via `status` staying whatever the agent said (`failed`) or, for the timeout case, explicitly setting `status: 'failed'` — and treat **`status IN ('ready', 'failed') OR sentCommentId IS NOT NULL`** as "no longer pending" everywhere we check for pending drafts (staleness sweep, `hasPendingAiDraft`). This avoids needing a schema change while still making turn>1 "no-op fallback" terminal and non-repeating.
  - Used by: (a) trigger-call failure, (b) the webhook's `send_fallback` decision, (c) the staleness sweep below — one implementation, one behavior.
- `resolveStaleAiDraftIfNeeded(ticketId)` — called at the **top** of `getTicketThread` before building the response:
  1. Find a draft for this ticket where `status = 'generating'` and `created_at < now - AI_TICKET_DRAFT_TIMEOUT_MINUTES` (new config constant, default 5 minutes, alongside `supportTime.ts`).
  2. If found, lock it (`SELECT ... FOR UPDATE` in a transaction, re-check `status === 'generating'` inside the lock), then call `sendFallbackForDraft(draft)` with `status` forced to `'failed'` (since the agent never delivered).
  3. This makes `getTicketThread` naturally self-healing: whenever the student actually opens the ticket, they never see silence for longer than the timeout — no scheduler needed. **Documented limitation**: if the student never reopens the ticket, the fallback won't fire proactively; acceptable for v1 per your direction (no cron infra), flagged here for visibility.
  4. A **late** webhook arriving after this resolves is a no-op (`sentCommentId` already set for turn 1, or `status` already terminal for turn > 1) — logged, never shown.

## 5. `hasPendingAiDraft` + light client polling

- `getTicketThread` sets `ticket.hasPendingAiDraft = true` when, after the staleness check above, a draft for this ticket still has `status: 'generating'`.
- `ticketThreadQuery` (`src/query/support/supportQueries.ts:124-129`) adds `refetchInterval: (query) => query.state.data?.ticket.hasPendingAiDraft ? 4000 : false` so the floater picks up the AI's answer (or the eventual fallback) within a few seconds, without ever showing partial content.

## 6. Wiring AI messages through to the UI

### `getTicketThread` message mapping (`tickets.read.service.ts:269-287`)

```ts
const isAiReply = commentData?.source === 'ai'
return {
  ...
  side: isAutoReply ? 'system' : messageSide(m.authorId, input.userId),
  isAi: isAiReply || undefined,
}
```

(`side` stays `'agent'` for AI replies — only the additive `isAi` flag changes, matching the pre-declared field's intent.)

### `types.ts` / `FloatingChatModal.tsx` (`threadMessagesToChat`, lines ~96-110)

Add `isAi?: boolean` to `Message`; propagate `isAi: m.isAi === true` alongside the existing `role`/`isAutoReply` mapping.

### `ChatThread.tsx` — new AI card

- `isAi = isAgent && m.isAi === true`.
- Avatar: new icon (e.g. `Robot` from `@phosphor-icons/react`) on a distinct accent (e.g. teal/blue) so it's visually separable from both the purple auto-ack Sparkle and the dark human Headset.
- Bubble: distinct tint (e.g. light blue `#eef6ff`) vs. the shared human/system gray `#f1f1f7`.
- Sender label: fixed string, e.g. `"AI Assistant"` (not the assignee's real name).
- New line under the bubble content: **"AI at work. Mistakes can happen!"** — small, muted, same treatment as the existing `sentAtLabel` caption.
- Human (`isAgent && !isAi`) and system auto-ack (`role==='bot'`) bubbles are **untouched**.

### Divider fix (`assigneeDividerPlacements`, `ChatThread.tsx:51-83`)

```ts
const firstAgentIdx = messages.findIndex(
  (m) => (m.role === 'agent' && !m.isAi) || m.role === 'bot',
)
```

An AI reply no longer anchors the "Chat with {coordinator}" divider — it only appears above the fallback auto-ack (`bot`, unchanged) or the first genuine human reply. If the _only_ coordinator-side messages so far are AI answers, no divider renders yet, which directly addresses your point 2. Existing `assigneeDividerPlacements.test.ts` cases are unaffected (none use `isAi`); add new cases for: AI-only thread (no divider), AI reply followed by a real human reply (divider anchors on the human one).

## Edge cases covered

| Scenario                                                                                                      | Handling                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent trigger call fails/unreachable                                                                          | Immediate fallback via `sendFallbackForDraft` — ticket creation/reply still succeeds                                                               |
| Agent never calls the webhook (silent failure)                                                                | Staleness check in `getTicketThread` sends fallback once the timeout elapses, next time the student opens the ticket                               |
| Agent calls webhook twice (retry)                                                                             | `sentCommentId`/`status` idempotency check inside a row-locked transaction — second call is a no-op                                                |
| Late webhook after fallback already sent                                                                      | No-op (already resolved), logged only, never shown                                                                                                 |
| Webhook with mismatched `workflow_run_id` for the `(ticket_id, conversation_turn)` (stale/superseded attempt) | 404, rejected outright — never processed                                                                                                           |
| `status: 'ready'` but empty/missing `generated_message`                                                       | Treated as `send_fallback`, not shown as a broken AI bubble                                                                                        |
| `status: 'generating'` arriving as a terminal webhook, or unrecognized `draft_kind`                           | `wait` — draft stays pending, resolved later by a real callback or the staleness timeout; nothing rendered                                         |
| Ticket deleted/reassigned between trigger and callback                                                        | Re-verified before insert; if missing, no comment sent, logged                                                                                     |
| Student sends a new reply before the previous turn's AI draft resolves                                        | Each turn is independent (`conversation_turn` increments); both can resolve independently, each becomes a normal subsequent comment whenever ready |
| Concurrent webhook + staleness-sweep race on the same draft                                                   | Both paths take a `SELECT ... FOR UPDATE` row lock before acting                                                                                   |
| DB insert fails while sending in webhook                                                                      | Real error/500 so the agent can retry (unlike the best-effort create/reply paths)                                                                  |
| Reply-turn (turn > 1) draft fails/hands off                                                                   | No filler comment sent (see §2) — ticket just waits for a human, unlike turn 1's templated ack                                                     |

## Files touched

- `src/db/schema.ts` — introspected `aiTicketDrafts` table (via `db:pull`).
- `src/server/api/support/services/tickets.write.service.ts` — remove sync template insert from `createTicket`; trigger AI from both `createTicket` and `addReply`.
- `src/server/api/support/services/aiTicketDraftTrigger.service.ts` — new (`triggerAiTicketDraft`, `nextConversationTurn`).
- `src/server/api/support/services/aiTicketAgentTrigger.service.ts` — new (outbound HTTP call to the agent).
- `src/server/api/support/services/aiTicketDraftFallback.service.ts` — new (shared fallback + staleness sweep).
- `src/server/api/support/services/aiTicketCallback.service.ts` — new (webhook business logic + send-decision function).
- `src/server/api/support/handlers/aiTicketCallback.handler.ts` — new.
- `src/routes/api/support/ai/callback.ts` — new.
- `src/server/api/support/services/tickets.read.service.ts` — wire `isAi`, `hasPendingAiDraft`, call staleness resolver.
- `src/server/api/support/support.types.ts` — `TicketDetail.hasPendingAiDraft`.
- `src/query/support/supportQueries.ts` — conditional `refetchInterval` on `ticketThreadQuery`.
- `src/components/common/floating-chat/types.ts` — `Message.isAi`.
- `src/components/common/floating-chat/FloatingChatModal.tsx` — propagate `isAi`.
- `src/components/common/floating-chat/ChatThread.tsx` — AI card, divider fix.
- `.env` / `.env.production` — `AI_TICKET_AGENT_BASE_URL`, `AI_TICKET_AGENT_INTERNAL_SECRET`.

## Tests to add/update (repo requires 100% on touched files)

- `evaluateAiDraftSendDecision` — all status/draft_kind combinations (ready+answer, ready+clarifying_question, ready+empty message, failed, handoff, generating-as-terminal, unrecognized).
- `aiTicketCallback.service.test.ts` — idempotency (duplicate callback), mismatched `workflow_run_id` → 404, ticket-not-found, DB failure surfaces 500.
- `aiTicketDraftFallback.service.test.ts` — turn-1 vs turn>1 fallback behavior, staleness trigger, no-op when not yet stale, no-op when already resolved.
- `tickets.write.service.test.ts` (`createTicket` / `addReply`) — update existing assertions (no more synchronous template insert on create); add trigger-failure → fallback-sent case for both create and reply; conversation_turn increments correctly across multiple replies.
- `assigneeDividerPlacements.test.ts` — add AI-only-thread (no divider) and AI-then-human (divider on human) cases.
- `ChatThread` — new AI card rendering + "AI at work. Mistakes can happen!" copy (component test).
- Update `docs/testing/features/support.md` and `docs/testing/feature-test-matrix.md` per project convention.

## Assumptions to confirm during implementation review

- AI triggering applies to **all** ticket categories at v1 (not scoped to specific ones) — flag if only some categories should trigger AI.
- Reply-turn (`conversation_turn > 1`) fallback sends **no comment** when the AI can't help (vs. resending the turn-1 template, which would read as spammy) — flag if you want different copy for that case instead of silence.
- Exact AI-card copy/icon/colors above are a reasonable starting proposal — easy to restyle once real designs exist.
- `AI_TICKET_DRAFT_TIMEOUT_MINUTES` default of 5 minutes for the silent-failure fallback is a placeholder — adjust to whatever SLA is realistic for the agent.
