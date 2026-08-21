/**
 * Support module — shared domain types.
 *
 * This is the single source of truth for the shapes that flow across the whole
 * support feature: server services return them, the typed API client re-exports
 * them, and the React components consume them. If you are new to this module,
 * **start here** — every other file references these names.
 *
 * Big picture (read `START_HERE.md` in this folder for the full tour):
 *
 *   DB (Drizzle)  →  services/*.service.ts  →  handlers/*.handler.ts
 *                 →  routes/api/support/*    →  lib/api/support/supportApi.ts
 *                 →  query/support/*         →  components/features/support/*
 *
 * The page loads from **one** GET (`getSupportOverview`) and then mutations
 * (POST) invalidate the relevant query so the UI re-fetches just what changed.
 */

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'

/**
 * The lifecycle state of a ticket. Mirrors the `tickets.status` column values
 * used by the legacy system so existing rows render correctly.
 *
 * - `open`       — newly raised, awaiting / in conversation with a coordinator
 * - `re-opened`  — student reopened or escalated a previously closed ticket
 * - `resolved`   — coordinator marked it solved (student can rate / reopen)
 * - `closed`     — closed by the system / coordinator
 * - `automatic`  — auto-resolved (e.g. short leave, chatbot) with a templated reply
 */
export type TicketStatus =
  | 'open'
  | 're-opened'
  | 'resolved'
  | 'closed'
  | 'automatic'

/** The three list filters shown above the ticket list. */
export type TicketTab = 'unresolved' | 'resolved' | 'all'

/** FAQ helpfulness vote. */
export type FaqVote = 'upvote' | 'downvote'

/** Quick satisfaction rating: 1 = 👎 (not helpful), 5 = 👍 (helpful). */
export type TicketRating = 1 | 5

/** A person rendered in the UI (ticket author, coordinator, comment author). */
export interface SupportPerson {
  id: number
  name: string
  /** Role label shown under the name, e.g. "Curriculum Co-ordinator". */
  role?: string | null
  profilePhotoPath?: string | null
}

/** A help-centre article. */
export interface SupportFaq {
  id: number
  question: string
  /** Markdown. */
  answer: string
  category: string
  subCategory: string
  batchId: number
}

/** A category (+ its subcategories) used to organise FAQs and ticket creation. */
export interface SupportCategory {
  /** Slug used in payloads, e.g. "evaluation". */
  value: string
  /** Display label, e.g. "Evaluation". */
  label: string
  subcategories: Array<{ value: string; label: string }>
}

/** A batch the student belongs to (support is always batch-scoped). */
export interface SupportBatch {
  id: number
  name: string
  /** Whether 1:1 / pair-programming booking is enabled for this batch. */
  oneOnOneEnabled: boolean
}

/** Options for the "request a callback" flow (sourced from the `menus` table). */
export interface CallbackOption {
  id: number
  /** Human label shown in the picker, e.g. "Student Kit" / "10am – 12pm". */
  value: string
  ordering: number
}

/** A coordinator the student can reach for 1:1 help. */
export interface SupportCoordinator extends SupportPerson {
  /** IA / EC / PC. */
  kind: 'IA' | 'EC' | 'PC'
  /** Optional Calendly booking link. */
  calendlyUrl?: string | null
}

/**
 * A section with 1:1 ("pair programming") booking enabled. `show_pp` + `ppLink`
 * live on the section's settings; IA = `section_user.manager_id`, EC/PC = the
 * section's `ec`/`pc` role holders. Only sections with `show_pp && ppLink`
 * appear.
 */
export interface OneOnOneSection {
  sectionId: number
  sectionName: string
  /** Section-level booking link — drives the section "Book a 1:1 session". */
  ppLink: string
  /** IA / EC / PC for the section (those that exist). */
  coordinators: Array<SupportCoordinator>
}

/**
 * 1:1 support grouped by batch (the legacy layout: batches → sections, with a
 * booking link at **both** the batch level (`batches.meta.ppLink`) and each
 * section level (`sections.settings.ppLink`)).
 */
export interface OneOnOneBatchGroup {
  batchId: number | null
  batchName: string
  /** Batch-level booking link (from `batches.meta.ppLink`), if any. */
  batchPpLink: string | null
  sections: Array<OneOnOneSection>
}

/** A callback request the student has raised (listed in the Raised Tickets tab). */
export interface CallbackTicketItem {
  id: number
  batchId: number
  category: string
  status: string
  preferredTimeSlot: string | null
  createdAt: string | null
  updatedAt: string | null
}

/**
 * Why ticket creation might be blocked. `null` means the student can raise a
 * ticket. The UI resolves the gate **before** showing the compose box.
 */
export type SupportGateReason = 'legal-agreement' | 'no-active-section' | null

/** A row in the ticket list. */
export interface TicketListItem {
  id: number
  title: string
  category: string
  status: TicketStatus
  /** 0 when unrated. */
  rating: number
  /** ISO timestamp of the last update. */
  updatedAt: string | null
  /** ISO timestamp when the ticket was raised. */
  createdAt: string | null
  /** Derived: there is at least one coordinator reply the student hasn't seen. */
  hasUnread: boolean
}

/** A single message in a ticket conversation. */
export interface TicketMessage {
  id: number
  /** Markdown; may embed attachment links as `[name](url)`. */
  message: string
  createdAt: string | null
  author: SupportPerson
  /** Who sent it — decides bubble alignment + styling. */
  side: 'student' | 'agent' | 'system'
}

/** The status banner shown at the top of a conversation. */
interface TicketStatusResponse {
  heading: string
  message: string
  createdAt?: string | null
  author?: SupportPerson | null
}

/** Full ticket detail (header + the student's opening message). */
export interface TicketDetail {
  id: number
  title: string
  /** The opening message (markdown). */
  message: string
  category: string
  subCategory?: string | null
  status: TicketStatus
  rating: number
  /** SLA / expected turnaround in hours, for the "usually answered in Nh" hint. */
  tatHours: number | null
  createdAt: string | null
  batchId: number | null
  owner: SupportPerson
  assignee?: SupportPerson | null
  /** When the ticket was last reopened or escalated (`logstamps.reopened_at`). */
  reopenedAt?: string | null
}

/**
 * What the student is allowed to do with a ticket *right now*. Computed once by
 * {@link getTicketCapabilities} and read by every action surface so the rules
 * live in exactly one place. See `ticketCapabilities.ts`.
 */
export interface TicketCapabilities {
  canReply: boolean
  canRate: boolean
  canReopen: boolean
  canEscalate: boolean
}

export type SupportEntityCategory =
  | 'lecture'
  | 'assignment'
  | 'resource'
  | 'evaluation'

/** Lecture kind chip on support item cards (`live` / `video` / `scrum`). */
export type SupportLectureDisplayType = 'live' | 'video' | 'scrum'

/** Item card fields for floating support step 2.5 (`Before you raise a ticket`). */
export interface SupportEntityContextItem {
  id: number
  title: string
  meta: string
  date: string
  type?: SupportLectureDisplayType
  startTime?: string
  isOptional?: boolean
  isMandatory?: boolean
}

/** Resolved learn entity for opening the floater from a detail page CTA. */
export interface SupportEntityContext {
  batchId: number
  category: SupportEntityCategory
  item: SupportEntityContextItem
  /** Included for lectures so step 2.5 reuses the same snapshot as the listing path. */
  lectureSnapshot?: LectureSupportSnapshot
}

/**
 * Lean payload for the floating support modal — fetched once when the user opens
 * the floater (`GET /api/support/floating-chat/inbox`).
 */
export interface FloatingChatInbox {
  batches: Array<SupportBatch>
  tickets: Array<TicketListItem>
  callbackTickets: Array<CallbackTicketItem>
  /** Count of open + re-opened tickets (drives the My Tickets badge). */
  openTicketCount: number
  /** Reason + time-slot pickers (from `menus`). */
  callback: { reasons: Array<CallbackOption>; timeslots: Array<CallbackOption> }
  /** Legacy gate: any `user_batch_admission_data` row for the student. */
  isNewUserJourney: boolean
  /** Batch ids where `full_fees_paid` is set — drives Student-Kit reason visibility. */
  fullFeesPaidBatchIds: Array<number>
  /** Batch support line + phone keyed by batch id. */
  batchContacts: Record<number, { text: string | null; phone: string | null }>
  /** 1:1 booking grouped by batch (empty when none — hides the 1:1 tab). */
  oneOnOne: Array<OneOnOneBatchGroup>
}

export type LectureRecordingStatus = 'available' | 'not_available'

export type AiSummaryStatus = 'generated' | 'processing' | 'not_available'

/**
 * Lean lecture snapshot for floating support item confirmation (`GET /api/support/floating-chat/lectures/:lectureId`).
 * Probes Gumlet HLS availability server-side — does not bloat the learn lecture detail API.
 */
export interface LectureSupportSnapshot {
  lectureId: number
  batchId: number
  lectureKind: 'live' | 'video'
  /** Item card headline (step 2.5 confirmation). */
  title: string
  /** Module/week or category line under the title. */
  meta: string
  /** Human-readable schedule line (`formatSocialPostTime` or fallback). */
  date: string
  /** Raw lecture `type` mapped for chips (`live` / `video` / `scrum`). */
  lectureDisplayType?: SupportLectureDisplayType
  /** ISO-ish schedule from DB — used as `startTime` on item cards. */
  schedule: string | null
  /** Mandatory vs recommended/optional — drives whether attendance is scored at all. */
  isMandatory: boolean
  /** Recommended/optional lecture (inverse of mandatory-only flag). */
  isOptional: boolean
  livePhase: 'before' | 'during' | 'after' | null
  videoPhase: 'before' | 'during_after' | null
  joinLiveButtonState: JoinLiveButtonState | null
  isSessionPending: boolean
  recordingStatus: LectureRecordingStatus
  recordingUrl: string | null
  aiSummaryStatus: AiSummaryStatus
  attendance: LectureAttendanceSummary | null
  showAttendance: boolean
}

export type AssignmentSupportSnapshotTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'

/**
 * Lean assignment/evaluation snapshot for floating support item confirmation
 * (`GET /api/support/floating-chat/assignments/:assignmentId`).
 */
export interface AssignmentSupportSnapshot {
  assignmentId: number
  assignmentKind: 'practice' | 'assignment' | 'evaluation'
  phase: 'before' | 'during' | 'after'
  progressStatus: 'new' | 'in-progress' | 'overdue' | 'completed'
  typeLabel: string | null
  statusLabel: string
  statusTone: AssignmentSupportSnapshotTone
  scoreDisplay: string | null
  scorePolicyNotice: string | null
  weightagePercentage: number | null
}

/**
 * The aggregated payload for the support landing page — fetched in **one** GET
 * (`/api/support/overview`). Every section below is produced by an independent,
 * reusable service so other endpoints can call them in isolation; the overview
 * orchestrator just fans out with `Promise.all` and composes the results.
 */
export interface SupportOverview {
  /** The student's batches; the first is the default scope. */
  batches: Array<SupportBatch>
  /** Whether (and why) ticket creation is blocked. */
  gateReason: SupportGateReason
  /** Optional batch support contact line + phone. */
  contact: { text: string | null; phone: string | null }
  /** Category tree for browsing FAQs and for the create-ticket picker. */
  categories: Array<SupportCategory>
  /** A first page of FAQs to show before the student searches. */
  faqs: Array<SupportFaq>
  /** The student's current tickets (first page, newest first). */
  tickets: Array<TicketListItem>
  /** Count of not-yet-resolved tickets (drives the header badge). */
  openTicketCount: number
  /** Whether the student is on the new-user journey (gates "Request a Callback" CTA). */
  isNewUserJourney: boolean
  /** Whether full fees are paid for the active batch (gates "Student-Kit" callback reason). */
  hasFullFees: boolean
  /** Options for the "request a callback" flow. */
  callback: { reasons: Array<CallbackOption>; timeslots: Array<CallbackOption> }
  /** Callback requests the student has already raised (shown in Raised Tickets). */
  callbackTickets: Array<CallbackTicketItem>
  /** 1:1 booking grouped by batch (empty when none — hides the 1:1 tab). */
  oneOnOne: Array<OneOnOneBatchGroup>
}

/** The conversation payload — fetched in one GET (`/api/support/tickets/thread`). */
export interface TicketThread {
  ticket: TicketDetail
  statusResponse: TicketStatusResponse | null
  messages: Array<TicketMessage>
  capabilities: TicketCapabilities
}
