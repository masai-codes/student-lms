# Student Support — UI Component Catalogue & Mock API Specification

> **Goal of this doc:** Give you everything to build a **mock UI flow first** (clickable,
> with stubbed data), then swap stubs for real APIs. Two parts:
>
> - **Part 1 — UI Components:** an extensive, build-ready inventory of every component,
>   what it's for, how it looks, its props/states, and which API feeds it.
> - **Part 2 — Mock APIs:** every student-side call (reads = GET, writes = POST/PUT),
>   with request shape + a realistic mock JSON response so you can stub a mock server
>   (MSW / json-server / a `mocks/` module) and later build the real endpoints.
>
> Scope: **student side only**, the **new (V2) flow**. Companions:
> [`03-PRD-Student-Side`](./03-PRD-Student-Side.md),
> [`04-Codebase-Student-Side`](./04-Codebase-Student-Side.md).

---

# PART 1 — UI COMPONENTS

## 1.1 Design principles (how the experience should feel)

1. **Self-service first.** Search + FAQs are the front door; raising a ticket is the
   fallback, never the first thing offered.
2. **Status-driven.** What a student can do (reply / rate / reopen / escalate) is a pure
   function of ticket `status` + `rating`. Build a small state machine, not scattered `if`s.
3. **Batch-aware.** Everything (FAQs, categories, coordinators, callbacks) is scoped to
   the student's batch; multi-batch users pick a batch first.
4. **Modal/drawer-centric.** Creating and viewing a ticket happens in an overlay over the
   Help page (URL-driven: `?step=...&ticketId=...`), not a full page nav.
5. **Gated.** Active-section + legal-agreement checks can block ticket creation — design
   the blocked states as first-class, not afterthoughts.

## 1.2 Screen / route map

| Route / state                               | Screen                             | Driven by                         |
| ------------------------------------------- | ---------------------------------- | --------------------------------- |
| `/support` (default `?tab=help`)            | Help / self-service home           | `SupportPage`                     |
| `/support?tab=tickets`                      | My tickets list                    | `TicketListPage`                  |
| `/support?tab=one-on-one`                   | 1:1 / coordinator booking          | `PairProgrammingTab`              |
| `?step=ticketCreate&category=&subcategory=` | Create-ticket overlay              | `CreateTicketModal`               |
| `?step=ticketdetails&ticketId=123`          | Ticket detail/conversation overlay | `CreateTicketModal` (detail mode) |
| `?callback=open`                            | Request-callback overlay           | `CallbackModal`                   |

## 1.3 Component tree (hierarchy)

```
SupportPage
├─ SupportHeader
├─ BatchSelector                         (multi-batch only)
├─ SupportTabs ─ [Help | My Tickets | 1:1 Support]
│
├─ (tab=help)  HelpHome
│   ├─ SupportSearchBar
│   ├─ CreationGateBanner               (LegalAgreementBanner | NoActiveSectionState)
│   ├─ RequestCallbackButton
│   ├─ SupportContactCard               (phone / support text)
│   ├─ CategoryGrid
│   │   └─ CategoryCard*
│   ├─ SubcategoryList                  (after a category is picked)
│   │   └─ SubcategoryRow*
│   ├─ FaqList / FaqAccordion
│   │   └─ FaqItem*
│   │       ├─ FaqAnswer (MarkdownRenderer)
│   │       ├─ FaqVoteButtons (👍/👎)
│   │       └─ RaiseTicketCTA
│   ├─ SupportEntityList                (people / links / lectures / resources)
│   │   └─ SupportEntityCard*
│   └─ SearchEmptyState
│
├─ (tab=tickets)  TicketListPage
│   ├─ TicketStatusTabs ─ [Unresolved | Resolved | All]
│   ├─ TicketCard*
│   │   ├─ TicketStatusBadge
│   │   └─ TicketMetaRow (id, category, updated_at)
│   ├─ TicketListPagination
│   └─ EmptyTicketsState
│
├─ (tab=one-on-one)  PairProgrammingTab
│   └─ CoordinatorCard*  (IA / EC / PC + Calendly link)
│
└─ Overlays (portal)
    ├─ CreateTicketModal
    │   ├─ ModalHeader (back / close)
    │   ├─ (create mode)
    │   │   ├─ CategorySubcategoryPill
    │   │   ├─ MessageEditor (markdown)
    │   │   ├─ FileUploader → AttachmentChip*
    │   │   └─ SubmitTicketButton
    │   └─ (detail mode)
    │       ├─ TicketDetailHeader (status, category, date, assignee avatar)
    │       ├─ ConversationThread
    │       │   ├─ StatusBasedResponseCard
    │       │   └─ MessageBubble*  (student | agent | bot, + AttachmentPreview)
    │       ├─ ReplyBox            (only when open/re-opened)
    │       └─ ResolutionFooter
    │           ├─ RatingWidget (👍/👎)
    │           ├─ ReopenButton
    │           └─ EscalateButton
    ├─ RatingPopup
    ├─ ReopenWarningDialog
    ├─ CallbackModal
    │   ├─ CallbackReasonSelect
    │   ├─ CallbackTimeslotSelect
    │   └─ CallbackConfirmation
    └─ ChatbotWidget                     (optional)
        ├─ ChatMessageList → ChatMessageBubble*
        ├─ ChatOptionButtons
        └─ ChatInput

Primitives (shared): Modal/Drawer, Tabs, Accordion, Button, Avatar, Badge,
SearchInput, Spinner, Skeleton, Toast, EmptyState, ErrorState, MarkdownRenderer.
```

## 1.4 Component-by-component spec

> Legend: **P** = page/route container · **C** = container (fetches data) · **V** =
> presentational/view · **U** = primitive. "API" = the mock endpoint(s) from Part 2.

### Shell & navigation

| Component       | Type | Purpose & look                                                                                                                                     | Key props                      | State                          | API                    |
| --------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------ | ---------------------- |
| `SupportPage`   | P    | Root of `/support`. Reads `tab`/`step` from URL, renders header + tabs + active panel + overlays. Full-width page with a max-width content column. | –                              | `activeTab`, `selectedBatchId` | `me`, `getUserBatches` |
| `SupportHeader` | V    | Title ("Support"), short helper text.                                                                                                              | `title`                        | –                              | –                      |
| `BatchSelector` | C    | Dropdown/segmented control shown only if user has >1 batch; switches the batch scope for FAQs/categories/callbacks.                                | `batches`, `value`, `onChange` | `open`                         | `getUserBatches`       |
| `SupportTabs`   | U    | Top tabs: **Help · My Tickets · 1:1 Support** (1:1 hidden if disabled). Updates `?tab=`.                                                           | `tabs`, `active`, `onChange`   | –                              | –                      |

### Help / self-service

| Component                  | Type | Purpose & look                                                                                               | Key props                          | State                              | API                                       |
| -------------------------- | ---- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------- | ---------------------------------- | ----------------------------------------- |
| `HelpHome`                 | C    | The default panel: search bar on top, then categories or (after pick) subcategories + FAQs.                  | `batchId`                          | `query`, `category`, `subcategory` | `getCategories`, `getFAQs`                |
| `SupportSearchBar`         | V    | Prominent search input (debounced ~500ms); searching switches the body to FAQ results.                       | `value`, `onChange`, `placeholder` | debounced text                     | `getFAQs`                                 |
| `CategoryGrid`             | V    | Grid of tappable category cards (icon + label).                                                              | `categories`, `onSelect`           | –                                  | `getCategories`                           |
| `CategoryCard`             | V    | One category tile.                                                                                           | `category`, `onClick`              | hover                              | –                                         |
| `SubcategoryList`          | V    | List shown after a category is chosen; each row drills into its FAQs.                                        | `subcategories`, `onSelect`        | –                                  | `getSubcategories`                        |
| `FaqList` / `FaqAccordion` | C    | Accordion of FAQ items for the current search/category.                                                      | `faqs`, `loading`                  | `expandedId`                       | `getFAQs`                                 |
| `FaqItem`                  | V    | Question header → expandable answer (markdown) + vote + "didn't help, raise a ticket".                       | `faq`, `expanded`, `onToggle`      | expanded                           | –                                         |
| `FaqVoteButtons`           | C    | 👍/👎; optimistic toggle.                                                                                    | `faqId`, `currentVote`             | voting                             | `voteFAQ`                                 |
| `RaiseTicketCTA`           | V    | Button inside an FAQ / at bottom of results → opens `CreateTicketModal` with category+subcategory prefilled. | `category`, `subcategory`          | –                                  | –                                         |
| `SupportContactCard`       | C    | Batch support phone number + support text (e.g. "Call us 10am–6pm").                                         | `batchId`                          | –                                  | `getInstituteSupportInfo`                 |
| `SupportEntityList`        | C    | Curated people/links/lectures/resources for a category (optional enrichment).                                | `category`, `batchId`              | –                                  | `getAssignments`, `lectures`, `resources` |
| `RequestCallbackButton`    | V    | CTA that opens `CallbackModal`.                                                                              | `onClick`                          | –                                  | –                                         |
| `SearchEmptyState`         | V    | "No FAQs found — raise a ticket instead."                                                                    | `query`                            | –                                  | –                                         |

### Creation gates

| Component              | Type | Purpose & look                                                                               | API                    |
| ---------------------- | ---- | -------------------------------------------------------------------------------------------- | ---------------------- |
| `LegalAgreementBanner` | C    | Warning banner blocking ticket creation until agreements accepted; "Complete Agreement" CTA. | `legalAgreement`       |
| `NoActiveSectionState` | C    | Empty/blocked state when the student has no active section.                                  | `getSectionsForTicket` |
| `RestrictedPopup`      | V    | Modal explaining the student can't raise a ticket right now.                                 | –                      |

### Ticket list

| Component              | Type | Purpose & look                                                                                   | Key props            | State         | API          |
| ---------------------- | ---- | ------------------------------------------------------------------------------------------------ | -------------------- | ------------- | ------------ |
| `TicketListPage`       | C    | Panel listing the student's tickets.                                                             | `batchId`            | `tab`, `page` | `getTickets` |
| `TicketStatusTabs`     | U    | **Unresolved · Resolved · All** sub-tabs (`?tab=`).                                              | `active`, `onChange` | –             | –            |
| `TicketCard`           | V    | Row/card: title, category chip, status badge, last-updated, unread hint. Click → detail overlay. | `ticket`, `onClick`  | –             | –            |
| `TicketStatusBadge`    | U    | Colored pill: open / re-opened / resolved / closed / automatic.                                  | `status`             | –             | –            |
| `TicketListPagination` | U    | Page controls or infinite scroll.                                                                | `page`, `hasMore`    | –             | `getTickets` |
| `EmptyTicketsState`    | V    | "No tickets yet" with a CTA to Help.                                                             | –                    | –             | –            |

### Ticket detail / conversation

| Component                              | Type | Purpose & look                                                                                                  | Key props                             | State                | API                                                               |
| -------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| `CreateTicketModal`                    | C    | The workhorse overlay; **two modes**: _create_ and _detail_. Full-screen on mobile, centered drawer on desktop. | `category`, `subcategory`, `batchId`  | mode, message, files | `getTicketById`, `getComments`, `createTicketV2`, `addComment`, … |
| `MessageEditor`                        | V    | Markdown textarea with basic toolbar; the ticket body / reply text.                                             | `value`, `onChange`                   | –                    | –                                                                 |
| `FileUploader`                         | C    | Drag/drop + picker, **max 5 files**; shows progress; embeds uploaded URLs into the message.                     | `files`, `onAdd`, `onRemove`, `max=5` | uploading            | `presignUpload` (+S3 PUT)                                         |
| `AttachmentChip`                       | V    | One attached file (name, size, remove ✕, progress).                                                             | `file`, `onRemove`                    | –                    | –                                                                 |
| `SubmitTicketButton`                   | V    | Primary submit; disabled until message non-empty; spinner while creating.                                       | `loading`, `disabled`                 | –                    | `createTicketV2`                                                  |
| `TicketDetailHeader`                   | V    | Ticket #id, status badge, category, created date, assignee avatar/name, back.                                   | `ticket`                              | –                    | `getTicketById`                                                   |
| `ConversationThread`                   | C    | Scrollable message list, oldest→newest; renders status card + bubbles.                                          | `comments`, `statusResponse`          | –                    | `getComments`                                                     |
| `MessageBubble`                        | V    | One message; left=agent/bot, right=student; avatar, name, timestamp, markdown body.                             | `message`, `side`, `author`           | –                    | –                                                                 |
| `StatusBasedResponseCard`              | V    | System message reflecting current status (e.g. "Your ticket is being reviewed", TAT note).                      | `heading`, `message`, `author`        | –                    | `getComments`                                                     |
| `AttachmentPreview`                    | V    | Inline image/file preview parsed from message markdown.                                                         | `url`, `name`                         | –                    | –                                                                 |
| `ReplyBox`                             | C    | Reply input + file upload; visible only when `open`/`re-opened`.                                                | `ticketId`                            | text, files          | `addComment`                                                      |
| `ResolutionFooter`                     | C    | Shown when resolved/closed: rating + reopen + escalate actions.                                                 | `ticket`                              | –                    | –                                                                 |
| `RatingWidget`                         | C    | 👍/👎 quick rating after resolve.                                                                               | `ticketId`, `value`                   | –                    | `updateRating`                                                    |
| `RatingPopup`                          | V    | Optional modal to capture a reason with the rating.                                                             | `onSubmit`                            | reason               | `updateRating`                                                    |
| `ReopenButton` + `ReopenWarningDialog` | C/V  | Reopen after a 👎, with a confirm dialog.                                                                       | `ticketId`                            | confirming           | `reopenTicket`                                                    |
| `EscalateButton`                       | C    | Escalate to next level (hidden if no higher level for the batch).                                               | `ticketId`, `canEscalate`             | –                    | `escalateTicket`                                                  |

### Callback

| Component                          | Type | Purpose & look                                            | API                                                            |
| ---------------------------------- | ---- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `CallbackModal`                    | C    | Multi-step overlay: reason → timeslot → confirm.          | `getCallbackReasons`, `getCallbackTimeslots`, `createCallback` |
| `CallbackReasonSelect`             | V    | Radio/list of reasons.                                    | `getCallbackReasons`                                           |
| `CallbackTimeslotSelect`           | V    | Radio/list of time slots.                                 | `getCallbackTimeslots`                                         |
| `CallbackConfirmation`             | V    | Success screen ("We'll call you back within 48h").        | –                                                              |
| `MyCallbacksList` / `CallbackCard` | C/V  | (Optional) list the student's callback requests + status. | `getMyCallbacks`                                               |

### Chatbot (optional)

| Component                               | Type | Purpose                                                  | API                                        |
| --------------------------------------- | ---- | -------------------------------------------------------- | ------------------------------------------ |
| `ChatbotWidget`                         | C    | Chat window for AI triage; can end by creating a ticket. | `getChatbotOptions`, `createChatbotTicket` |
| `ChatMessageList` / `ChatMessageBubble` | C/V  | Conversation transcript.                                 | –                                          |
| `ChatOptionButtons`                     | V    | Branching choice buttons returned by the bot.            | `getChatbotOptions`                        |
| `ChatInput`                             | V    | Free-text input.                                         | –                                          |

### 1:1 / coordinator booking

| Component            | Type | Purpose                                                      | API                       |
| -------------------- | ---- | ------------------------------------------------------------ | ------------------------- |
| `PairProgrammingTab` | C    | Lists coordinators by section; book via Calendly.            | `getSectionDetailsOfUser` |
| `CoordinatorCard`    | V    | IA/EC/PC: avatar, name, role, "Book a slot" (Calendly link). | –                         |

### Shared primitives (build once)

`Modal`/`Drawer`, `Tabs`, `Accordion`, `Button`, `IconButton`, `Avatar`, `Badge`/`Pill`,
`SearchInput`, `Spinner`, `Skeleton` (card/list/thread variants), `Toast`, `EmptyState`,
`ErrorState`, `MarkdownRenderer`, `Pagination`.

## 1.5 Wireframe sketches (how it looks)

**Help home**

```
┌─────────────────────────────────────────────┐
│  Support                          [Batch ▾]  │
│  [ Help ]  My Tickets   1:1 Support          │
├─────────────────────────────────────────────┤
│  🔎 Search for help…                          │
│  ⚠ Complete your agreement to raise a ticket │ ← gate (conditional)
│                                  [Request Callback] │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ Assi.│ │ Eval │ │ Leave│ │ Place│  …       │ ← CategoryGrid
│  └──────┘ └──────┘ └──────┘ └──────┘          │
│  ── after pick / search ──                    │
│  ▸ How do I submit late?            👍 👎      │ ← FaqItem
│  ▸ My score looks wrong             👍 👎      │
│     “Didn’t help?  [ Raise a ticket ]”        │
└─────────────────────────────────────────────┘
```

**Ticket detail (overlay)**

```
┌─────────────────────────────────────────────┐
│ ‹ Back            Ticket #1287   ● Resolved   │
│ Category: Evaluation · Raised 12 Jun          │
├─────────────────────────────────────────────┤
│ [System] Your ticket has been resolved.       │
│ ┌──────────────────────────────┐              │
│ │ (you) My score shows 0…       │  →           │
│ └──────────────────────────────┘              │
│           ┌──────────────────────────────┐    │
│        ←  │ (Coordinator) Re-evaluated…  │    │
│           └──────────────────────────────┘    │
├─────────────────────────────────────────────┤
│ Was this helpful?   👍   👎                    │
│ [ Reopen ]   [ Escalate ]                      │ ← shown by status
└─────────────────────────────────────────────┘
```

---

# PART 2 — MOCK API SPECIFICATION

## 2.1 How to use this for mocking

- Today the real backend is **GraphQL** (single `POST /graphql`). For your rebuild you can
  use **REST** — so below each call is given a **suggested REST method + path** (the form
  you'll build) **and** its GraphQL origin (for reference).
- Reads → **GET**, writes → **POST/PUT**. Stub these with MSW/json-server returning the
  **mock response** shown. The sample IDs are consistent across calls so you can seed one
  fixture file.
- Auth: assume `Authorization: Bearer <token>` on every call; `userId`/batch scoping is
  derived server-side from the token (don't trust client-sent user IDs).

**Group A = build these (support-core). Group B = platform deps. Group C = infra.**

---

## 2.2 Group A — Support-core APIs

### A1. List FAQs / search — `getFAQs`

- **GET** `/api/support/faqs?search=&category=&sub_category=&batch_id=&limit=20`
- Request: query params (all optional except `batch_id`).
- **Mock response:**

```json
{
  "faqs": [
    {
      "id": 101,
      "question": "How do I submit an assignment late?",
      "answer": "Go to the assignment page and use **Request Extension**…",
      "category": "assignment",
      "sub_category": "submission",
      "assignees": { "l1": 300, "l2": 301, "l3": 302, "l4": 303, "l5": 304 },
      "batch_id": 55
    },
    {
      "id": 102,
      "question": "My evaluation score looks wrong",
      "answer": "You can request a re-evaluation within 48 hours…",
      "category": "evaluation",
      "sub_category": "score",
      "assignees": { "l1": 300 },
      "batch_id": 55
    }
  ],
  "total": 2,
  "hasMore": false
}
```

### A2. Vote on an FAQ — `voteFAQ`

- **POST** `/api/support/faqs/:faqId/vote`
- Request body: `{ "voteType": "upvote" | "downvote" }`
- **Mock response:**

```json
{
  "success": true,
  "message": "Vote recorded",
  "faqId": 101,
  "voteType": "upvote"
}
```

- (Optional undo) **DELETE** `/api/support/faqs/:faqId/vote` → `{ "success": true }`

### A3. Ticket categories + subcategories — `getTicketCategoriesWithSubcategories`

- **GET** `/api/support/categories`
- **Mock response:**

```json
{
  "categories": [
    {
      "category": "Assignment",
      "value": "assignment",
      "subcategories": [{ "value": "submission" }, { "value": "extension" }]
    },
    {
      "category": "Evaluation",
      "value": "evaluation",
      "subcategories": [{ "value": "score" }, { "value": "missed" }]
    },
    {
      "category": "Leave",
      "value": "leave",
      "subcategories": [{ "value": "health" }]
    }
  ]
}
```

- Subcategories alone: **GET** `/api/support/categories/:categoryValue/subcategories` →

```json
{
  "categoryValue": "evaluation",
  "total": 2,
  "subcategories": [
    { "id": 1, "category": "evaluation", "value": "score" },
    { "id": 2, "category": "evaluation", "value": "missed" }
  ]
}
```

### A4. List my tickets — `getTickets`

- **GET** `/api/support/tickets?tab=unresolved&page=1&batch_id=55`
  (`tab` = `unresolved` | `resolved` | `all`)
- **Mock response:**

```json
{
  "page": 1,
  "tickets": [
    {
      "id": 1287,
      "title": "Evaluation score shows 0",
      "category": "evaluation",
      "status": "resolved",
      "rating": 0,
      "updated_at": "2026-06-12T09:30:00Z",
      "data": { "batch_id": "55", "subCategory": "score" },
      "comments": [
        {
          "id": 9001,
          "message": "Re-evaluated, fixed.",
          "public": true,
          "ticket_id": 1287
        }
      ]
    },
    {
      "id": 1290,
      "title": "Late submission request",
      "category": "assignment",
      "status": "open",
      "rating": 0,
      "updated_at": "2026-06-15T14:00:00Z",
      "data": { "batch_id": "55", "subCategory": "submission" },
      "comments": []
    }
  ]
}
```

### A5. Get one ticket — `getTicketById`

- **GET** `/api/support/tickets/:id`
- **Mock response:**

```json
{
  "id": 1287,
  "title": "Evaluation score shows 0",
  "message": "My score is 0 but I submitted.",
  "category": "evaluation",
  "status": "resolved",
  "rating": 0,
  "categoryTat": 48,
  "created_at": "2026-06-11T10:00:00Z",
  "assignee_id": 300,
  "agent_id": null,
  "data": { "batch_id": "55", "subCategory": "score", "question_id": "102" },
  "info": { "level": "l1" },
  "users_tickets_user_idTousers": {
    "name": "Asha Student",
    "profile_photo_path": "https://cdn/x.png",
    "profiles": { "meta": {} }
  },
  "users_tickets_agent_idTousers": null
}
```

### A6. Get ticket comments (thread) — `getCommentsByTicketId`

- **GET** `/api/support/tickets/:id/comments?categoryTat=48`
- **Mock response:**

```json
{
  "statusBasedResponse": {
    "heading": "Your ticket has been resolved",
    "message": "If this didn’t help, you can reopen or escalate.",
    "created_at": "2026-06-12T09:30:00Z",
    "users": {
      "id": 300,
      "name": "Curriculum Co-ordinator",
      "profile_photo_path": null
    }
  },
  "comments": [
    {
      "id": 8001,
      "message": "My score is 0 but I submitted.",
      "user_id": 9999,
      "created_at": "2026-06-11T10:00:00Z",
      "data": {},
      "users": {
        "id": 9999,
        "name": "Asha Student",
        "profile_photo_path": null,
        "profiles": { "meta": {} }
      }
    },
    {
      "id": 8002,
      "message": "Re-evaluated and corrected to 8/10.",
      "user_id": 300,
      "created_at": "2026-06-12T09:30:00Z",
      "data": {
        "ticket_level": "l1",
        "displayName": "Curriculum Co-ordinator"
      },
      "users": {
        "id": 300,
        "name": "Curriculum Co-ordinator",
        "profile_photo_path": null,
        "profiles": { "meta": {} }
      }
    }
  ]
}
```

> **Render only comments the student should see** (the real API already filters to public).

### A7. Create a ticket (V2) — `createTicketV2`

- **POST** `/api/support/tickets`
- Request body:

```json
{
  "category": "evaluation",
  "message": "My score is 0 but I submitted.",
  "batch_id": "55",
  "question_id": "102",
  "data": {
    "subCategory": "score",
    "help_faq_question": "My evaluation score looks wrong"
  }
}
```

- **Mock response:**

```json
{
  "id": 1291,
  "user_id": 9999,
  "title": "Evaluation – score issue",
  "message": "My score is 0 but I submitted.",
  "status": "open",
  "assignee_id": 300,
  "category": "evaluation",
  "created_at": "2026-06-17T08:00:00Z",
  "updated_at": "2026-06-17T08:00:00Z",
  "data": { "batch_id": "55", "subCategory": "score", "question_id": "102" },
  "meta": {}
}
```

> After this, the UI also calls **C1 (Temporal start)** — see Group C.

### A8. Add a reply / comment — `addTicketComment`

- **POST** `/api/support/tickets/:id/comments`
- Request body: `{ "message": "Any update?", "public": true }`
- **Mock response:**

```json
{ "id": 8003, "message": "Any update?", "public": true, "ticket_id": 1291 }
```

### A9. Rate a ticket — `updateTicketRating`

- **PUT** `/api/support/tickets/:id/rating`
- Request body: `{ "rating": 5, "reason": "Quick fix" }` (`rating` = 1 👎 / 5 👍)
- **Mock response:** `{ "rating": 5 }`

### A10. Reopen a ticket — `reopenTicket`

- **POST** `/api/support/tickets/:id/reopen` (no body)
- **Mock response:** `{ "success": true, "message": "Ticket reopened" }`

### A11. Escalate a ticket — `escalateTicket`

- **POST** `/api/support/tickets/:id/escalate` (no body)
- **Mock response:** `{ "success": true, "message": "Escalated to next level" }`
- Error case to mock: `{ "success": false, "message": "No higher level available" }`

### A12. Confirm resolution — `confirmTicket`

- **POST** `/api/support/tickets/:id/confirm`
- Request body: `{ "resolution": true, "mode": "auto", "reason": null }`
- **Mock response:** `{ "id": 1287, "status": "resolved" }`

### A13. Callback reasons — `callbackReasons`

- **GET** `/api/support/callback/reasons`
- **Mock response:**

```json
[
  {
    "id": 1,
    "category": "call-backrequest-reason",
    "value": "Student Kit",
    "ordering": 1,
    "data": null,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
    "deprecated": false
  },
  {
    "id": 2,
    "category": "call-backrequest-reason",
    "value": "Fee Clarification",
    "ordering": 2,
    "data": null,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
    "deprecated": false
  }
]
```

### A14. Callback timeslots — `callbackTimeslots`

- **GET** `/api/support/callback/timeslots`
- **Mock response:**

```json
[
  {
    "id": 11,
    "category": "call-backrequest-timeslot",
    "value": "10:00 AM – 12:00 PM",
    "ordering": 1,
    "data": null,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
    "deprecated": false
  },
  {
    "id": 12,
    "category": "call-backrequest-timeslot",
    "value": "2:00 PM – 4:00 PM",
    "ordering": 2,
    "data": null,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
    "deprecated": false
  }
]
```

### A15. Create callback request — `createUserCallbackTicket`

- **POST** `/api/support/callbacks`
- Request body: `{ "batch_id": 55, "category": "Student Kit", "preferedtimeslot": "10:00 AM – 12:00 PM", "meta": {} }`
- **Mock response:**

```json
{
  "id": 701,
  "user_id": 9999,
  "category": "Student Kit",
  "status": "pending",
  "preferedtimeslot": "10:00 AM – 12:00 PM",
  "created_at": "2026-06-17T08:05:00Z",
  "batch_id": 55
}
```

- Error to mock (duplicate): `409 { "message": "You already have a pending callback for this batch" }`

### A16. My callbacks (optional list) — `myCallbackTickets`

- **GET** `/api/support/callbacks?status=pending&page=1`
- **Mock response:**

```json
{
  "tickets": [
    {
      "id": 701,
      "category": "Student Kit",
      "status": "pending",
      "preferedtimeslot": "10:00 AM – 12:00 PM",
      "created_at": "2026-06-17T08:05:00Z",
      "batch_id": 55
    }
  ]
}
```

### A17. Chatbot options — `getCreateTicketOptions` (optional)

- **GET** `/api/support/chatbot/options?category=operations&choices=kit,delay`
- **Mock response:**

```json
{
  "Q": "What is the issue with your kit?",
  "A": null,
  "message": "Choose one:",
  "options": [
    { "id": "1", "option": "Not received" },
    { "id": "2", "option": "Damaged" }
  ]
}
```

### A18. Create chatbot ticket — `createChatbotTicket` (optional)

- **POST** `/api/support/chatbot/tickets`
- Request body: `{ "title": "Kit not received", "category": "operations", "priority": "normal", "message": "…", "department": "ops" }`
- **Mock response:** `{ "id": 1295 }`

---

## 2.3 Group B — Platform deps (consumed by support, owned elsewhere)

Stub these too for the mock UI; in the real build, point at existing services if present.

### B1. Current user — `me`

- **GET** `/api/me`

```json
{
  "id": 9999,
  "name": "Asha Student",
  "email": "asha@example.com",
  "feeStatus": "paid",
  "is_new_user_journey": true
}
```

### B2. User batches + settings — `getUserBatchesWithShowBatchDetails`

- **GET** `/api/users/:userId/batches`

```json
[
  {
    "id": 55,
    "name": "FSD Batch March 2026",
    "meta": { "course_type": "FT" },
    "settings": {
      "discussionPC": { "l1": 300, "l2": 301, "l3": 302, "l4": 303 },
      "opsPC": { "l1": 1079, "l2": 1080, "l3": 1081, "l4": 1082 },
      "show_pp": true
    }
  }
]
```

> `settings.discussionPC/opsPC` determine whether **Escalate** is available; `meta`/flags
> drive multi-batch + 1:1 visibility.

### B3. Active sections gate — `getSectionsForTicket`

- **GET** `/api/support/sections-for-ticket?course_type=FT`

```json
{
  "impSections": ["Section A"],
  "placementSections": [],
  "nonPlacementSections": ["Section A"]
}
```

> Empty everything → block ticket creation (`NoActiveSectionState`).

### B4. Legal agreement gate — `legalAgreement`

- **GET** `/api/me/legal-agreement`

```json
{ "required": true, "accepted": false, "agreementUrl": "/agreements/2026" }
```

> `required && !accepted` → show `LegalAgreementBanner`, block creation.

### B5. Institute support info — `getInstituteSupportInfoByBatchId`

- **GET** `/api/institutes/support-info?batchId=55`

```json
{
  "supportText": "Reach us 10am–6pm, Mon–Sat",
  "supportMobileNumber": "+91-9000000000"
}
```

### B6. Section coordinators (1:1) — `getSectionDetailsOfUser`

- **GET** `/api/users/:userId/section-details`

```json
{
  "id": 5001,
  "sections": [
    {
      "id": 1,
      "name": "Section A",
      "active": true,
      "type": "core",
      "batch_id": 55
    }
  ],
  "ia": {
    "id": 41,
    "name": "Ira IA",
    "role": "IA",
    "status": "active",
    "profile_photo_path": null,
    "profiles": { "meta": { "calendly": "https://calendly.com/ira" } }
  },
  "ec": {
    "id": 42,
    "name": "Eve EC",
    "role": "EC",
    "status": "active",
    "profile_photo_path": null,
    "profiles": { "meta": {} }
  },
  "pc": {
    "id": 43,
    "name": "Pia PC",
    "role": "PC",
    "status": "active",
    "profile_photo_path": null,
    "profiles": { "meta": { "calendly": "https://calendly.com/pia" } }
  }
}
```

### B7. Support-entity content (optional enrichment)

- `getAssignments` → **GET** `/api/assignments?batch_id=55&category=assignment`
- `lectures` → **GET** `/api/lectures?batch_id=55`
- `resources` → **GET** `/api/resources?batch_id=55`
- Mock each as `{ "items": [ { "id": 1, "title": "…", "url": "https://…" } ] }`.

---

## 2.4 Group C — Infra integrations

### C1. Start Temporal workflow (fire-and-forget)

- **POST** `/api/temporal/start?ticketId=1291` (no body; called right after A7)
- **Mock response:** `{ "started": true }` (UI ignores failures)

### C2. Presigned upload for attachments

- **POST** `/api/uploads/presign`
- Request body: `{ "fileName": "score.png", "contentType": "image/png", "scope": "tickets" }`
- **Mock response:**

```json
{
  "uploadUrl": "https://mock-s3.local/upload",
  "fields": {
    "key": "tickets/uuid/score.png",
    "policy": "…",
    "signature": "…"
  },
  "fileUrl": "https://cdn.local/tickets/uuid/score.png"
}
```

- Then the client PUT/POSTs the file to `uploadUrl` and embeds `fileUrl` as
  `[score.png](fileUrl)` in the message. (Mock the upload as an instant success.)

---

## 2.5 Mock endpoint quick-reference (build checklist)

| #   | Method | Path                                            | Op                       | Group          |
| --- | ------ | ----------------------------------------------- | ------------------------ | -------------- |
| A1  | GET    | `/api/support/faqs`                             | getFAQs                  | core           |
| A2  | POST   | `/api/support/faqs/:id/vote`                    | voteFAQ                  | core           |
| A3  | GET    | `/api/support/categories`                       | categories+subs          | core           |
| A4  | GET    | `/api/support/tickets`                          | getTickets               | core           |
| A5  | GET    | `/api/support/tickets/:id`                      | getTicketById            | core           |
| A6  | GET    | `/api/support/tickets/:id/comments`             | getComments              | core           |
| A7  | POST   | `/api/support/tickets`                          | createTicketV2           | core           |
| A8  | POST   | `/api/support/tickets/:id/comments`             | addTicketComment         | core           |
| A9  | PUT    | `/api/support/tickets/:id/rating`               | updateTicketRating       | core           |
| A10 | POST   | `/api/support/tickets/:id/reopen`               | reopenTicket             | core           |
| A11 | POST   | `/api/support/tickets/:id/escalate`             | escalateTicket           | core           |
| A12 | POST   | `/api/support/tickets/:id/confirm`              | confirmTicket            | core           |
| A13 | GET    | `/api/support/callback/reasons`                 | callbackReasons          | core           |
| A14 | GET    | `/api/support/callback/timeslots`               | callbackTimeslots        | core           |
| A15 | POST   | `/api/support/callbacks`                        | createUserCallbackTicket | core           |
| A16 | GET    | `/api/support/callbacks`                        | myCallbackTickets        | core           |
| A17 | GET    | `/api/support/chatbot/options`                  | getCreateTicketOptions   | core (opt)     |
| A18 | POST   | `/api/support/chatbot/tickets`                  | createChatbotTicket      | core (opt)     |
| B1  | GET    | `/api/me`                                       | me                       | platform       |
| B2  | GET    | `/api/users/:id/batches`                        | getUserBatches           | platform       |
| B3  | GET    | `/api/support/sections-for-ticket`              | getSectionsForTicket     | platform       |
| B4  | GET    | `/api/me/legal-agreement`                       | legalAgreement           | platform       |
| B5  | GET    | `/api/institutes/support-info`                  | instituteSupportInfo     | platform       |
| B6  | GET    | `/api/users/:id/section-details`                | sectionDetails           | platform       |
| B7  | GET    | `/api/assignments` · `/lectures` · `/resources` | entities                 | platform (opt) |
| C1  | POST   | `/api/temporal/start`                           | temporal                 | infra          |
| C2  | POST   | `/api/uploads/presign`                          | presign                  | infra          |

> **Build order suggestion:** mock everything → build the clickable UI → then implement
> real endpoints **A4, A5, A6, A7, A8** first (list/detail/thread/create/reply — the core
> loop), then A1–A3 (FAQ/categories), then A9–A12 (rate/reopen/escalate/confirm), then
> callbacks (A13–A16), then optional chatbot/entities.
