import type { CallbackTicketItem } from '@/server/api/support/support.types'

/** True when the student already has a pending callback for this batch. */
export function hasPendingCallbackForBatch(
  callbackTickets: Array<CallbackTicketItem>,
  batchId: number,
): boolean {
  return callbackTickets.some(
    (ticket) =>
      ticket.batchId === batchId && ticket.status.toLowerCase() === 'pending',
  )
}

/** Legacy filter: hide the "Student-Kit" reason unless full fees are paid. */
export function filterCallbackReasons(
  reasons: Array<{ value: string }>,
  hasFullFees: boolean,
): Array<string> {
  return reasons
    .filter((reason) => hasFullFees || reason.value !== 'Student-Kit')
    .map((reason) => reason.value)
}
