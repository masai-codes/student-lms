# Support Feature — Technical / Codebase Reference

> Companion to the [PRD](./01-PRD-Support-Feature.md). This doc is the **engineering
> map**: architecture, database schema, every endpoint, the request journey from
> frontend to DB, and the admin role — everything you need to rebuild the module
> cleanly in the new repo.

Two repositories are involved:

| Repo | Path | Role |
|---|---|---|
| **experience-ui** | `/Users/nitansh/Documents/lms/experience-ui` | Frontend. Contains the **student React app** (`apps/student-experience`) and the **admin Next.js app** (`apps/admin`). |
| **experience-api** | `/Users/nitansh/Documents/lms/experience-api` | Backend. Express + **Apollo GraphQL** + **Prisma** over **MySQL**. |

---

## 1. Architecture at a glance

```
┌─────────────────────────────────────────────┐        ┌──────────────────────────────────────┐
│  experience-ui                                │        │  experience-api                        │
│                                               │        │                                        │
│  apps/student-experience (React, CRA)         │        │  ┌──────────────────────────────────┐  │
│    pages/tickets/*  ──► generated react-query │        │  │  Apollo GraphQL  /graphql          │  │
│    hooks (src/graphql) ──► useAxios           │  POST  │  │  src/features/ticket/resolver.ts   │  │
│      └─ POST { query, variables } ────────────┼───────►│  │  src/features/.../resolver.ts      │  │
│         to REACT_APP_GQL_BASE_URL             │ graphql│  └──────────────┬───────────────────┘  │
│                                               │        │                 │  (both share logic)   │
│  apps/admin (Next.js)                         │        │  ┌──────────────┴───────────────────┐  │
│    pages/tickets/*  ──► GraphQL (admin .graphql)│      │  │  REST routes  src/routes/tickets.ts │  │
│                                               │  REST  │  │  → ticket.controller.ts            │  │
│                                               │◄──────►│  └──────────────┬───────────────────┘  │
└─────────────────────────────────────────────┘        │                 │                       │
                                                         │            ┌────▼─────┐                 │
                                                         │            │  Prisma  │ ──► MySQL        │
                                                         │            └──────────┘                 │
                                                         │  + Temporal workflow, SES email,        │
                                                         │    push notifications, Slack, AI svc    │
                                                         └──────────────────────────────────────┘
```

**Two transports, one logic core.** The student app speaks **GraphQL**; the backend
also exposes **REST** for the same operations. Both the GraphQL resolvers
(`src/features/ticket/resolver.ts`) and the REST controller
(`src/features/ticket/ticket.controller.ts`) sit on top of **Prisma**. When rebuilding,
you can collapse this to a single transport.

> Note: `apps/student-experience/server/` contains a stale/legacy Apollo gateway
> scaffold; the live GraphQL endpoint that the UI hits is the one in **experience-api**.

---

## 2. Database schema (MySQL via Prisma)

Source of truth: `experience-api/prisma/schema.prisma`. All seven support tables below
are verbatim from that file.

### 2.1 `tickets` — the core ticket *(schema.prisma:2457)*

| Column | Type | Notes |
|---|---|---|
| `id` | UnsignedInt PK | auto-increment |
| `user_id` | UnsignedBigInt | FK → `users.id` — the student who raised it |
| `title` | Text | auto-generated in V2 |
| `message` | Text | the student's opening message |
| `data` | Json? | `batch_id`, `question_id`, `subCategory`, active sections, `help_faq_question`, etc. |
| `status` | VarChar(255)? | `open` / `resolved` / `closed` / `re-opened` / `automatic` |
| `department` | VarChar(255)? | legacy V1 field |
| `priority` | VarChar(255)? | legacy V1 field |
| `is_closed` | Boolean | default `false` |
| `assignee_id` | UnsignedBigInt | FK → `users.id` — **current owner** (L1…L5) |
| `agent_id` | UnsignedBigInt? | FK → `users.id` — optional secondary agent |
| `closed_at` | DateTime? | |
| `category` | VarChar(255) | e.g. `assignment`, `evaluation`, `leave` |
| `rating` | UnsignedInt | default `0` (1 = 👎, 5 = 👍) |
| `meta` | Json? | `escalation_count` + escalation history |
| `info` | Json? | assignment & escalation log |
| `logstamps` | Json? | `L1_assigned_at`, `escalated_to_l2_at`, … |
| `deleted_at` | Timestamp? | soft delete |
| `created_at` / `updated_at` | Timestamp? | |

**Relations:** `comments[]`, `interactions[]`, and three FKs to `users`
(owner / assignee / agent).
**Indexes:** `user_id`, `assignee_id`, `agent_id`, `created_at`, `closed_at`, `updated_at`.

### 2.2 `comments` — ticket conversation thread *(schema.prisma:724)*

| Column | Type | Notes |
|---|---|---|
| `id` | UnsignedInt PK | |
| `ticket_id` | UnsignedInt | FK → `tickets.id` |
| `user_id` | UnsignedBigInt | FK → `users.id` — author (student, admin, or bot) |
| `message` | Text | for admin replies, signature HTML is appended here |
| `data` | Json? | `ticket_level` (l1…l5), `displayName`, `ai_response`, `ai_response_error` |
| `status` | VarChar(255)? | |
| `public` | Boolean | default `false` — `true` = visible to student, `false` = internal note |
| `deleted_at` / `created_at` / `updated_at` | Timestamp? | |

**Indexes:** `ticket_id`, `user_id`, `created_at`, `updated_at`.

### 2.3 `help_faqs` — knowledge base *(schema.prisma:3396)*

| Column | Type | Notes |
|---|---|---|
| `id` | UnsignedInt PK | |
| `category` / `sub_category` | VarChar(255) | grouping |
| `question` / `answer` | Text | |
| `assignees` | Json? | **`{ l1, l2, l3, l4, l5 }`** — user_ids; drives ticket routing when a ticket is raised from this FAQ |
| `batch_id` | UnsignedInt | FK → `batches.id` — FAQs are per-batch |
| `redirection_to_pc` | Boolean | redirect to program coordinator |
| `is_hidden` | Boolean | |
| `meta` | Json? | (FAQ votes live here) |
| `created_at` / `updated_at` | Timestamp? | |

**Indexes:** `category`, `sub_category`, `batch_id`, `is_hidden`, composite `(category, sub_category)`.

### 2.4 `user_callback_tickets` — callback requests *(schema.prisma:3001)*

| Column | Type | Notes |
|---|---|---|
| `id` | UnsignedInt PK | |
| `user_id` | UnsignedBigInt | FK → `users.id` — requester |
| `resolved_by` | UnsignedBigInt? | FK → `users.id` — admin who resolved |
| `batch_id` | UnsignedInt | FK → `batches.id` |
| `category` | VarChar(255) | the reason |
| `status` | VarChar(255) | default `pending` → `resolved` |
| `assigned_to` | UnsignedBigInt? | FK → `users.id` |
| `preferred_time_slot` | VarChar(255)? | |
| `admin_comment` | Text? | |
| `resolved_at` / `comment_updated_at` | Timestamp? | |
| `logs` | Json? | change history |
| `meta` | Json? | |
| `created_at` / `updated_at` | Timestamp? | |

**Indexes:** `user_id`, `resolved_by`, `batch_id`, `assigned_to`, `status`.

### 2.5 `interactions` — chatbot conversations *(schema.prisma:3110)*

| Column | Type | Notes |
|---|---|---|
| `id` | UnsignedInt PK | |
| `user_id` | UnsignedBigInt | FK → `users.id` |
| `title` | VarChar(255) | |
| `category` | VarChar(255)? | |
| `ticket_id` | UnsignedInt? | FK → `tickets.id` — set if the chat created a ticket |
| `created_at` / `updated_at` | Timestamp | |

Has many `interaction_messages`.

### 2.6 `interaction_messages` — chatbot messages *(schema.prisma:3126)*

| Column | Type | Notes |
|---|---|---|
| `id` | UnsignedInt PK | |
| `interaction_id` | UnsignedInt | FK → `interactions.id` |
| `message` | Text | |
| `user_id` | UnsignedBigInt | FK → `users.id` (real user or `BOT_USER_ID`) |
| `sent_at` | Timestamp | |

### 2.7 `ticket_templates` — canned admin responses *(schema.prisma:3450)*

| Column | Type | Notes |
|---|---|---|
| `id` | UnsignedInt PK | |
| `title` | VarChar(500) | |
| `description` | LongText | the template body |
| `created_by` | UnsignedBigInt | FK → `users.id` |
| `updated_by` | UnsignedBigInt? | FK → `users.id` |
| `meta` | Json? | |
| `created_at` / `updated_at` | Timestamp? | |

### 2.8 Tables referenced but owned elsewhere

| Table | Why it matters here |
|---|---|
| `users` | every actor (student, assignee, agent, resolver, bot) |
| `batches` | **`batches.settings` JSON** holds the entire escalation config (see §6) |
| `sections` / `section_user` | "active section" gate for ticket creation; coordinator (IA/EC/PC) lookups |
| `menus` | **ticket categories are read from the `menus` table** (`getTicketCategories` queries `prisma.menus`) — not a dedicated category table |

### 2.9 Entity relationships

```
users ──< tickets >── users           tickets ──< comments >── users
  (user_id / assignee_id / agent_id)            (ticket_id)   (user_id)

batches ──< help_faqs                  tickets ──< interactions ──< interaction_messages
batches ──< user_callback_tickets >── users (user_id / assigned_to / resolved_by)
users ──< ticket_templates            menus  ──► (category source for tickets/FAQs)
```

---

## 3. Backend API surface (experience-api)

Both GraphQL and REST exist. The **student app uses GraphQL**; REST is the
controller-level equivalent (`src/routes/tickets.ts` → `ticket.controller.ts`).

### 3.1 REST routes — Tickets (`src/routes/tickets.ts`)

All routes are behind `authenticateUserWithJWT` + `attachIHubAllowedBatches`.
Routes marked 🔒 require `req.user.role === 'admin'` (`requireAdmin` middleware).

| Method | Path | Controller | Purpose |
|---|---|---|---|
| GET | `/tickets` | `getTickets` | List with filters (`page, tab, user_id, id, assignee_id, agent_id, category, status, priority, rating, default, excludeIds`) |
| GET | `/tickets/column-values` | `getColumnValues` | Distinct status/category/priority/rating for filters |
| GET 🔒 | `/tickets/users-dropdown` | `getUsersForDropdown` | Users by role (assignee picker) |
| GET | `/tickets/template-dropdown-options` | `getTemplateDropDownOptions` | Template options |
| GET | `/tickets/common-response` | `getCommonTicketResponse` | Canned response by `category, studentName` |
| GET | `/tickets/active-sections/:userId` | `getActiveImpSections` | Active sections (creation gate) |
| GET | `/tickets/categories` | `getTicketCategories` | Categories (from `menus`) |
| GET | `/tickets/subcategories` | `getTicketSubcategories` | Subcategories |
| GET | `/tickets/categories-with-subcategories` | `getTicketCategoriesWithSubcategories` | Grouped |
| GET | `/tickets/categories/:categoryValue/subcategories` | `getSubcategoriesByCategory` | Subcats for a category |
| GET | `/tickets/faqs` | `getFAQs` | FAQ search (`batch_id` required, `search, category, subCategory, limit, is_hidden`) |
| GET | `/tickets/faqs/:faqId` | `getFAQById` | Single FAQ |
| GET 🔒 | `/tickets/:id/reply-signature-preview` | `getReplySignaturePreview` | Preview admin signature |
| GET | `/tickets/:id` | `getTicketById` | Single ticket |
| GET | `/tickets/:id/comments` | `getCommentsByTicketId` | Thread |
| POST | `/tickets` | `createTicket` | **V1** create (title, category, priority, message, department, data) |
| POST | `/tickets/v2` | `createTicketV2` | **V2** create (category, message, data, batch_id, question_id?) |
| POST | `/tickets/chatbot` | `createChatbotTicket` | Bot-created ticket |
| POST 🔒 | `/tickets/:id/suggest-reply` | `suggestReplyForTicket` | AI reply suggestion |
| POST 🔒 | `/tickets/bulk-add-agent` | `bulkAddAgent` | Assign agent to many tickets |
| POST | `/tickets/:id/confirm` | `confirmTicket` | Student confirms resolution (`resolution, mode?, reason?`) |
| POST | `/tickets/:id/escalate` | `escalateTicket` | Escalate L1→L5 |
| POST | `/tickets/:id/message` | `addMessageToTicket` | Add comment (`message, public?, data?`) |
| PATCH | `/tickets/:id/message` | `patchTicketMessageByOwner` | Owner edits their message |
| PUT 🔒 | `/tickets/:id` | `updateTicketById` | Reassign (`assignee_id, agent_id, data`) |
| PUT | `/tickets/:id/status` | `updateTicketStatus` | Change status |
| PUT | `/tickets/:id/rating` | `updateTicketRating` | Rate (`rating, reason?`) |
| POST | `/tickets/faqs/:faqId/vote` | `voteFAQ` | Up/downvote FAQ |
| DELETE | `/tickets/faqs/:faqId/vote` | `removeVoteFAQ` | Remove vote |

### 3.2 REST routes — Callbacks (`src/routes/userCallbackTickets.ts`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/user-callback-tickets` | Create callback (one pending per batch) |
| GET | `/user-callback-tickets` | List the user's callbacks |
| GET | `/user-callback-tickets/:id` | Callback detail |

Admin-side callback management (assign, comment, resolve) is a **GraphQL resolver**:
`src/features/userCallbackTickets/resolver.ts`.

### 3.3 REST routes — Chatbot (`src/routes/supportChatbot.ts`)

Mounted under `/support`. Flow: create interaction → store message → call external AI
support service → on response, optionally escalate (EC `assignee_id=45818` / IA
`assignee_id=44391`) or create a ticket and link `interactions.ticket_id`.

### 3.4 GraphQL (what the student app actually calls)

Schema: `experience-api/src/features/ticket/typeDef.graphql`; resolvers:
`src/features/ticket/resolver.ts` (Prisma-backed). The student app's operations
(generated into `experience-ui/apps/student-experience/src/graphql`) include:

- **Queries:** `GetTickets`, `GetTicketById`, `GetCommentsByTicketId`, `GetFAQs`,
  `GetTicketCategoriesWithSubcategories`, `CallbackReasons`, `CallbackTimeslots`,
  `GetUserBatchesWithShowBatchDetails`, `GetInstituteSupportInfoByBatchId`,
  `GetSectionDetailsOfUser`, `GetSectionsForTicket`, `GetLegalAgreementData`, `Me`.
- **Mutations:** `CreateTicketV2`, `CreateTicket`, `CreateChatbotTicket`,
  `AddTicketComment`, `UpdateTicketRating`, `ReopenTicket`, `EscalateTicket`,
  `VoteFAQ`, `CreateUserCallbackTicket`, `ConfirmTicket`.

The `Ticket` GraphQL type also resolves computed fields: `categoryTat`,
`hasAdminResponse`, `commentCount`, `assignee`, `user`, `agent`.

---

## 4. Frontend structure (experience-ui)

### 4.1 Routing

`apps/student-experience/src/pages/Routes.tsx`:
```tsx
<Route path="/support" element={<Tickets />} />
<Route path="/support/:id" element={<Navigate to="/support" replace />} />
<Route path="/support/create" element={<Navigate to="/support" replace />} />
```
Route helpers (`src/utils/route.utils.ts`):
```ts
support: {
  main: () => `/support?tab=unresolved`,
  details: (id: number) => `/support/${id}`,
  createSupport: () => `/support/create`,
}
```

### 4.2 Component map (`apps/student-experience/src/pages/tickets/`)

| Component | Role |
|---|---|
| `index.tsx` (`Tickets`) | Root `/support`; chooses `BatchTickets` (new) vs `OldTickets` (legacy) by batch data |
| `BatchTickets.tsx` | New container: Help / Raised Tickets / 1:1 tabs, FAQs, categories, callbacks |
| `TicketListingPage.tsx` | List with Unresolved/Resolved/All tabs + pagination |
| `CreateTicketModal.tsx` | Full-screen create / view / reply / rate / escalate modal (the workhorse) |
| `SupportModal.tsx` | Search + FAQ + category browse + messaging |
| `FaqList.tsx` | FAQ accordion with search, up/down vote, "raise ticket" |
| `CategoryAccordion.tsx`, `SupportEntityList.tsx` | Category/subcategory browse + entities (people/links/info) |
| `SlotBook.tsx`, `PairProgramming/PairProgrammingTab.tsx` | Coordinator + 1:1 Calendly booking |
| `RatingPopup.tsx`, `ReopenWarning.tsx` | Rating & reopen dialogs |
| `CreateTicket/` (`index`, `Chatbot`, `CreateTicketFields`) | Legacy create form + chatbot triage |
| `TicketDetails.tsx`, `TicketDetailsHeader.tsx`, `TicketResponses.tsx`, `AddResponseSection.tsx`, `ChatbotTicketMessages.tsx`, `OldTickets.tsx` | Legacy detail/thread views |

### 4.3 Data layer

- Generated **react-query** hooks (`src/graphql`) — e.g. `useCreateTicketV2Mutation`,
  `useGetTicketByIdQuery`, `useAddTicketCommentMutation`, `useGetFaqsQuery`.
- Transport: `src/config/apiClient.ts → useAxios`, which POSTs `{ query, variables }`
  to `REACT_APP_GQL_BASE_URL` with `Authorization: Bearer <token>` + `x-app-origin`.
- **State:** react-query for server state; `AuthContext`, `AgreementMenuContext`;
  **URL search params** drive view state (`tab`, `page`, `category`, `subcategory`,
  `step`, `ticketId`, `tickets`, `searchQuery`).
- **File uploads:** `useFileUpload` hook → S3 **presigned POST**, max **5 files**,
  embedded into the message as markdown `[name](url)`.

### 4.4 Admin app (`apps/admin/pages/tickets/`)

`index.tsx` (listing + filters), `view/index.tsx` (detail + status/replies),
`edit/index.tsx`, `bulkAddAgent/index.tsx`. Uses admin GraphQL ops:
`GetTickets`, `GetTicketById`, `UpdateTicketStatus`, `AddTicketComment`,
`GetCommentsByTicketIdAdmin`, `BulkAddAgent`, `CreatePresignedPostPolicyForS3`,
`GetAiTicketResponse`.

---

## 5. End-to-end journeys (frontend → backend → DB)

### 5.1 Raising a ticket (V2, the primary path)

```
1. UI: FaqList "Raise Support Ticket" → CreateTicketModal (category+subcategory prefilled)
2. UI: student writes message, uploads files (S3 presigned), submits
3. useCreateTicketV2Mutation → POST /graphql  (CreateTicketV2)
4. API resolver/controller.createTicketV2:
     - validate batch_id ∈ student's allowed batches (attachIHubAllowedBatches)
     - resolve L1 assignee:
         a) help_faqs[question_id].assignees.l1   (if from FAQ)   else
         b) batch.settings.discussionPC.l1  (assignment/evaluation) or
            batch.settings.opsPC.l1        (other categories)      else
         c) hard-coded fallback
     - generate title (AWS), set status='open', is_closed=false
     - write logstamps.L1_assigned_at
5. Prisma: INSERT INTO tickets
6. API: fire-and-forget Temporal workflow (startTicketTemporalWorkflowFireAndForget)
7. UI: navigate to step=ticketdetails&ticketId=<id>; react-query refetches ticket+comments
```

### 5.2 Conversation + admin reply

```
Student reply:  useAddTicketCommentMutation → POST /tickets/:id/message
                → INSERT comments (public=true)
Admin reply:    addMessageToTicket
                → getAdminTicketReplySignaturePreview() builds {displayName, phone, signatureHtml}
                → message = message + signatureHtml
                → INSERT comments (data.ticket_level, data.displayName)
                → ticketEmailService.sendTicketReplyEmail() + push notification
```

### 5.3 Resolve → rate → reopen

```
Admin: PUT /tickets/:id/status {status:'resolved', is_closed:true} → sendTicketResolvedEmail()
Student: updateTicketRating {rating: 1|5}
If rating=1 (👎): ReopenWarning → reopenTicket → status='re-opened'
```

### 5.4 Escalation (the intricate part)

```
POST /tickets/:id/escalate
  - require ticket.data.batch_id OR ticket.data.question_id
  - resolveAssigneesForTicket():
       FAQ route:   help_faqs[question_id].assignees {l1..l5}
       Batch route: batch.settings.{discussionPC|opsPC} {l1..l5}
       (categoryUsesDiscussionPc: 'assignment'/'evaluation' → discussionPC else opsPC)
  - match current assignee_id to its level → escalate to next (l1→l2→…→l5)
  - UPDATE tickets SET assignee_id=<next>, status='re-opened'
  - append to info, logstamps (escalated_to_lN_at), meta.escalation_count++
```

### 5.5 Callback request

```
UI: pick reason (CallbackReasons) → pick slot (CallbackTimeslots) → CreateUserCallbackTicket
API: reject if a pending callback already exists for (user, batch)
     INSERT user_callback_tickets (status='pending')
     callbackTicketNbfcOpsSlack.service → Slack ping to ops
Admin (GraphQL): assign (assigned_to), comment (admin_comment), resolve (status, resolved_by, resolved_at)
```

### 5.6 Chatbot

```
UI: message → POST /support (create interaction + interaction_message)
API: call external AI support service (SUPPORT_API)
     response → escalate(EC/IA) and/or create ticket → link interactions.ticket_id
     bot reply stored with user_id = BOT_USER_ID
```

---

## 6. The escalation config model (`batches.settings`)

This JSON on the `batches` row is the brain of routing/escalation. Shape:

```jsonc
{
  "discussionPC": { "l1": 12345, "l2": 23456, "l3": 34567, "l4": 45678, "l5": 56789 },
  "opsPC":        { "l1": 11111, "l2": 22222, "l3": 33333, "l4": 44444, "l5": 55555 },
  "opsRoleTitles":{ "l1": "Program Co-ordinator", "l2": "Program Manager",
                    "l3": "Program Head", "l4": "Grievance Officer" },
  "phNumbers":    { "ph_l1": "...", "ph_l2": "...", "ph_l3": "...", "ph_l4": "..." },
  "showAdminNameInTicketReply": false
}
```

Helper logic lives in `src/features/ticket/ticketLevel.utils.ts`:
- `categoryUsesDiscussionPc(category)` → `'assignment'|'evaluation'` use `discussionPC`, else `opsPC`.
- `resolveAssigneesForTicket(prisma, ticket)` → the `{l1..l5}` ladder (FAQ assignees take priority over batch settings).
- `getAdminTicketReplySignaturePreview(prisma, ticket, adminUser)` → `{ displayName, phoneNumber, signatureHtml, ticketLevel }`.
- `computeReplyDisplayName` / `computeReplyPhoneNumber` → role title + phone from settings.

---

## 7. Admin role — exactly what admins can do

**Identity:** `req.user.role === 'admin'` (REST `requireAdmin` middleware; equivalent
checks in resolvers / `apps/admin` via `useUserData().role`).

**Admin-only capabilities:**
- **See everything** — list/filter all tickets (by id, category, status, priority,
  rating, assignee, agent) rather than only own tickets.
- **Reply** with auto-appended **signature** (role title + phone from batch settings);
  reply triggers email + push to the student.
- **Change status** — open / resolved / closed (`PUT /tickets/:id/status`).
- **Reassign** owner/agent — `PUT /tickets/:id` (🔒).
- **Bulk-add agent** across many tickets — `POST /tickets/bulk-add-agent` (🔒).
- **AI assist** — `POST /tickets/:id/suggest-reply` (🔒) and `GetAiTicketResponse`.
- **Reply-signature preview** — `GET /tickets/:id/reply-signature-preview` (🔒).
- **Manage callbacks** — assign, comment, resolve via the callback GraphQL resolver.
- **Templates** — use `ticket_templates` / `common-response` canned replies.

**Reply-tier gate** (`src/utils/ticketAccess.ts`): on `open` tickets any admin can take
the first reply; on `resolved`/`closed` tickets, the acting admin's level must be **≥**
the ticket's current tier (tier computed from `batch.settings.{discussionPC|opsPC}` per
category; L4-vs-L4 passes). This stops a lower-tier coordinator from reopening a ticket
already escalated above them.

---

## 8. Side-effects & integrations

| Concern | Where | Trigger |
|---|---|---|
| **Email** | `src/services/ticketEmailService.ts` (SES, `noreply-lms@masaischool.com`) | admin reply, resolved — gated by user notification prefs |
| **Push** | push-notification service | admin reply |
| **Slack** | `src/services/callbackTicketNbfcOpsSlack.service.ts` | new callback request |
| **Temporal** | `src/services/ticketTemporalWorkflow.service.ts` | after V2 create (fire-and-forget) |
| **AI support** | external `SUPPORT_API` | chatbot messages, suggest-reply |
| **S3** | presigned POST policy | ticket attachments (max 5) |

---

## 9. Key files cheat-sheet

**experience-api**
- `prisma/schema.prisma` — all 7 support tables (lines 2457, 724, 3396, 3001, 3110, 3126, 3450)
- `src/routes/tickets.ts` · `userCallbackTickets.ts` · `supportChatbot.ts` — REST routes
- `src/features/ticket/ticket.controller.ts` — controller (~2400 lines, all logic)
- `src/features/ticket/resolver.ts` · `typeDef.graphql` — GraphQL surface
- `src/features/ticket/ticketLevel.utils.ts` — escalation / signature logic
- `src/features/userCallbackTickets/{controller,resolver}.ts` — callbacks
- `src/utils/ticketAccess.ts` — reply-tier gate
- `src/services/ticketEmailService.ts` · `ticketTemporalWorkflow.service.ts` · `callbackTicketNbfcOpsSlack.service.ts`
- `src/constants/tickets.constants.ts` — 40+ canned templates, categories, statuses

**experience-ui**
- `apps/student-experience/src/pages/tickets/*` — student UI (see §4.2)
- `apps/student-experience/src/pages/Routes.tsx` · `src/utils/route.utils.ts` — routing
- `apps/student-experience/src/graphql/*` + `src/config/apiClient.ts` — data layer
- `apps/student-experience/codegen.yml` — GraphQL codegen config
- `apps/admin/pages/tickets/*` — admin dashboard

---

## 10. Notes & gotchas for the rebuild

- **Categories live in `menus`**, FAQ categories live in `help_faqs` — there is no single
  category table. Consider a first-class taxonomy in the new schema.
- **Heavy JSON columns** (`tickets.data/meta/info/logstamps`, `batches.settings`,
  `help_faqs.assignees`) encode critical business state untyped. Strong candidates for
  proper relational/typed modeling.
- **Two ticket-create paths** (V1 `createTicket`, V2 `createTicketV2`) and **two UI
  generations** (`OldTickets` vs `BatchTickets`) coexist — build only the V2/new path.
- **Dual transport** (GraphQL + REST over the same Prisma logic) — pick one in the rebuild.
- **Hard-coded user IDs** appear as fallbacks/escalation targets (e.g. EC `45818`,
  IA `44391`, ops `1079`, curriculum `300`, `1`) — externalize these to config.
- **Escalation tiering is the riskiest logic** — port `ticketLevel.utils.ts` +
  `ticketAccess.ts` behavior carefully and cover with tests.
