# Support module — START HERE

> The support feature, end to end. This file is the **map**: read it once and you
> can find anything. The module is intentionally a model for how other modules
> should be built — small, single-responsibility files, one aggregated read, and
> a clear one-way data flow.

## The one-way data flow

```
 MySQL (Drizzle schema: tickets, comments, help_faqs, menus, user_callback_tickets,
        batches, section_user, sections, users)
   │
   ▼  src/server/api/support/services/*.service.ts        ← business logic + queries (pure, testable)
   │      faqs · tickets.read · tickets.write · directory · callback
   │      + ticketCapabilities.ts (state machine)  + services/resolveAssignees.ts (escalation ladder)
   │
   ▼  src/server/api/support/getSupportOverview.service.ts ← THE aggregate: one Promise.all → one payload
   │
   ▼  src/server/api/support/handlers/*.handler.ts          ← session auth + Zod validation + error mapping
   │      overview · faqs · tickets · callback   (errors via support/http.ts)
   │
   ▼  src/routes/api/support/**                              ← thin TanStack route registrations (GET/POST)
   │
   ▼  src/lib/api/support/supportApi.ts (+ supportPaths.ts)  ← typed fetch client (the only way the UI calls the API)
   │
   ▼  src/query/support/supportQueries.ts                   ← React Query keys + options
   │
   ▼  src/components/features/support/**                     ← premium UI (SupportHome, TicketConversation, …)
   │
   ▼  src/routes/(protected)/_layout/support/**              ← thin page routes
```

**Shared types live in `support.types.ts` — start there.** Every layer speaks those types.

## The core principle: one GET, then refetch-on-change

- The whole `/support` page renders from **one** request: `GET /api/support/overview`
  (`getSupportOverview.service.ts` fans out to every section in parallel).
- The conversation renders from **one** request: `GET /api/support/tickets/thread`.
- Mutations (POST) return a tiny result, then the component **invalidates** the
  affected query (`SUPPORT_KEYS.thread(id)` + the overview) so only what changed
  re-fetches. No full reloads. See `TicketConversation.tsx` for the pattern.

## Where each feature lives

| Feature              | Service                              | Endpoint                             | UI                    |
| -------------------- | ------------------------------------ | ------------------------------------ | --------------------- |
| Landing (everything) | `getSupportOverview.service`         | `GET /api/support/overview`          | `SupportHome`         |
| FAQ search           | `faqs.service#searchFaqs`            | `GET /api/support/faqs`              | `FaqList` / `FaqItem` |
| FAQ vote             | `faqs.service#voteFaq`               | `POST /api/support/faqs/vote`        | `FaqItem`             |
| Categories           | `faqs.service#getCategoriesForBatch` | (in overview)                        | `CategoryGrid`        |
| Ticket list          | `tickets.read#listTickets`           | `GET /api/support/tickets`           | `TicketCard`          |
| Conversation         | `tickets.read#getTicketThread`       | `GET /api/support/tickets/thread`    | `TicketConversation`  |
| Create ticket        | `tickets.write#createTicket`         | `POST /api/support/tickets/create`   | `CreateTicketSheet`   |
| Reply                | `tickets.write#addReply`             | `POST /api/support/tickets/reply`    | `TicketActionFooter`  |
| Rate                 | `tickets.write#rateTicket`           | `POST /api/support/tickets/rate`     | `TicketActionFooter`  |
| Reopen               | `tickets.write#reopenTicket`         | `POST /api/support/tickets/reopen`   | `TicketActionFooter`  |
| Escalate             | `tickets.write#escalateTicket`       | `POST /api/support/tickets/escalate` | `TicketActionFooter`  |
| Callback             | `callback.service`                   | `POST /api/support/callback/create`  | `CallbackSheet`       |
| 1:1 coordinators     | `directory.service#getCoordinators`  | (in overview)                        | `CoordinatorCard`     |
| Creation gates       | `directory.service#getSupportGate`   | (in overview)                        | `GateBanner`          |

## Two ideas worth understanding before you edit

1. **The capability state machine** (`ticketCapabilities.ts`). What a student can do
   (reply / rate / reopen / escalate) is computed once from `status + rating + hasHigherLevel`
   and read everywhere. Never add ad-hoc `if (status === …)` in the UI — extend the machine.
2. **The escalation ladder** (`services/resolveAssignees.ts`). A ticket's owner sits on an
   L1→L5 ladder read from `batches.settings` (discussion vs ops track by category).
   `createTicket` assigns L1; `escalateTicket` walks to the next level.

## Adding a new section to the landing page

1. Write a small service in `services/` returning a typed slice.
2. Add one field to `SupportOverview` in `support.types.ts`.
3. Add one line to the `Promise.all` in `getSupportOverview.service.ts`.
4. Render it in `SupportHome`. Nothing else changes.

## Setup note (callbacks)

The `user_callback_tickets` table **already exists in MySQL** — it just wasn't declared
in `src/db/schema.ts` yet, so we added the Drizzle binding (columns mirror the live
table exactly). **No migration is required.** If you ever re-run `drizzle-kit generate`,
diff carefully and don't let it try to recreate this table.

## Conventions (so other modules can copy this one)

- One responsibility per file; name says what it does.
- Services throw `Error('SUPPORT_CODE')`; `http.ts#mapSupportError` turns codes into
  HTTP statuses. Services stay transport-agnostic + unit-testable.
- The UI talks to the backend **only** through `supportApi.ts` — never raw `fetch`/URLs.
- Premium feel = `Pressable` (tap physics) + `BottomDrawer` (swipeable sheets) +
  skeletons (not spinners) + optimistic mutations.
