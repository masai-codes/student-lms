# Support Feature — Product Reference (PRD-style)

> **Purpose of this doc:** A fast, scannable understanding of _what_ the Support
> feature does, _who_ uses it, and _how the flow works_ — before you rebuild it
> in the new repo. The companion doc
> [`02-Codebase-Technical-Doc.md`](./02-Codebase-Technical-Doc.md) covers the
> _how it's built_ (tables, schema, API, code paths).

---

## 1. One-line summary

The **Support** feature (route: `/support`) is the student help center. A student
arrives with a problem, is first nudged toward **self-service** (FAQs / knowledge
base), and if that doesn't solve it, **raises a support ticket** that gets
auto-assigned to the right coordinator and travels up a **multi-level escalation
ladder (L1 → L5)** until resolved. Admins (coordinators) work these tickets from a
separate **admin dashboard**.

There are **four supporting sub-systems** around the core ticket:

1. **FAQ / Knowledge base** — searchable, votable, deflects tickets.
2. **Callback requests** — student asks for a phone callback in a chosen time slot.
3. **Chatbot / AI support** — conversational triage that can spin up a ticket.
4. **1:1 / Pair-programming & coordinator booking** — Calendly-based slot booking.

---

## 2. Who uses it (personas)

| Persona                                                     | What they do                                                                                 | Where                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Student**                                                 | Searches FAQs, raises tickets, replies, rates, reopens, requests callbacks, books slots      | `/support` (student React app)              |
| **Coordinator / Admin** (PC, EC, IA, Curriculum, Grievance) | Views all tickets, replies, changes status, assigns, bulk-assigns agents, resolves callbacks | Admin dashboard (`/tickets`)                |
| **Chatbot (system user)**                                   | Triages conversations, auto-creates tickets, auto-escalates to EC/IA                         | Backend, triggered by `/support` chatbot UI |
| **Temporal workflow (system)**                              | Background processing after ticket creation (TAT, auto-responses, notifications)             | Backend                                     |

**Coordinator roles map to escalation levels:**

| Level | "Discussion" track (assignment / evaluation) | "Ops" track (everything else) |
| ----- | -------------------------------------------- | ----------------------------- |
| L1    | Curriculum Co-ordinator                      | Program Co-ordinator          |
| L2    | Curriculum Manager                           | Program Manager               |
| L3    | Curriculum Head                              | Program Head                  |
| L4    | Grievance Officer                            | Grievance Officer             |
| L5    | (final escalation slot)                      | (final escalation slot)       |

---

## 3. The core flow (happy path)

```
Student lands on /support
      │
      ├─►  TAB: "Help"  (default, self-service first)
      │       │
      │       ├─ (multi-batch?) pick batch
      │       ├─ browse Categories → Subcategories
      │       ├─ search / read FAQs  ──► 👍 helpful  ──► done (ticket deflected)
      │       │                          👎 not helpful
      │       │                                  │
      │       └──────────────────────────────────┘
      │                                          ▼
      │                                "Raise Support Ticket"
      │                                (category + subcategory pre-filled)
      │                                          │
      │                                          ▼
      │                          CreateTicketModal: write message + attach files
      │                                          │
      │                              createTicketV2  ─► ticket auto-assigned to L1
      │                                          │      (FAQ assignee or batch PC)
      │                                          ▼
      │                              Temporal workflow kicked off
      │                                          │
      │                                          ▼
      │                              Ticket detail view (status = open)
      │
      ├─►  TAB: "Raised Tickets"
      │       └─ list (Unresolved / Resolved / All) ─► open a ticket
      │              │
      │              ├─ reply (if open)            ─► addTicketComment
      │              ├─ rate 👍/👎 (if resolved)   ─► updateTicketRating
      │              ├─ reopen (if rated 👎)       ─► reopenTicket
      │              └─ escalate (resolved/closed) ─► escalateTicket (L1→L2→…)
      │
      ├─►  "Request Callback" (new-journey users)
      │       └─ pick reason → pick time slot ─► createUserCallbackTicket (status=pending)
      │
      └─►  TAB: "1:1 Support" (if enabled)
              └─ pick mentor/section ─► open Calendly link
```

**Admin side (parallel):**

```
Admin dashboard /tickets
      │
      ├─ filter (id, category, status, priority, rating, assignee, agent)
      ├─ open ticket  ─► see student message + thread + metadata + TAT
      │      ├─ AI-suggested reply (optional)
      │      ├─ reply (signature auto-appended)   ─► comment + email + push to student
      │      ├─ change status (open/resolved/closed)
      │      └─ reassign / change agent
      └─ bulk-add agent to many tickets
```

---

## 4. Feature breakdown (the four pillars)

### 4.1 Tickets (the heart of it)

- **Create:** student picks category/subcategory (or comes from an FAQ), writes a
  message, attaches up to **5 files** (S3 presigned upload), submits.
- **Auto-assignment:** the ticket lands on an **L1** owner, chosen by:
  1. The FAQ's configured assignees (if raised from an FAQ), else
  2. The batch's coordinator settings — **discussionPC** for _assignment/evaluation_
     categories, **opsPC** for everything else, else
  3. Hard-coded fallbacks.
- **Conversation:** student and admin exchange **comments** (public vs internal).
  Admin replies get a **signature** (role title + phone number) auto-appended.
- **Resolution:** admin sets status to **resolved**; student can **rate** (👍=5 / 👎=1).
- **Escalation:** a resolved/closed ticket can be **escalated** up the ladder
  (L1→L2→L3→L4→L5); status becomes `re-opened` and a new owner takes over.
- **Reopen:** a 👎 rating lets the student reopen.
- **Statuses:** `open`, `resolved`, `closed`, `re-opened`, `automatic` (auto-closed by system/chatbot).
- **Auto-close cases:** some categories (e.g. short leave ≤ 2 days) auto-close with a
  templated response and status `automatic`.

### 4.2 FAQ / Knowledge base

- Per-batch FAQs (`help_faqs`), grouped by **category → subcategory**.
- Full-text **search** (debounced), **upvote/downvote**, and "this didn't help → raise ticket".
- Each FAQ carries its own **assignee ladder** (l1–l5) used for ticket routing.
- Designed as the **first line of deflection** before a ticket is created.

### 4.3 Callback requests

- A lighter-weight ask: "call me back about X at time Y."
- Student picks a **reason** + a **preferred time slot**; one **pending** callback per
  batch at a time.
- Notifies the ops team (Slack). Admin **assigns**, **comments**, and **resolves**.
- Stored separately from tickets (`user_callback_tickets`).

### 4.4 Chatbot / AI support

- Conversational triage stored as **interactions + interaction_messages**.
- Calls an external AI support service; the bot can **escalate to EC/IA** or
  **auto-create a ticket** and link it back to the conversation.
- Admins can also request an **AI-suggested reply** when working a ticket.

### 4.5 Coordinator / 1:1 booking (supporting)

- `SlotBook` / `PairProgramming` show section coordinators (IA, EC, PC) with contact
  info and **Calendly** links; visibility gated by section settings.

---

## 5. Key business rules & gates

| Rule                               | Behavior                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Active section required**        | Student can only raise tickets if they belong to an active section.                                                               |
| **Legal agreement gate**           | If the user hasn't accepted required agreements, ticket creation is blocked with a banner + "Complete Agreement" CTA.             |
| **Ownership**                      | Students see/act only on **their own** tickets.                                                                                   |
| **Reply window**                   | Student can reply only while the ticket is open/re-opened; resolved/closed locks replies (until reopen/escalate).                 |
| **Escalation guard**               | Can only escalate if a next-level assignee exists for that batch/FAQ.                                                             |
| **One pending callback per batch** | Prevents duplicate callback requests.                                                                                             |
| **Admin-only actions**             | Reassign, bulk-add agent, reply-signature preview require `role === 'admin'`.                                                     |
| **Reply tier gate**                | On resolved/closed tickets, the replying admin must be at or above the ticket's current tier (see access logic in technical doc). |

---

## 6. Notifications

- **Email** (`noreply-lms@masaischool.com`) on **admin reply** and on **resolved**, gated by user notification preferences.
- **Push notification** on admin reply ("💬 New Reply on Your Ticket").
- **Slack** to ops team on new **callback** request.

---

## 7. Analytics (GTM events worth preserving)

`l_support_category`, `l_support_category_subcategory`, `l_support_faq_click`,
`l_support_faq_upvote`, `l_support_faq_downvote`, `l_support_ticket_raise`,
`l_create_ticket`, `l_support_resolved`, `l_support_unresolved`.

---

## 8. There are two generations of the UI (important for the rebuild)

|            | **New flow** (`BatchTickets`)                 | **Legacy flow** (`OldTickets`)                            |
| ---------- | --------------------------------------------- | --------------------------------------------------------- |
| Entry      | batch-aware Help/Tickets/1:1 tabs, FAQ-first  | direct `/support/create` form                             |
| Create API | `createTicketV2` (category + message + batch) | `createTicket` (title + category + priority + department) |
| Status     | current / preferred for the rebuild           | being phased out                                          |

The root `/support` page (`pages/tickets/index.tsx`) decides which to render based on
whether the user has batch data. **For the rebuild, model the new (`V2`) flow as the
primary path** and treat the legacy form as deprecated.

---

## 9. What "good" looks like in the rebuild (opinionated takeaways)

- **FAQ-first deflection** is the product's core lever — keep it front and center.
- The **L1→L5 escalation ladder driven by batch settings** is the most intricate
  piece of business logic — get the routing/assignee model right first (see §4 and the
  technical doc's escalation section).
- Tickets, callbacks, and chatbot interactions are **three separate data stores** today;
  decide deliberately whether to unify them.
- The current frontend goes through a **GraphQL layer in front of Prisma**, while REST
  routes expose the _same_ logic — the rebuild can pick one transport cleanly.
- A lot of behavior is **config-in-JSON** (`batches.settings`, `help_faqs.assignees`,
  ticket `data`/`meta`/`logstamps`) rather than typed columns — a candidate for
  proper schema in the new design.

---

_Continue to the [technical / codebase document »](./02-Codebase-Technical-Doc.md)_
