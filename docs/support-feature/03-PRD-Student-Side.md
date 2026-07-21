# Support Feature — Student-Side Product Reference (PRD-style)

> **Scope:** This document covers **only the student-facing** Support experience
> (`/support`). Admin/coordinator tooling is intentionally **out of scope** — you are
> rebuilding the student side only. Where admin actions affect the student (e.g. a reply
> arrives), they're described as a _system event_, not as something you build.
>
> Companion: [`04-Codebase-Student-Side.md`](./04-Codebase-Student-Side.md) for the
> engineering map.

---

## 1. One-line summary

The student **Support** page (`/support`) is a self-service-first help center. A student
arrives with a problem, is nudged toward **FAQs** first, and if that doesn't resolve it,
**raises a ticket** that lands with the right coordinator and can be **escalated** if the
answer isn't good enough. The student can also **request a callback**, **chat with an AI
assistant**, and **book 1:1 / coordinator slots**.

Everything the student does maps to one of these:

1. **Find an answer** (FAQ / knowledge base — searchable, votable).
2. **Raise & track a ticket** (create, reply, attach files, rate, reopen, escalate).
3. **Request a callback** (pick reason + time slot).
4. **Chat with AI support** (triage that can spin up a ticket).
5. **Book a slot** (1:1 / pair-programming / coordinator via Calendly).

---

## 2. The student (the only persona you build for)

| Persona                            | What they do                                                                                           | Where                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| **Student**                        | Search FAQs, raise tickets, reply, attach files, rate, reopen, escalate, request callbacks, book slots | `/support`                                |
| _System events (not built by you)_ | Coordinator replies, status changes, callback resolution arrive as updates the student sees            | shown in ticket thread / via email & push |

---

## 3. The student journey (happy path)

```
Student lands on /support
      │
      ├─►  TAB: "Help"  (default — self-service first)
      │       │
      │       ├─ (multi-batch?) pick batch
      │       ├─ browse Categories → Subcategories
      │       ├─ search / read FAQs  ──► 👍 helpful  ──► done (no ticket needed)
      │       │                          👎 not helpful
      │       │                                  │
      │       └──────────────────────────────────┘
      │                                          ▼
      │                                "Raise Support Ticket"
      │                                (category + subcategory pre-filled)
      │                                          │
      │                                          ▼
      │                          Write message + attach files (max 5)
      │                                          │
      │                                  submit ticket
      │                                          │
      │                                          ▼
      │                          Ticket detail view (status = open)
      │                          → coordinator replies arrive here over time
      │
      ├─►  TAB: "Raised Tickets"
      │       └─ list (Unresolved / Resolved / All) ─► open a ticket
      │              │
      │              ├─ reply (while open / re-opened)
      │              ├─ rate 👍 / 👎 (once resolved)
      │              ├─ reopen (after a 👎 rating)
      │              └─ escalate (resolved / closed → next level)
      │
      ├─►  "Request Callback"
      │       └─ pick reason → pick time slot → submit (status = pending)
      │
      └─►  TAB: "1:1 Support" (if enabled for the batch/section)
              └─ pick mentor / coordinator ─► open Calendly link
```

---

## 4. Feature breakdown (student capabilities)

### 4.1 Find an answer — FAQ / Knowledge base

- FAQs are **per-batch**, grouped **category → subcategory**.
- **Search** (debounced) + **upvote / downvote** on each answer.
- If an FAQ doesn't help, a **"Raise Support Ticket"** CTA carries the
  category/subcategory straight into ticket creation.
- This is the **primary deflection path** — keep it prominent in the rebuild.

### 4.2 Raise & track a ticket

- **Create:** pick category/subcategory (or arrive from an FAQ), write a message,
  attach up to **5 files** (uploaded to S3 via presigned URLs), submit.
- **Where it goes:** the student doesn't pick an assignee — the system routes it
  automatically (FAQ's configured owner, else the batch's coordinator). The student just
  sees status updates and replies.
- **Conversation:** student and coordinator exchange messages in a thread. The student
  sees coordinator replies (the student never sees internal/private notes).
- **Statuses the student sees:** `open`, `re-opened`, `resolved`, `closed`, `automatic`
  (auto-closed by the system, e.g. short leave requests).
- **Rate:** once resolved, student gives a quick 👍 (helpful) or 👎 (not helpful).
- **Reopen:** a 👎 unlocks a "Reopen" action (with a warning dialog).
- **Escalate:** on a resolved/closed ticket, the student can push it up to the next
  support level if a higher level exists for their batch.

### 4.3 Request a callback

- A lighter ask than a ticket: "call me back about X at time Y."
- Student picks a **reason** and a **preferred time slot**.
- **One pending callback per batch** at a time (a second request is blocked).
- Stored separately from tickets; resolution happens behind the scenes.

### 4.4 Chat with AI support

- Conversational triage. The bot can answer, or **create a ticket** on the student's
  behalf and link it to the chat.
- From the student's view it's a chat window that may end in "a ticket has been raised."

### 4.5 Book a slot (1:1 / coordinator)

- Shows section coordinators (IA / EC / PC) with contact info and **Calendly** links.
- Visibility depends on whether the batch/section has it enabled.

---

## 5. Business rules & gates the student hits

| Rule                               | What the student experiences                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Active section required**        | If the student isn't in an active section, ticket creation is blocked.                                      |
| **Legal agreement gate**           | If required agreements aren't accepted, a banner blocks ticket creation with a "Complete Agreement" CTA.    |
| **Own tickets only**               | The student sees and acts on only their own tickets.                                                        |
| **Reply window**                   | Replies allowed only while `open` / `re-opened`; `resolved` / `closed` locks replies until reopen/escalate. |
| **Escalation guard**               | "Escalate" only appears if a next-level coordinator exists for the batch.                                   |
| **One pending callback per batch** | A second callback request in the same batch is rejected.                                                    |
| **5-file limit**                   | Max 5 attachments per message.                                                                              |

---

## 6. What the student receives (system → student)

- **Email** when a coordinator replies and when a ticket is resolved (respecting the
  student's notification preferences).
- **Push notification** on a new reply ("💬 New Reply on Your Ticket").
- These are produced by the backend — you don't build the sending, but the rebuilt UI
  should deep-link from them into the right ticket.

---

## 7. Analytics events to preserve

`l_support_category`, `l_support_category_subcategory`, `l_support_faq_click`,
`l_support_faq_upvote`, `l_support_faq_downvote`, `l_support_ticket_raise`,
`l_create_ticket`, `l_support_resolved`, `l_support_unresolved`.

---

## 8. Two UI generations exist — build only the new one

|         | **New flow** (`BatchTickets` / V2)                          | **Legacy flow** (`OldTickets` / V1)              |
| ------- | ----------------------------------------------------------- | ------------------------------------------------ |
| Entry   | batch-aware Help / Raised Tickets / 1:1 tabs, **FAQ-first** | direct `/support/create` form                    |
| Create  | category + message + batch (simple)                         | title + category + priority + department (heavy) |
| Rebuild | ✅ **this is your target**                                  | ❌ deprecated, don't carry over                  |

The root `/support` page decides which to show based on the student's batch data. In the
rebuild, model the **new (V2) flow** as the only path.

---

## 9. Rebuild takeaways (student side)

- **FAQ-first deflection** is the core product lever — make search + vote + "didn't help →
  raise ticket" the spine of the experience.
- The student **never picks who handles the ticket** — routing/escalation is automatic.
  Your UI only needs to _show_ status, replies, and offer rate/reopen/escalate actions.
- Keep the **ticket thread, callbacks, and chatbot** as distinct surfaces (they are
  distinct data today) unless you deliberately decide to unify them.
- Status-driven UI: the available actions (reply vs rate vs reopen vs escalate) are fully
  determined by ticket `status` + `rating` — model that as a clean state machine.

---

_Continue to the [student-side technical document »](./04-Codebase-Student-Side.md)_
