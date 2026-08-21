import type { EnrolmentClient } from '@/server/api/webhooks/admissions/types'

/**
 * The portal flags admissions may set on an enrolment payload. `null` is a
 * legitimate "flag not set" from the platform, so it is accepted like `undefined`.
 */
type ClientFlags = {
  isiHub?: boolean | null
  isiitj?: boolean | null
}

/**
 * Map the admissions portal flags onto the `users.client` value the LMS stores.
 * IIT Jodhpur enrolments live under `iitj`, iHub ones under `ihub`, and
 * everything else is `masai`. `isiitj` wins if both flags somehow arrive true,
 * since it is the more specific programme.
 */
export function resolveClient({
  isiHub,
  isiitj,
}: ClientFlags): EnrolmentClient {
  if (isiitj) return 'iitj'
  if (isiHub) return 'ihub'
  return 'masai'
}
