/**
 * User-level deactivation. A user with `users.status === 'disabled'` is deactivated
 * and must be blocked from signing in (send-OTP / verify-OTP / password login) and
 * rejected on session bootstrap so an active session is cut off on the next request.
 */

export const DEACTIVATED_STATUS = 'disabled'

export function isUserDeactivated(status: string | null | undefined): boolean {
  return (
    typeof status === 'string' &&
    status.trim().toLowerCase() === DEACTIVATED_STATUS
  )
}
