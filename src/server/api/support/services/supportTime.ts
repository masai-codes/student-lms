/**
 * Support module — timestamp helper.
 *
 * Every `tickets` / `comments` / `user_callback_tickets` row written by the
 * legacy backend stores **IST wall-clock** in its `created_at` / `updated_at`
 * columns, not UTC: `experience-api/src/utils/getCurrentTime.ts` is literally
 * `new Date(Date.now() + 5.5h)`, and both `createTicket` resolvers do the same
 * inline. Admin tooling, TAT reports and exports all read those columns as IST.
 *
 * So the new LMS must write the same convention — a UTC timestamp here would
 * silently land 5h30m in the past next to every legacy row.
 *
 * Emitted as `YYYY-MM-DD HH:MM:SS` (MySQL DATETIME literal) rather than an ISO
 * string with a `Z` suffix: the columns are `TIMESTAMP(0)`, the trailing zone
 * designator is meaningless to MySQL and is rejected outright under strict mode.
 */

import { IST_OFFSET_MS } from '@/server/learn/utils/learnListingConstants'
import { toMysqlUtc } from '@/server/learn/utils/buildLearnScheduleWindow'

/** Current time as an IST wall-clock MySQL datetime — legacy `getCurrentTime()`. */
export function supportNow(): string {
  return toMysqlUtc(Date.now() + IST_OFFSET_MS)
}
