# Student Support — Component Implementation Spec

> **Purpose:** The directly-implementable bridge between the
> [UX redesign (06)](./06-Student-UX-Redesign.md) and the
> [component catalogue + mock APIs (05)](./05-Student-UI-Components-and-Mock-APIs.md).
> For each component: **TypeScript prop interface, internal state, responsive behavior,
> the mock API it calls, and acceptance criteria.** Build the mock UI straight from this,
> then swap mock APIs for real ones.
>
> Stack assumptions (adjust to your repo): React + TypeScript, a data hook layer
> (react-query or RTK Query), Tailwind (or CSS-in-JS) for the responsive primitives.
> Types below are framework-agnostic.

---

## 0. Shared types (single source of truth)

```ts
// ---- Domain ----
export type TicketStatus =
  'open' | 're-opened' | 'resolved' | 'closed' | 'automatic'
export type TicketTab = 'unresolved' | 'resolved' | 'all'
export type VoteType = 'upvote' | 'downvote'
export type Rating = 1 | 5 // 1 = 👎, 5 = 👍
export type CoordinatorRole = 'IA' | 'EC' | 'PC'

export interface Faq {
  id: number
  question: string
  answer: string // markdown
  category: string
  sub_category: string
  batch_id: number
}

export interface Category {
  category: string // display label, e.g. "Evaluation"
  value: string // slug, e.g. "evaluation"
  subcategories: { value: string }[]
}

export interface TicketListItem {
  id: number
  title: string
  category: string
  status: TicketStatus
  rating: number // 0 if unrated
  updated_at: string // ISO
  hasUnread?: boolean // derived client-side
  data?: Record<string, unknown>
}

export interface TicketDetail {
  id: number
  title: string
  message: string
  category: string
  status: TicketStatus
  rating: number
  categoryTat: number // hours
  created_at: string
  assignee_id: number
  agent_id: number | null
  data?: { batch_id?: string; subCategory?: string; question_id?: string }
  user: Author
  agent?: Author | null
}

export interface Author {
  id: number
  name: string
  role?: string // "Curriculum Co-ordinator", etc.
  profile_photo_path?: string | null
}

export interface Message {
  id: number
  message: string // markdown, may embed attachment links
  user_id: number
  created_at: string
  author: Author
  side: 'student' | 'agent' | 'bot' | 'system'
}

export interface StatusResponse {
  // the "status card" at the top of a thread
  heading: string
  message: string
  created_at?: string
  author?: Author
}

export interface Batch {
  id: number
  name: string
  meta?: { course_type?: 'FT' | 'PT' }
  settings?: {
    discussionPC?: Record<'l1' | 'l2' | 'l3' | 'l4' | 'l5', number>
    opsPC?: Record<'l1' | 'l2' | 'l3' | 'l4' | 'l5', number>
    show_pp?: boolean
  }
}

export interface CallbackOption {
  id: number
  value: string
  ordering: number
}
export interface CallbackTicket {
  id: number
  category: string
  status: 'pending' | 'resolved'
  preferedtimeslot?: string
  created_at: string
  batch_id: number
}
export interface Coordinator extends Author {
  calendlyUrl?: string
}

// ---- Derived "what can the student do now" ----
export interface TicketCapabilities {
  canReply: boolean
  canRate: boolean
  canReopen: boolean
  canEscalate: boolean
}
```

### 0.1 The ticket state machine (drives every action surface)

```ts
export function getCapabilities(
  t: { status: TicketStatus; rating: number },
  hasHigherLevel: boolean,
): TicketCapabilities {
  switch (t.status) {
    case 'open':
    case 're-opened':
      return {
        canReply: true,
        canRate: false,
        canReopen: false,
        canEscalate: false,
      }
    case 'resolved':
    case 'closed':
      return {
        canReply: false,
        canRate: true,
        canReopen: t.rating === 1, // reopen unlocked only after 👎
        canEscalate: hasHigherLevel,
      }
    case 'automatic':
      return {
        canReply: false,
        canRate: true,
        canReopen: false,
        canEscalate: false,
      }
    default:
      return {
        canReply: false,
        canRate: false,
        canReopen: false,
        canEscalate: false,
      }
  }
}

// hasHigherLevel: compute from batch.settings.{discussionPC|opsPC} for the ticket's
// category — true if a level above the current assignee exists.
```

> **Rule:** No component decides actions on its own; they all read `getCapabilities()`.
> This is the single biggest correctness + UX lever.

---

## 1. Responsive primitives (build first)

### 1.1 `useBreakpoint()`

```ts
type BP = 'mobile' | 'tablet' | 'desktop'
function useBreakpoint(): BP // mobile ≤640, tablet 641–1024, desktop ≥1024
```

Acceptance: updates on resize (debounced); SSR-safe default = `mobile`.

### 1.2 `<AdaptiveSurface>` — the modal/drawer/sheet that morphs

```ts
interface AdaptiveSurfaceProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  // rendering per breakpoint:
  mobile?: 'fullscreen' | 'bottom-sheet' // default 'fullscreen'
  desktop?: 'right-drawer' | 'center-modal' // default 'right-drawer'
  dismissible?: boolean // false for create-in-progress
}
```

Behavior: mobile → full-screen push (or bottom sheet for steppers); desktop → right drawer
(primary content) or centered modal (confirms). Focus-trap, `Esc` to close, focus returns
to trigger, respects `prefers-reduced-motion`, honors safe-area insets.

### 1.3 Other primitives

`<Tabs>`, `<Accordion>`, `<Button>`, `<IconButton>`, `<Avatar>`, `<StatusBadge>`,
`<SearchInput>`, `<Spinner>`, `<Skeleton variant="card|list|thread|faq">`, `<Toast>`,
`<EmptyState>`, `<ErrorState>`, `<MarkdownRenderer>`, `<Pagination>`.
Each must expose `loading`/`disabled` where relevant and be keyboard+ARIA complete.

---

## 2. Shell

### `<SupportPage>`

```ts
// route container; owns URL state, no props
// URL: ?tab=help|tickets|one-on-one & ?ticketId & ?step=ticketCreate|ticketdetails & ?callback
```

- **State (from URL):** `tab`, `ticketId`, `step`, `callbackOpen`, `selectedBatchId`.
- **Data:** `me` (B1), `getUserBatches` (B2).
- **Responsive:** desktop renders master/detail when `tab=tickets`; mobile renders single panel + push.
- **Acceptance:** deep-linking to any URL renders the correct surface at every breakpoint; switching tabs/tickets never full-reloads.

### `<SupportHeader>`

```ts
interface SupportHeaderProps {
  userName: string
  openTicketCount: number // drives "My tickets ●N" badge
  onOpenTickets: () => void
  batchSelector?: React.ReactNode
}
```

### `<BatchSelector>`

```ts
interface BatchSelectorProps {
  batches: Batch[]
  value: number
  onChange: (batchId: number) => void
}
```

- Render only when `batches.length > 1`. Mobile = bottom sheet list; desktop = dropdown.

---

## 3. Help / self-service

### `<HelpHome>` (container)

```ts
interface HelpHomeProps {
  batchId: number
  userName: string
}
// state: query, activeCategory, activeSubcategory
// data: getCategories (A3), getFAQs (A1)
```

- **Layout:** desktop = search hero + category grid; mobile = stacked. Searching or
  selecting a category swaps the body to `<FaqList>`.

### `<SupportSearchBar>`

```ts
interface SupportSearchBarProps {
  value: string
  onChange: (q: string) => void
  resultCount?: number
  autoFocus?: boolean // true on desktop
}
```

- Debounce 300–500ms in the container; show `resultCount` when searching; `/` focuses it (desktop).

### `<CategoryGrid>` / `<CategoryCard>`

```ts
interface CategoryGridProps {
  categories: Category[]
  onSelect: (value: string) => void
}
interface CategoryCardProps {
  category: Category
  onClick: () => void
}
```

- Grid: 2-col (mobile) → 3–4-col (desktop). 44px+ targets, hover/focus states.

### `<FaqList>` / `<FaqItem>` / `<FaqVoteButtons>` / `<RaiseTicketCTA>`

```ts
interface FaqListProps {
  faqs: Faq[]
  loading: boolean
  query?: string // for highlight + empty-state copy
  onRaiseTicket: (ctx: {
    category: string
    subcategory: string
    faqId: number
  }) => void
}
interface FaqItemProps {
  faq: Faq
  expanded: boolean
  onToggle: () => void
  query?: string
  onRaiseTicket: () => void
}
interface FaqVoteButtonsProps {
  faqId: number
  currentVote?: VoteType
  onVote: (faqId: number, vote: VoteType) => void // optimistic
}
interface RaiseTicketCTAProps {
  category: string
  subcategory: string
  onClick: () => void
}
```

- **Behavior:** inline accordion answers (markdown); term highlight; **optimistic vote**;
  **a 👎 immediately reveals `RaiseTicketCTA`**; empty search → "Raise a ticket about '{query}'".
- **API:** `getFAQs` (A1), `voteFAQ` (A2).

### Gates: `<LegalAgreementBanner>` / `<NoActiveSectionState>` / `<RestrictedPopup>`

```ts
interface LegalAgreementBannerProps {
  agreementUrl: string
  onComplete: () => void
}
interface CreationGateProps {
  reason: 'agreement' | 'no-section' | null
}
```

- **Resolve gate BEFORE the compose step** — pass `gateReason` into create flow; if set,
  show reason + unblock CTA instead of the editor.
- **API:** `legalAgreement` (B4), `getSectionsForTicket` (B3).

### `<SupportContactCard>`

```ts
interface SupportContactCardProps {
  batchId: number
} // data: instituteSupportInfo (B5)
```

---

## 4. Tickets list

### `<TicketListPage>` (container)

```ts
interface TicketListPageProps {
  batchId: number
  selectedTicketId?: number // desktop master/detail
  onSelectTicket: (id: number) => void
}
// state: tab (TicketTab), page
// data: getTickets (A4)
```

- **Desktop:** left master list; selecting updates the right detail pane (no nav).
- **Mobile:** list; tapping pushes the conversation screen.

### `<TicketStatusTabs>`

```ts
interface TicketStatusTabsProps {
  active: TicketTab
  counts?: Partial<Record<TicketTab, number>>
  onChange: (t: TicketTab) => void
}
```

### `<TicketCard>` / `<TicketStatusBadge>`

```ts
interface TicketCardProps {
  ticket: TicketListItem
  selected?: boolean
  onClick: () => void
}
interface TicketStatusBadgeProps {
  status: TicketStatus
} // icon + label + color
```

- Show category chip, relative `updated_at`, **unread dot** when `hasUnread`.
- `StatusBadge` must be **color-independent** (icon + text).

### `<EmptyTicketsState>` / `<TicketListPagination>`

```ts
interface EmptyTicketsStateProps {
  onBrowseHelp: () => void
}
interface TicketListPaginationProps {
  page: number
  hasMore: boolean
  onPage: (p: number) => void
}
```

---

## 5. Ticket conversation (the core loop)

### `<TicketConversation>` (container — replaces the old mega-modal's detail mode)

```ts
interface TicketConversationProps {
  ticketId: number
  batch?: Batch // to compute hasHigherLevel
  onBack: () => void // mobile back / desktop deselect
}
// data: getTicketById (A5), getCommentsByTicketId (A6)
// derived: capabilities = getCapabilities(ticket, hasHigherLevel)
```

- **Desktop:** right pane of master/detail. **Mobile:** full-screen push.
- Renders `TicketDetailHeader` + `ConversationThread` + status-aware footer (§5.3 of doc 06).

### `<TicketDetailHeader>`

```ts
interface TicketDetailHeaderProps {
  ticket: TicketDetail
  onBack: () => void
}
```

### `<ConversationThread>` / `<MessageBubble>` / `<StatusBasedResponseCard>` / `<AttachmentPreview>`

```ts
interface ConversationThreadProps {
  messages: Message[]
  statusResponse?: StatusResponse
  tatHours?: number
}
interface MessageBubbleProps {
  message: Message
} // side decides alignment
interface StatusBasedResponseCardProps {
  data: StatusResponse
}
interface AttachmentPreviewProps {
  url: string
  name: string
} // parsed from markdown
```

- Bubbles: student right, agent/bot left, avatar + role label + relative time.
- **Day separators**, **"new replies" divider**, inline image/file previews.
- **Render only messages the student should see** (API pre-filters public).

### `<TicketActionFooter>` (the single next-step surface)

```ts
interface TicketActionFooterProps {
  ticket: TicketDetail
  capabilities: TicketCapabilities
  onReply: (text: string, files: UploadedFile[]) => void
  onRate: (rating: Rating) => void
  onReopen: () => void
  onEscalate: () => void
  tatHours?: number
}
```

- Renders **exactly one** primary affordance per status (from capabilities):
  reply composer | "Did this resolve? 👍/👎" | reopen/escalate.
- **Sticky bottom on mobile** (floats above keyboard); inline on desktop.

### `<ReplyBox>`

```ts
interface ReplyBoxProps {
  onSend: (text: string, files: UploadedFile[]) => void
  sending?: boolean
}
// API: addTicketComment (A8) — optimistic append
```

### `<RatingWidget>` / `<RatingPopup>`

```ts
interface RatingWidgetProps {
  value?: number
  onRate: (r: Rating) => void
} // API: updateTicketRating (A9)
interface RatingPopupProps {
  open: boolean
  onSubmit: (r: Rating, reason?: string) => void
  onClose: () => void
}
```

### `<ReopenButton>` + `<ReopenWarningDialog>` / `<EscalateButton>`

```ts
interface ReopenControlProps {
  ticketId: number
  onReopened: () => void
} // API: reopenTicket (A10)
interface EscalateButtonProps {
  ticketId: number
  canEscalate: boolean
  onEscalated: () => void
} // API: escalateTicket (A11)
```

- `EscalateButton` hidden when `!canEscalate`. Reopen behind a confirm dialog.

---

## 6. Create ticket (guided)

### `<CreateTicketFlow>` (container — replaces the old modal's create mode)

```ts
interface CreateTicketFlowProps {
  batchId: number
  category: string
  subcategory: string
  questionId?: string // from the FAQ that didn't help
  gateReason?: 'agreement' | 'no-section' | null
  onCreated: (ticketId: number) => void // → hand off to TicketConversation
  onClose: () => void
}
// API: createTicketV2 (A7) → then temporalStart (C1); presignUpload (C2) for files
```

- If `gateReason` set → render the gate (reason + CTA), **not** the editor.
- **Desktop:** right drawer. **Mobile:** full-screen sheet.
- On success: navigate to `?step=ticketdetails&ticketId=<new>` (straight into the thread).

### `<CategoryContextChip>` / `<MessageEditor>` / `<FileUploader>` / `<AttachmentChip>` / `<SubmitTicketButton>`

```ts
interface CategoryContextChipProps {
  category: string
  subcategory: string
  onEdit?: () => void
}
interface MessageEditorProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}
interface UploadedFile {
  id: string
  name: string
  url?: string
  progress: number
  status: 'uploading' | 'done' | 'error'
}
interface FileUploaderProps {
  files: UploadedFile[]
  max: 5
  onAdd: (f: File[]) => void
  onRemove: (id: string) => void
}
interface AttachmentChipProps {
  file: UploadedFile
  onRemove: () => void
}
interface SubmitTicketButtonProps {
  disabled: boolean
  loading: boolean
  onClick: () => void
}
```

- Background uploads (Submit not blocked); embed `[name](url)` into message on submit.
- Submit disabled until message non-empty.

---

## 7. Talk-to-us set

### `<CallbackModal>` (stepper)

```ts
interface CallbackModalProps {
  open: boolean
  batchId: number
  onClose: () => void
  onCreated: (cb: CallbackTicket) => void
}
// steps: reason → timeslot → confirm
// data: callbackReasons (A13), callbackTimeslots (A14); submit: createUserCallbackTicket (A15)
```

- Mobile = bottom sheet; desktop = centered modal. **Block duplicate inline** (don't error post-submit). Success = expectation copy ("We'll call in your {slot} window").

```ts
interface CallbackReasonSelectProps {
  options: CallbackOption[]
  value?: number
  onChange: (id: number) => void
}
interface CallbackTimeslotSelectProps {
  options: CallbackOption[]
  value?: number
  onChange: (id: number) => void
}
interface CallbackConfirmationProps {
  timeslotLabel: string
  onDone: () => void
}
interface MyCallbacksListProps {
  items: CallbackTicket[]
} // data: myCallbackTickets (A16)
```

### `<ChatbotWidget>` (optional)

```ts
interface ChatbotWidgetProps {
  open: boolean
  batchId: number
  onClose: () => void
  onTicketCreated: (id: number) => void
}
interface ChatOptionButtonsProps {
  options: { id: string; option: string }[]
  onPick: (id: string) => void
}
// data: getCreateTicketOptions (A17); submit: createChatbotTicket (A18)
```

- Desktop = docked bottom-right bubble; mobile = full-screen. Show "ticket created from chat" with a deep link.

### `<PairProgrammingTab>` / `<CoordinatorCard>`

```ts
interface PairProgrammingTabProps {
  userId: number
} // data: getSectionDetailsOfUser (B6)
interface CoordinatorCardProps {
  coordinator: Coordinator
} // "Book a slot" → calendlyUrl
```

- Hide entirely if not enabled for the batch/section (no empty state).

---

## 8. Data-hook layer (mock → real swap point)

Define one hook per API; mock implementations return the Part-2 fixtures, real ones hit
your endpoints. Components depend only on hooks, never on transport.

```ts
// reads
;(useFaqs(params),
  useCategories(),
  useTickets(tab, page),
  useTicket(id),
  useComments(id, tat),
  useCallbackReasons(),
  useCallbackTimeslots(),
  useMyCallbacks(status),
  useMe(),
  useUserBatches(userId),
  useSectionsForTicket(courseType),
  useLegalAgreement(),
  useInstituteSupportInfo(batchId),
  useSectionDetails(userId))
// writes (mutations)
;(useVoteFaq(),
  useCreateTicket(),
  useAddComment(),
  useUpdateRating(),
  useReopenTicket(),
  useEscalateTicket(),
  useConfirmTicket(),
  useCreateCallback(),
  useCreateChatbotTicket(),
  usePresignUpload())
```

- Each mutation: **optimistic update + rollback-on-error + toast** where it touches a list/thread.
- A single `mocks/` module (MSW handlers or hook stubs) holds the Part-2 fixtures so the
  whole mock UI runs with zero backend. Flip an env flag (`USE_MOCKS`) to switch.

---

## 9. Acceptance checklist (mock-UI "done")

- [ ] Every component has loading (skeleton) / empty / error / success states.
- [ ] Actions per ticket come **only** from `getCapabilities()` (no ad-hoc `if status`).
- [ ] Desktop tickets = master/detail (no modal); mobile = push; both URL-deep-linkable.
- [ ] Create flow resolves gates before the editor and hands off into the conversation.
- [ ] Votes / replies / ratings are optimistic with rollback.
- [ ] Keyboard: `/` search focus, list arrow-nav, `Esc` closes surfaces, focus trap + return.
- [ ] Status badges are icon+label (color-independent); touch targets ≥44px.
- [ ] Search debounced + cancellable; long lists/threads virtualized; conversation prefetched on hover/render.
- [ ] All data flows through the hook layer; `USE_MOCKS` runs the whole app offline.

---

## 10. Suggested file structure

```
support/
├─ primitives/        AdaptiveSurface, Tabs, Accordion, StatusBadge, Skeleton, …
├─ hooks/             useBreakpoint, data hooks (§8)
├─ mocks/             fixtures + MSW handlers (from doc 05 Part 2)
├─ state/             capabilities.ts (getCapabilities), urlState.ts
├─ help/              HelpHome, SupportSearchBar, CategoryGrid, FaqList, gates
├─ tickets/           TicketListPage, TicketCard, TicketConversation, ConversationThread,
│                     TicketActionFooter, ReplyBox, RatingWidget, Reopen/Escalate
├─ create/            CreateTicketFlow, MessageEditor, FileUploader
├─ talk/              CallbackModal, ChatbotWidget, PairProgrammingTab
└─ SupportPage.tsx
```

> Build order = doc 06 §10: primitives/shell → search home → tickets master/detail →
> conversation → guided create → talk-to-us → quality pass.
