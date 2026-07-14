# Student Support — UX Redesign (Mobile + Desktop)

> **Goal:** Take everything the feature already does (FAQ self-service, tickets +
> conversation, rating/reopen/escalation, callbacks, chatbot, 1:1 booking) and arrange it
> into a **top-notch, responsive experience** that feels great on a phone _and_ on a wide
> screen. This is an opinionated design direction, not a survey — build toward it.
>
> Companions: [`05-Student-UI-Components`](./05-Student-UI-Components-and-Mock-APIs.md)
> (what to build), this doc (how it should behave/feel).

---

## 1. What's wrong with the current UX (and what to fix)

| Current pain                                                                | Why it hurts                                                        | Fix in this doc                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Tabs (Help / Tickets / 1:1) treat help and tickets as equals                | Tickets compete with deflection; users jump to "raise ticket" first | **Search-first home**; tickets demoted to a quiet, always-reachable place (§3, §4)               |
| One giant `CreateTicketModal` doing create + view + reply + rate + escalate | Hard to use, harder to make responsive                              | **Split: a creation flow vs a conversation view**, each with a clear responsive pattern (§5, §6) |
| Full-screen modal on every device                                           | Wastes desktop space, feels heavy                                   | **Desktop = master/detail split; mobile = full-screen pushes** (§2)                              |
| State (tab/step/ticketId) only in URL params                                | Fine, but transitions feel abrupt                                   | Keep URL-driven, add **animated transitions + scroll restoration** (§8)                          |
| Status/actions scattered                                                    | Users unsure what they can do next                                  | **One status banner that owns the next action** (§5.3)                                           |
| Categories + FAQs + entities shown as flat lists                            | Cognitive overload                                                  | **Progressive disclosure**: search → category → FAQ → ticket (§4)                                |

**Guiding principle:** _Answer before ticket, conversation over form, one clear next step._

---

## 2. Responsive strategy (the backbone)

Three breakpoints, one component set:

|               | **Mobile** ≤640px                             | **Tablet** 641–1024px     | **Desktop** ≥1024px                           |
| ------------- | --------------------------------------------- | ------------------------- | --------------------------------------------- |
| Shell         | Single column, bottom-anchored primary action | Single column, wider      | **Two-pane** (list + detail)                  |
| Help home     | Stacked: search → categories → FAQs           | Same, 2-col category grid | Search hero + 3–4-col category grid           |
| Tickets       | Full-screen list → push to detail             | List → detail push        | **Master list (left) + conversation (right)** |
| Create / view | **Full-screen sheet** sliding up              | Centered modal            | **Right-side drawer** or inline detail pane   |
| Callback      | Bottom sheet, stepper                         | Centered modal stepper    | Centered modal stepper                        |

**Key responsive rules**

- **Mobile = navigation by push** (each step is a new full screen with a back arrow), not nested modals.
- **Desktop = no modals for primary content.** The ticket conversation lives in a persistent right pane next to the list (master/detail). Modals only for transient confirms (reopen, rating reason, callback).
- **Single source of truth for "where am I":** URL params (`tab`, `ticketId`, `step`) drive layout at every breakpoint — deep links work identically on phone and desktop.
- **Touch targets ≥44px**, thumb-reachable primary actions on mobile (bottom sticky bar), keyboard + hover affordances on desktop.

---

## 3. Information architecture (reorganized)

```
/support
│
├─ HOME = "Get help"  (default, search-first)
│    • big search
│    • "Your open tickets (2)"  ← compact strip, not a tab
│    • Browse by category
│    • Talk to us: [Request callback] [Chat] [Book 1:1]
│
├─ Browse → Category → FAQ list → FAQ answer → (didn't help) → Create ticket
│
├─ My tickets  (reachable from home strip + a header link)
│    • Unresolved (default) / Resolved / All
│    • → Conversation
│
└─ Talk to us (callback / chatbot / 1:1) — contextual, surfaced where relevant
```

**Big change:** "My Tickets" stops being a co-equal top tab and becomes:

- a **compact "Your open tickets" strip** on the home (so returning users see updates instantly), and
- a **persistent header entry** ("My tickets ●3").

This keeps the home **deflection-focused** while making existing tickets one tap away — the best of both.

---

## 4. Flow A — Finding an answer (search-first deflection)

**Desktop**

```
┌───────────────────────────────────────────────────────────┐
│  How can we help, Asha?                       [My tickets ●2]│
│  ┌─────────────────────────────────────────────┐  [Batch ▾] │
│  │ 🔎  Search “score”, “leave”, “certificate”… │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Browse by topic                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│  │📝 Assi│ │📊 Eval│ │🌴 Leave│ │🎓 Place│  …                  │
│  └──────┘ └──────┘ └──────┘ └──────┘                        │
│                                                             │
│  Still stuck?  [💬 Chat]  [📞 Request callback]  [📅 Book 1:1]│
└───────────────────────────────────────────────────────────┘
```

**While searching / inside a category** — instant results, answers inline:

```
🔎 score|                                   3 results
─────────────────────────────────────────────
▾ My evaluation score looks wrong            ← expanded
   You can request a re-evaluation within 48h…
   Was this helpful?   👍   👎
   ┌───────────────────────────────────────┐
   │ Didn’t solve it?  → Raise a ticket     │ ← contextual, carries category+subcat
   └───────────────────────────────────────┘
▸ Why is my score delayed?
▸ How is the score calculated?
```

**UX upgrades**

- **Search is the hero**, autofocused on desktop; on mobile it's the first thing under the header.
- **Instant, debounced results** with highlight of the matched term; show result count.
- **Answers expand inline** (accordion) — no navigation to read an FAQ.
- **Vote is lightweight and optimistic**; a 👎 immediately reveals the "Raise a ticket" CTA (turn a dead-end into an action).
- **"Raise a ticket" always carries context** (category, subcategory, the FAQ that didn't help) so the create step is pre-filled — fewer fields for the user.
- **Empty search** = "No answers found for 'X' — [Raise a ticket about X]" (never a blank wall).

---

## 5. Flow B — Tickets & conversation (the core loop)

### 5.1 Desktop = master/detail (no modal)

```
┌───────────────┬───────────────────────────────────────────┐
│ MY TICKETS    │  Ticket #1287 · Evaluation     ● Resolved   │
│ [Unres][Res][All]│  Raised 11 Jun · Curriculum Co-ordinator │
│ ───────────── │ ─────────────────────────────────────────── │
│ ●#1290 Late…  │  [System] Resolved on 12 Jun                │
│   Assignment  │                                             │
│   2h ago      │   ┌─────────────────────────────┐           │
│ ─────────────  │   │ You · My score shows 0…      │   →       │
│ #1287 Score…  │   └─────────────────────────────┘           │
│   Evaluation  │        ┌──────────────────────────────┐     │
│   Resolved    │     ←  │ Coordinator · Re-evaluated…  │     │
│ ───────────── │        └──────────────────────────────┘     │
│               │ ─────────────────────────────────────────── │
│               │  Was this helpful? 👍 👎   [Reopen][Escalate]│
└───────────────┴───────────────────────────────────────────┘
```

- Selecting a ticket on the left updates the right pane (URL `?ticketId=`), no page reload.
- The list shows **unread/updated dots** so students spot new replies at a glance.

### 5.2 Mobile = push navigation

```
List screen → tap ticket → Conversation screen (full) → back arrow returns to list
```

- Conversation is a normal full screen with a back arrow (not a modal you can accidentally dismiss).
- **Sticky bottom bar** holds the single most relevant action (reply box when open; rating when resolved).

### 5.3 The status banner owns the "next step"

Instead of scattering reply/rate/reopen/escalate, drive them from **one status-aware banner** at the bottom of the conversation:

| Status               | Banner shows                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `open` / `re-opened` | Reply composer (sticky) + "We usually respond within {TAT}h"                                            |
| `resolved`           | "Did this resolve your issue?" → **👍 Yes** (close-out) / **👎 No** → reveals **Reopen** & **Escalate** |
| `closed`             | "Need more help?" → **Reopen** (if eligible) / **Escalate** (if higher level exists)                    |
| `automatic`          | "Resolved automatically" + link to the answer; optional reopen                                          |

This makes the next action **unmissable and singular** at every state.

### 5.4 Conversation polish

- **Chat-style bubbles**, student right / coordinator-bot left, with avatar, role label ("Curriculum Co-ordinator"), and relative time ("2h ago").
- **Inline attachment previews** (image thumbnails, file chips) parsed from message markdown.
- **Optimistic send** — the student's reply appears instantly with a "sending…" state.
- **TAT/SLA hint** so expectations are set ("Typically answered in 48h").
- **Day separators** and **"new replies" divider** when returning to a thread.

---

## 6. Flow C — Creating a ticket (shorter, guided)

Because creation almost always comes _from_ an FAQ, lean into that:

- **Pre-filled context chip** at top: `Evaluation › Score` (editable via a tap, not a required dropdown wall).
- **One primary field**: the message (markdown-lite editor with a clear placeholder: "Describe what happened, include dates/links").
- **Attachments**: drag-drop on desktop, camera/file on mobile, max 5, with thumbnails and progress; uploads happen in the background so Submit isn't blocked.
- **Submit** is a single sticky button; on success, **transition straight into the conversation view** of the new ticket (don't dump them back to a list).
- **Gates handled gracefully**: if legal-agreement/active-section blocks creation, show the reason _before_ they type, with the unblock CTA — never let them write a message then reject it.

**Desktop:** right-side drawer over the help page. **Mobile:** full-screen sheet sliding up. **Both** show a confirmation→conversation handoff.

---

## 7. Flow D — Callback, Chatbot, 1:1 (the "talk to us" set)

Group these as **escalating ways to reach a human**, surfaced contextually (on the home "Still stuck?" row, and inside an unresolved FAQ search):

- **Callback** = a **bottom sheet stepper** (mobile) / centered 2-step modal (desktop):
  `Reason → Time slot → Confirm`. Show a **success state with expectation** ("We'll call you in your 10am–12pm window") and **block duplicates inline** ("You already have a pending callback") rather than erroring after submit.
- **Chatbot** = a **dockable chat** (bottom-right bubble on desktop, full-screen on mobile) that can hand off into a ticket; show clearly when "a ticket was created from this chat" with a link.
- **1:1 / coordinators** = **person cards** (avatar, name, role, "Book a slot" → Calendly). Only show if enabled for the batch/section; otherwise hide entirely (don't show empty).

---

## 8. Cross-cutting UX quality bar

### 8.1 States (design all four for every surface)

- **Loading:** skeletons that match the final layout (FAQ rows, ticket cards, message bubbles) — not spinners.
- **Empty:** friendly + actionable ("No tickets yet — most questions are answered in our FAQs [Browse]").
- **Error:** inline, retryable ("Couldn't load your tickets [Retry]"), never a blank screen.
- **Success:** confirmations with the _next_ expectation (TAT, callback window).

### 8.2 Feedback & motion

- **Optimistic UI** for votes, replies, ratings (revert on failure with a toast).
- **Subtle transitions:** list→detail slide on mobile, pane cross-fade on desktop; respect `prefers-reduced-motion`.
- **Toasts** for background outcomes (ticket created, reply sent, callback booked).

### 8.3 Notifications loop

- Deep-link emails/push **straight into the specific ticket** at any breakpoint.
- Show an **unread badge** on "My tickets" and per-ticket dots so a returning student lands on what changed.

### 8.4 Accessibility & input

- Full **keyboard support** (search `/` to focus, arrow-through results/list, `Enter` to open, `Esc` to close drawers).
- **ARIA roles** for tabs, accordions, dialogs; focus trapping in drawers; focus returns to trigger on close.
- **Color-independent status** (icon + label, not just color on the badge).
- Respect **safe-area insets** and the mobile keyboard (sticky reply bar floats above the keyboard).

### 8.5 Performance

- **Search debounced** (~300–500ms) with request cancellation.
- **Paginate/virtualize** long ticket lists and threads.
- **Prefetch** the conversation on ticket-card hover (desktop) / on list render (mobile) for instant open.

---

## 9. The redesigned navigation model (summary)

| Surface                                   | Mobile                       | Desktop                      |
| ----------------------------------------- | ---------------------------- | ---------------------------- |
| Home (search + categories + "talk to us") | full screen                  | hero + grid                  |
| Open-tickets visibility                   | strip on home + header badge | strip on home + header badge |
| FAQ answer                                | inline accordion             | inline accordion             |
| Create ticket                             | full-screen sheet            | right drawer                 |
| Ticket conversation                       | full-screen push             | master/detail right pane     |
| Reopen / rating-reason / callback         | bottom sheet                 | centered modal               |
| Chatbot                                   | full-screen                  | docked bubble                |
| 1:1 booking                               | cards list                   | cards grid                   |

---

## 10. Build sequence for the redesign

1. **Primitives + responsive shell** (breakpoint hook, Drawer/Sheet/Modal that adapt, Tabs, Skeletons, Toast).
2. **Search-first Home** with category grid + inline FAQ accordion + vote.
3. **Tickets master/detail** (desktop pane / mobile push) with the **status banner** owning actions.
4. **Conversation polish** (bubbles, optimistic send, attachment previews, TAT hint).
5. **Guided create flow** (context chip + single message + background uploads + handoff to conversation).
6. **Talk-to-us set** (callback stepper, chatbot dock, 1:1 cards) — contextual.
7. **Quality pass**: all four states everywhere, motion, a11y, deep links, prefetch.

> Net effect: a student either **finds an answer in seconds** (search-first, inline FAQs)
> or **falls smoothly into a guided, chat-like ticket** that always shows one clear next
> step — and it feels native whether they're on a phone in a hurry or a laptop at a desk.
