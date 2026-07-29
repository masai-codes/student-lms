import type { EnrolmentClient } from '@/server/api/webhooks/admissions/types'

/**
 * Map the admissions `isiHub` flag onto the `users.client` value the LMS stores.
 * iHub enrolments live under the `ihub` client; everything else is `masai`.
 */
export function resolveClient(isiHub?: boolean): EnrolmentClient {
  return isiHub ? 'ihub' : 'masai'
}
