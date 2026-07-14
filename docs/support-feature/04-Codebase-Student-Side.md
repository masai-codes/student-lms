# Support Feature — Student-Side Technical / Codebase Reference

> **Scope:** Engineering map for the **student-facing** Support experience only. Admin
> dashboard, admin-only endpoints, and coordinator tooling are **out of scope**. Backend
> internals (escalation routing, signatures, email) are described **only to the depth a
> student-side rebuild needs** — i.e. what the student UI sends and receives.
>
> Companion: [`03-PRD-Student-Side.md`](./03-PRD-Student-Side.md).

Repos involved:

| Repo               | Path                                          | Role for the student side                                    |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------ |
| **experience-ui**  | `/Users/nitansh/Documents/lms/experience-ui`  | `apps/student-experience` — the React app you're rebuilding. |
| **experience-api** | `/Users/nitansh/Documents/lms/experience-api` | Backend you call (GraphQL); Prisma over MySQL.               |

---

## 1. Architecture (student path only)

```
┌───────────────────────────────────────┐         ┌──────────────────────────────────┐
│  experience-ui / apps/student-experience│        │  experience-api                    │
│                                          │        │                                    │
│  pages/tickets/*                         │        │  Apollo GraphQL  /graphql          │
│    └─ generated react-query hooks        │ POST   │  src/features/ticket/resolver.ts   │
│       (src/graphql)                      │ graphql│  (+ callbacks / chatbot resolvers) │
│         └─ useAxios ──────────────────── ┼───────►│            │                        │
│            POST { query, variables }     │        │         ┌──▼───┐                    │
│            to REACT_APP_GQL_BASE_URL     │        │         │Prisma│ ──► MySQL          │
│            Bearer <token>, x-app-origin  │        │         └──────┘                    │
└───────────────────────────────────────┘         │  + Temporal, SES email, push, S3   │
                                                    └──────────────────────────────────┘
```

**The student app speaks GraphQL.** It POSTs `{ query, variables }` to the Apollo
endpoint in `experience-api`. The backend also has REST routes for the same logic, but
the **student UI does not use them** — for the rebuild you only need the GraphQL contract
below. (Backend resolvers sit directly on Prisma.)

---

## 2. Data the student touches (schema subset)

Full schema lives in `experience-api/prisma/schema.prisma`. These are the tables behind
the **student** experience. (Admin-only fields are noted as "not student-facing".)

### 2.1 `tickets` _(schema.prisma:2457)_

| Column                        | Type                        | Student relevance                                                     |
| ----------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `id`                          | UnsignedInt PK              | ticket reference                                                      |
| `user_id`                     | UnsignedBigInt → `users.id` | the student (owner)                                                   |
| `title`                       | Text                        | auto-generated in V2                                                  |
| `message`                     | Text                        | the student's opening message                                         |
| `data`                        | Json?                       | carries `batch_id`, `question_id`, `subCategory`, `help_faq_question` |
| `status`                      | VarChar?                    | `open` / `re-opened` / `resolved` / `closed` / `automatic`            |
| `assignee_id`                 | UnsignedBigInt → `users.id` | current owner — **set by system, not student**                        |
| `agent_id`                    | UnsignedBigInt?             | not student-facing                                                    |
| `category`                    | VarChar                     | e.g. `assignment`, `evaluation`, `leave`                              |
| `rating`                      | UnsignedInt                 | `0` default, `1` = 👎, `5` = 👍                                       |
| `meta` / `info` / `logstamps` | Json?                       | escalation bookkeeping — read-only from student POV                   |
| `is_closed`, `closed_at`      | Boolean / DateTime?         |                                                                       |
| `created_at` / `updated_at`   | Timestamp?                  |                                                                       |

### 2.2 `comments` — the conversation thread _(schema.prisma:724)_

| Column                      | Type                        | Student relevance                                                     |
| --------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `id`                        | UnsignedInt PK              |                                                                       |
| `ticket_id`                 | UnsignedInt → `tickets.id`  |                                                                       |
| `user_id`                   | UnsignedBigInt → `users.id` | author (student / coordinator / bot)                                  |
| `message`                   | Text                        | the reply body                                                        |
| `public`                    | Boolean                     | **`true` = student sees it; `false` = internal note (hidden)**        |
| `data`                      | Json?                       | coordinator metadata (level/displayName) — UI may render display name |
| `created_at` / `updated_at` | Timestamp?                  |                                                                       |

> **Rebuild note:** the student UI must only ever render `public = true` comments.

### 2.3 `help_faqs` — knowledge base _(schema.prisma:3396)_

| Column                           | Type                       | Student relevance                                            |
| -------------------------------- | -------------------------- | ------------------------------------------------------------ |
| `id`, `category`, `sub_category` |                            | grouping & display                                           |
| `question`, `answer`             | Text                       | shown in FAQ list                                            |
| `batch_id`                       | UnsignedInt → `batches.id` | FAQs are per-batch                                           |
| `is_hidden`                      | Boolean                    | hidden FAQs aren't shown                                     |
| `assignees`                      | Json?                      | `{l1..l5}` — used by backend routing; **not student-facing** |
| `meta`                           | Json?                      | stores votes                                                 |

### 2.4 `user_callback_tickets` — callbacks _(schema.prisma:3001)_

Student-relevant columns: `id`, `user_id`, `batch_id`, `category` (reason),
`preferred_time_slot`, `status` (`pending` → `resolved`), `created_at`.
Admin columns (`assigned_to`, `resolved_by`, `admin_comment`, `resolved_at`, `logs`) are
**not student-facing** — the student only creates and lists their own callbacks.

### 2.5 `interactions` + `interaction_messages` — chatbot _(schema.prisma:3110 / 3126)_

`interactions`: `id`, `user_id`, `title`, `category`, `ticket_id?` (set if the chat
spawned a ticket). `interaction_messages`: `id`, `interaction_id`, `message`, `user_id`
(real user or bot), `sent_at`.

### 2.6 Referenced tables (read-only context for the student UI)

| Table                          | Why the student side reads it                                   |
| ------------------------------ | --------------------------------------------------------------- |
| `users`                        | author identity / display in the thread                         |
| `batches` (`batches.settings`) | which batch's FAQs/coordinators apply; whether 1:1 is enabled   |
| `sections` / `section_user`    | "active section" gate; coordinator (IA/EC/PC) info for SlotBook |
| `menus`                        | **ticket categories** are sourced from this table               |

### 2.7 Relationships (student slice)

```
users ──< tickets ──< comments              tickets ──< interactions ──< interaction_messages
batches ──< help_faqs                       batches ──< user_callback_tickets >── users
menus ──► category source for tickets/FAQs
```

---

## 3. GraphQL contract the student app uses

Schema: `experience-api/src/features/ticket/typeDef.graphql`. The student operations are
generated into `experience-ui/apps/student-experience/src/graphql`.

### 3.1 Queries

| Operation                                       | Purpose                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `GetTickets(page, ticketsFilter)`               | Paginated list; `tab` = unresolved / resolved / all (own tickets)   |
| `GetTicketById(id)`                             | One ticket with status, category, rating, assignee, timestamps      |
| `GetCommentsByTicketId(ticketId, categoryTat?)` | The thread (public comments)                                        |
| `GetFAQs(searchQuery, filter, limit)`           | FAQ search by text / category / sub_category / batch_id             |
| `GetTicketCategoriesWithSubcategories`          | Category tree for the picker                                        |
| `CallbackReasons` / `CallbackTimeslots`         | Options for the callback form                                       |
| `GetUserBatchesWithShowBatchDetails(userId)`    | Batches + settings (drives multi-batch UI, escalation availability) |
| `GetInstituteSupportInfoByBatchId(batchId)`     | Batch support contact info (phone, support text)                    |
| `GetSectionDetailsOfUser(userId)`               | Section coordinators (IA/EC/PC + Calendly) for SlotBook             |
| `GetSectionsForTicket`                          | Active-section check (creation gate)                                |
| `GetLegalAgreementData`                         | Agreement gate                                                      |
| `Me`                                            | Current user (feeStatus, new-journey flag)                          |

### 3.2 Mutations

| Operation                  | Purpose                         | Key inputs                                                                  |
| -------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `CreateTicketV2`           | **Primary** ticket create       | `message`, `category`, `batch_id`, `data` (subCategory, help_faq_question…) |
| `CreateTicket`             | Legacy create (don't rebuild)   | `title`, `category`, `priority`, `message`, `department`, `data`            |
| `CreateChatbotTicket`      | Ticket from chatbot flow        | user choices                                                                |
| `AddTicketComment`         | Student reply                   | `ticketId`, `data { message, public:true }`                                 |
| `UpdateTicketRating`       | Rate after resolve              | `id`, `input { rating: 1 \| 5 }`                                            |
| `ReopenTicket`             | Reopen after 👎                 | `id`                                                                        |
| `EscalateTicket`           | Escalate resolved/closed ticket | `id`                                                                        |
| `VoteFAQ`                  | Up/downvote an FAQ              | `faqId`, `voteType`                                                         |
| `ConfirmTicket`            | Confirm resolution              | `id`, `data { resolution }`                                                 |
| `CreateUserCallbackTicket` | Request a callback              | `category`, `preferedtimeslot`, `batch_id`                                  |

> The `Ticket` GraphQL type also exposes computed fields the UI uses: `categoryTat`,
> `hasAdminResponse`, `commentCount`, `assignee`, `user`.

### 3.3 Side endpoints the student UI calls (non-GraphQL)

- **File upload:** S3 **presigned POST** (mutation `CreatePresignedPostPolicyForS3` or
  equivalent), then a direct multipart POST to S3. Max **5 files**; URLs embedded into the
  message as markdown `[name](url)`.
- **Temporal kickoff:** after V2 create, the backend triggers a workflow
  (`POST /api/temporal/start?ticketId=…`) — fire-and-forget; the UI doesn't wait on it.

---

## 4. Frontend structure (`apps/student-experience`)

### 4.1 Routing — `src/pages/Routes.tsx`

```tsx
<Route path="/support" element={<Tickets />} />
<Route path="/support/:id" element={<Navigate to="/support" replace />} />
<Route path="/support/create" element={<Navigate to="/support" replace />} />
```

Helpers — `src/utils/route.utils.ts`:

```ts
support: {
  main: () => `/support?tab=unresolved`,
  details: (id: number) => `/support/${id}`,
  createSupport: () => `/support/create`,
}
```

View state is driven by **URL search params**: `tab`, `page`, `category`, `subcategory`,
`step` (`ticketCreate` / `ticketdetails`), `ticketId`, `tickets` (sub-tab), `searchQuery`.

### 4.2 Component map — `src/pages/tickets/`

| Component                                                                                                                                      | Role                                                                         | Rebuild priority        |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------- |
| `index.tsx` (`Tickets`)                                                                                                                        | Root `/support`; picks `BatchTickets` (new) vs `OldTickets` (legacy)         | rebuild as single entry |
| `BatchTickets.tsx`                                                                                                                             | New container: Help / Raised Tickets / 1:1 tabs, FAQs, categories, callbacks | ⭐ core                 |
| `CreateTicketModal.tsx`                                                                                                                        | Create / view / reply / rate / escalate (the workhorse)                      | ⭐ core                 |
| `TicketListingPage.tsx`                                                                                                                        | List with Unresolved/Resolved/All + pagination                               | ⭐ core                 |
| `FaqList.tsx`                                                                                                                                  | FAQ accordion: search, up/down vote, "raise ticket"                          | ⭐ core                 |
| `SupportModal.tsx`                                                                                                                             | Search + FAQ + category browse + messaging                                   | core                    |
| `CategoryAccordion.tsx`, `SupportEntityList.tsx`, `supportEntityCategories.ts`                                                                 | Category/subcategory browse + entities (people/links/info)                   | core                    |
| `SlotBook.tsx`, `PairProgramming/PairProgrammingTab.tsx`                                                                                       | Coordinator + 1:1 Calendly booking                                           | optional                |
| `RatingPopup.tsx`, `ReopenWarning.tsx`                                                                                                         | Rating & reopen dialogs                                                      | core                    |
| `faqType.ts`, `ticketsSearchUtils.ts`                                                                                                          | Types + search helpers                                                       | reuse                   |
| `CreateTicket/` (`index`, `Chatbot`, `CreateTicketFields`, `RestrictedPopup`)                                                                  | Legacy create + chatbot triage                                               | chatbot only            |
| `OldTickets.tsx`, `TicketDetails.tsx`, `TicketDetailsHeader.tsx`, `TicketResponses.tsx`, `AddResponseSection.tsx`, `ChatbotTicketMessages.tsx` | Legacy detail/thread views                                                   | ❌ deprecated           |

### 4.3 Data layer

- Generated **react-query hooks** in `src/graphql` (e.g. `useCreateTicketV2Mutation`,
  `useGetTicketByIdQuery`, `useGetCommentsByTicketIdQuery`, `useAddTicketCommentMutation`,
  `useGetFaqsQuery`, `useUpdateTicketRatingMutation`, `useReopenTicketMutation`,
  `useEscalateTicketMutation`, `useGetUserBatchesWithShowBatchDetailsQuery`).
- Transport — `src/config/apiClient.ts → useAxios`: POSTs `{ query, variables }` to
  `REACT_APP_GQL_BASE_URL` with `Authorization: Bearer <token>` and `x-app-origin`.
- **State:** react-query (server state) + `AuthContext` / `AgreementMenuContext` + URL
  search params for view state. File uploads via the `useFileUpload` hook.
- Codegen config: `apps/student-experience/codegen.yml`.

---

## 5. End-to-end student journeys (UI → GraphQL → DB)

### 5.1 Raise a ticket (V2 — the path to rebuild)

```
1. FaqList "Raise Support Ticket" → CreateTicketModal (category + subcategory prefilled)
2. Student writes message; useFileUpload → S3 presigned upload (≤5 files)
3. useCreateTicketV2Mutation → POST /graphql (CreateTicketV2)
     vars: { message, category, batch_id, data:{ subCategory, help_faq_question, question_id? } }
4. Backend: validates batch access, auto-assigns L1 owner, generates title,
   status='open', writes logstamps; INSERT tickets; fires Temporal workflow.
5. UI: navigate to step=ticketdetails&ticketId=<id>; react-query refetches ticket + comments.
```

### 5.2 View & reply

```
GetTicketById + GetCommentsByTicketId  → render header + thread (public comments only)
If status ∈ {open, re-opened}: show reply box
  → useAddTicketCommentMutation → AddTicketComment { ticketId, data:{ message, public:true } }
  → INSERT comments; thread refetches
Coordinator replies arrive as new public comments (student also gets email + push).
```

### 5.3 Resolve → rate → reopen / escalate

```
Status becomes 'resolved' (by coordinator) → UI shows 👍/👎
  👍 → UpdateTicketRating { rating: 5 }   (done)
  👎 → UpdateTicketRating { rating: 1 }   → ReopenWarning → ReopenTicket → status='re-opened'
On resolved/closed: "Escalate" (if higher level exists) → EscalateTicket → status='re-opened', new owner
```

### 5.4 Request a callback

```
CallbackReasons → CallbackTimeslots → CreateUserCallbackTicket { category, preferedtimeslot, batch_id }
Backend rejects if a pending callback already exists for (user, batch); else INSERT (status='pending')
Student can list their callbacks; resolution happens off-screen.
```

### 5.5 Chatbot

```
Student message → interaction created → bot replies → may CreateChatbotTicket and link interactions.ticket_id
UI renders the chat (ChatbotTicketMessages); if a ticket is created, deep-links into it.
```

---

## 6. State machine the UI must implement

The available student actions are a pure function of `status` + `rating`:

| Status      | Reply | Rate     | Reopen        | Escalate                  |
| ----------- | ----- | -------- | ------------- | ------------------------- |
| `open`      | ✅    | –        | –             | –                         |
| `re-opened` | ✅    | –        | –             | –                         |
| `resolved`  | –     | ✅       | ✅ (after 👎) | ✅ (if next level exists) |
| `closed`    | –     | ✅       | ✅ (after 👎) | ✅ (if next level exists) |
| `automatic` | –     | optional | –             | –                         |

"Next level exists" comes from the batch's coordinator settings (surfaced via
`GetUserBatchesWithShowBatchDetails`); the UI just shows/hides the Escalate action.

---

## 7. Gates the UI must enforce before ticket creation

| Gate            | Source                               | Behavior                                         |
| --------------- | ------------------------------------ | ------------------------------------------------ |
| Active section  | `GetSectionsForTicket`               | no active section → block create                 |
| Legal agreement | `GetLegalAgreementData`              | not accepted → banner + "Complete Agreement" CTA |
| Batch selection | `GetUserBatchesWithShowBatchDetails` | multi-batch → pick batch first                   |
| File limit      | client                               | max 5 attachments                                |

---

## 8. Key files cheat-sheet (student side)

**experience-ui — `apps/student-experience/`**

- `src/pages/tickets/*` — all student UI (see §4.2)
- `src/pages/Routes.tsx`, `src/utils/route.utils.ts` — routing
- `src/graphql/*` — generated hooks + `.gql` documents
- `src/config/apiClient.ts` — `useAxios` GraphQL transport
- `src/hooks/useFileUpload.tsx` — S3 attachment upload
- `codegen.yml` — GraphQL codegen config

**experience-api (contract reference only — not rebuilt here)**

- `src/features/ticket/typeDef.graphql` — GraphQL schema for tickets/FAQs
- `src/features/ticket/resolver.ts` — student-facing resolvers
- `src/features/userCallbackTickets/*` — callbacks
- `src/routes/supportChatbot.ts` — chatbot
- `prisma/schema.prisma` — tables (2457 tickets, 724 comments, 3396 help_faqs, 3001 callbacks, 3110/3126 interactions)

---

## 9. Rebuild notes (student side)

- **GraphQL is the only transport the student app uses** — design the new client around
  the operations in §3; ignore the REST routes.
- **Render only `public = true` comments** — internal coordinator notes must never leak.
- **Categories come from `menus`, FAQ categories from `help_faqs`** — there's no single
  taxonomy table; decide how you want to model categories in the new client.
- **Routing/escalation is backend-owned** — the student UI never picks an assignee; it
  only displays status and offers rate/reopen/escalate. Model the §6 state machine cleanly.
- **Heavy JSON fields** (`tickets.data/meta/logstamps`) are backend bookkeeping — the UI
  reads a few keys (`batch_id`, `question_id`, `subCategory`) but shouldn't depend on the rest.
- **Build the V2/`BatchTickets` flow only**; the V1 form and `OldTickets` views are
  deprecated.

---

## 10. COMPLETE API inventory — everything the student app calls

> This is the authoritative, code-verified list of **every** API invoked from
> `apps/student-experience` for the support feature, extracted directly from the page
> components (`grep` of every `use*Query` / `use*Mutation` hook + raw `fetch`). Use this
> as your backend implementation checklist. Each row maps the **UI hook → GraphQL
> operation → which UI file uses it → which backend module owns the logic → what the
> logic does**.
>
> **Important architectural finding:** the support feature is _not_ self-contained. It
> calls operations owned by **~10 other backend modules** (batch, sections, profile,
> assignment, lecture, menu, systemServices, …). When you "implement those logics," you
> only need to **own the Support-core group (A)**. Group (B) operations are platform
> services your support UI merely _consumes_ — implement them only if the new repo
> doesn't already provide them.

### A. Support-core APIs — **you must implement these**

These live in the support-owned backend modules (`ticket`, `comment`,
`userCallbackTickets`, plus the `menu` rows that back support config).

| UI hook                                        | GraphQL op                                         | Type | UI file(s)                               | Backend module           | Logic to implement                                                                                                                                                                                                                                       |
| ---------------------------------------------- | -------------------------------------------------- | ---- | ---------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useCreateTicketV2Mutation`                    | `createTicketV2(input)`                            | M    | CreateTicketModal                        | `ticket`                 | Validate batch access; **auto-resolve L1 assignee** (FAQ `assignees.l1` → else batch `discussionPC`/`opsPC` by category → else fallback); auto-generate title; `status='open'`; write `logstamps.L1_assigned_at`; INSERT ticket; fire Temporal workflow. |
| `useGetTicketsQuery`                           | `getTickets(page, ticketsFilter)`                  | Q    | TicketListingPage, BatchTickets          | `ticket`                 | List **own** tickets, paginated; filter by `tab` (unresolved/resolved/all), category, status, batch_ids; compute `commentCount`, `hasAdminResponse`, `categoryTat`.                                                                                      |
| `useGetTicketByIdQuery`                        | `getTicketById(id)`                                | Q    | CreateTicketModal                        | `ticket`                 | Fetch single ticket (ownership-checked) + category TAT details + assignee/user.                                                                                                                                                                          |
| `useGetCommentsByTicketIdQuery`                | `getCommentsByTicketId(id, categoryTat)`           | Q    | CreateTicketModal                        | `comment`                | Return the thread; **only `public=true` comments** for students; include author display info.                                                                                                                                                            |
| `useAddTicketCommentMutation`                  | `addTicketComment(ticketId, data)`                 | M    | CreateTicketModal, AddResponseSection    | `comment`                | INSERT comment (`public=true` for student replies); bump ticket `updated_at`. (Admin path appends signature + email/push — not student-built.)                                                                                                           |
| `useUpdateTicketRatingMutation`                | `updateTicketRating(id, input)`                    | M    | CreateTicketModal, RatingPopup           | `ticket`                 | Set `rating` (1=👎/5=👍) + optional reason; gates the Reopen action.                                                                                                                                                                                     |
| `useReopenTicketMutation`                      | `reopenTicket(id)`                                 | M    | CreateTicketModal, ReopenWarning         | `ticket`                 | Set `status='re-opened'`; log the reopen.                                                                                                                                                                                                                |
| `useEscalateTicketMutation`                    | `escalateTicket(id)`                               | M    | CreateTicketModal                        | `ticket`                 | Resolve assignee ladder (FAQ `assignees` or batch settings), match current level, move to next (L1→L5); `status='re-opened'`; update `info`/`logstamps`/`meta.escalation_count`.                                                                         |
| `useConfirmTicketMutation`                     | `confirmTicket(id, data)`                          | M    | CreateTicketModal                        | `ticket`                 | Student confirms/declines resolution (`resolution` bool, optional mode/reason).                                                                                                                                                                          |
| `useGetTicketCategoriesWithSubcategoriesQuery` | `getTicketCategoriesWithSubcategories`             | Q    | BatchTickets, SupportModal               | `ticket` (reads `menus`) | Return category→subcategory tree (sourced from `menus` table).                                                                                                                                                                                           |
| `useGetFaqsQuery`                              | `getFAQs(searchQuery, filter, limit)`              | Q    | FaqList, SupportModal, CreateTicketModal | `ticket`                 | Search `help_faqs` by text/category/sub_category/`batch_id`; exclude hidden.                                                                                                                                                                             |
| `useVoteFaqMutation`                           | `voteFAQ(faqId, voteType)`                         | M    | FaqList                                  | `ticket`                 | Record up/down vote (currently stored in FAQ `meta`).                                                                                                                                                                                                    |
| `useCallbackReasonsQuery`                      | `callbackReasons`                                  | Q    | BatchTickets                             | `menu`                   | Return `menus` rows where category=`call-backrequest-reason`.                                                                                                                                                                                            |
| `useCallbackTimeslotsQuery`                    | `callbackTimeslots`                                | Q    | BatchTickets                             | `menu`                   | Return `menus` rows where category=`call-backrequest-timeslot`.                                                                                                                                                                                          |
| `useCreateUserCallbackTicketMutation`          | `createUserCallbackTicket(input)`                  | M    | BatchTickets                             | `userCallbackTickets`    | Reject if a `pending` callback exists for (user,batch); INSERT (`status='pending'`); Slack ping to ops.                                                                                                                                                  |
| `useCreateChatbotTicketMutation`               | `createChatbotTicket(input)`                       | M    | CreateTicket/Chatbot                     | `ticket`                 | Create a ticket from the chatbot triage flow.                                                                                                                                                                                                            |
| `useGetCreateTicketOptionsQuery`               | `getCreateTicketOptions(category, userChoicesArr)` | Q    | CreateTicket/Chatbot                     | `ticket`                 | Drive the chatbot's branching category/option prompts.                                                                                                                                                                                                   |

> Also exists in the support modules but **admin-only** (do **not** build for student
> side): `updateTicketById`, `updateTicketStatus`, `bulkAddAgent`, `getColumnValues`,
> `getUsersForDropdown`, `getCommentsByTicketIdAdmin`, `getAiTicketResponse`,
> `ticketReplySignaturePreview`, `getTemplates`/`createTemplate`, `createFAQ`/`updateFAQ`,
> `adminCallbackTickets`/`updateAdminCallbackTicket`.

### B. Shared/platform APIs — **consumed, owned by other modules**

The support UI calls these but they belong to other features. Implement only if your new
repo doesn't already have them; otherwise just wire the support UI to the existing ones.

| UI hook                                      | GraphQL op                                   | UI file                         | Owning module        | Why support needs it                                                               |
| -------------------------------------------- | -------------------------------------------- | ------------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `useGetUserBatchesWithShowBatchDetailsQuery` | `getUserBatchesWithShowBatchDetails`         | BatchTickets, CreateTicketModal | `batch`              | Batch list + settings → multi-batch UI, escalation availability, support contacts. |
| `useGetSectionsForTicketQuery`               | `getSectionsForTicket` (`SectionsForTicket`) | (creation gate)                 | `sectionUser`        | Active-section gate for ticket creation.                                           |
| `useGetSectionDetailsOfUserQuery`            | `getSectionDetailsOfUser`                    | SlotBook                        | `sectionUser`        | Section coordinators (IA/EC/PC + Calendly) for slot booking.                       |
| `useGetAllActiveSectionsQuery`               | `getAllActiveSections`                       | CreateTicket/CreateTicketFields | `sections`           | (legacy form) section dropdown.                                                    |
| `useGetInstituteSupportInfoByBatchIdQuery`   | `getInstituteSupportInfoByBatchId`           | BatchTickets                    | `institute`          | Batch support phone/text.                                                          |
| `useGetLegalAgreementDataQuery`              | `legalAgreement` (`LegalAgreement`)          | (creation gate)                 | `profile`            | Agreement gate before ticket creation.                                             |
| `useMeQuery`                                 | `me`                                         | (gating)                        | `profile`            | Current user (feeStatus, new-journey flag) → which flow/feature toggles.           |
| `useGetServerTimeQuery`                      | `getServerTime`                              | CreateTicket/index              | `systemServices`     | (legacy) server time for the V1 form.                                              |
| `useGetBatchDurationOfUserQuery`             | `getBatchDurationOfUser`                     | CreateTicket/index              | `batchUser`/`ticket` | (legacy) FT/PT duration for auto-close rules.                                      |
| `useGetAssignmentsQuery`                     | `getAssignments`                             | SupportEntityList               | `assignment`         | Show related assignment links as support entities.                                 |
| `useLecturesQuery`                           | `lectures`                                   | SupportEntityList               | `lecture`            | Show related lectures as support entities.                                         |
| `useResourcesQuery`                          | `resources`                                  | SupportEntityList               | `lecture`            | Show related resources as support entities.                                        |

### C. Non-GraphQL calls

| Call                                                            | Where                                 | Purpose                                                                          |
| --------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| `POST {baseUrl}/api/temporal/start?ticketId=<id>` (raw `fetch`) | CreateTicketModal:94                  | Kick off the Temporal workflow right after V2 ticket creation (fire-and-forget). |
| S3 **presigned POST** (via `useFileUpload`)                     | CreateTicketModal, AddResponseSection | Upload up to 5 attachments; URLs embedded into the message as markdown.          |

### D. Legacy V1-only (skip if building only the new flow)

`createTicket` (V1), and its supporting `getCreateTicketOptions` / `getServerTime` /
`getBatchDurationOfUser` / `getAllActiveSections` usage inside `CreateTicket/*`. These
back the deprecated `OldTickets` / `/support/create` form.

### Bottom line for the rebuild

- **Implement Group A** (16 support-core operations + callback config) — this _is_ the
  support backend.
- **Group B** are dependencies on platform modules — confirm they exist in the new repo
  or stub them.
- **Group C** (Temporal + S3) are infra integrations to recreate or replace.
- **Group D** can be dropped entirely if you only build the V2 flow.

> The earlier draft of this doc (§3) listed the _primary_ operations; this §10 is the
> **exhaustive, verified** set. If §3 and §10 ever disagree, §10 is correct.
