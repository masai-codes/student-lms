import type {
  TicketCapabilities,
  TicketStatus,
} from '@/server/api/support/support.types'

/**
 * The ticket "what can the student do now?" state machine.
 *
 * Every action surface in the UI (reply box, rating widget, reopen button,
 * escalate button) reads its enabled-state from here — **never** by inspecting
 * `status` ad-hoc. Keeping the rules in one pure function is the single biggest
 * correctness + UX lever in the module: the conversation footer always shows
 * exactly one coherent "next step".
 *
 * Rules (ported from the legacy flow):
 *   - open / re-opened  → the conversation is live: student can reply.
 *   - resolved / closed → student can rate; a 👎 unlocks reopen; escalate shows
 *                         only if a higher coordinator level exists for the batch.
 *   - automatic         → auto-resolved: rating only.
 *
 * @param status         Current ticket status.
 * @param rating         Current rating (0 = unrated, 1 = 👎, 5 = 👍).
 * @param hasHigherLevel Whether an escalation target above the current assignee
 *                       exists for this ticket's batch/category (see
 *                       `resolveAssignees.ts`).
 */
export function getTicketCapabilities(
  status: TicketStatus,
  rating: number,
  hasHigherLevel: boolean,
): TicketCapabilities {
  switch (status) {
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
        // Reopen is only offered after an explicit 👎 — a positive/!rated ticket
        // shouldn't tempt the student back into a resolved thread.
        canReopen: rating === 1,
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
