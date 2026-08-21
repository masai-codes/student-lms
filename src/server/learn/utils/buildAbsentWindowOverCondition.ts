import { sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import { lectures, sections } from '@/db/schema'
import { toMysqlUtc } from '@/server/learn/utils/buildLearnScheduleWindow'
import { IST_OFFSET_MS } from '@/server/learn/utils/learnListingConstants'

/**
 * SQL mirror of `computeCatchUpWindow` for the **no-attendance-row** case.
 *
 * A mandatory lecture with no `student_attendances` row still renders an
 * `att_window_over` badge when its section counts recording watch-time toward
 * attendance AND the catch-up window has already closed. That decision is
 * normally made in JS (`computeCatchUpWindow` → `buildLectureAttendanceSummary`
 * → `getLectureAttendanceRender`), reading the section's JSON settings. The
 * `absent` listing filter has to reproduce it in SQL so these cards are matched
 * and paginated correctly instead of being dropped.
 *
 * ⚠️ Keep in sync with `computeCatchUpWindow`
 * (`src/server/attendance/utils/computeCatchUpWindow.ts`) and
 * `parseSectionAttendanceSettings`. The window closes `catchUpDays` after
 * `COALESCE(concludes, schedule)`; both columns are IST wall-clock, so `nowMs`
 * is shifted by `IST_OFFSET_MS` before the comparison.
 *
 * Only the window-**over** state is matched — a visible `att_window_over` badge.
 * A lecture still inside its catch-up window renders no absent chip (only a
 * "N days remaining" hint), so it is intentionally NOT matched here.
 *
 * Emitted as a correlated `EXISTS` subquery; the caller must already require a
 * mandatory lecture (`optional = 0`) with no attendance row for this user.
 */
export function buildAbsentWindowOverCondition(nowMs: number): SQL {
  const nowIst = toMysqlUtc(nowMs + IST_OFFSET_MS)
  // `catchUpDays` may be a JSON number or string; JSON_UNQUOTE + CAST covers both.
  const catchUpDays = sql`CAST(JSON_UNQUOTE(JSON_EXTRACT(${sections.settings}, '$.catchUpDays')) AS UNSIGNED)`

  return sql`EXISTS (
    SELECT 1 FROM ${sections}
    WHERE ${sections.id} = ${lectures.sectionId}
      AND (
        JSON_EXTRACT(${sections.settings}, '$.enableVideoAttendance') = CAST('true' AS JSON)
        OR JSON_EXTRACT(${sections.settings}, '$.considerVideoAttendanceForActualAttendance') = CAST('true' AS JSON)
      )
      AND ${catchUpDays} > 0
      AND DATE_ADD(
            COALESCE(${lectures.concludes}, ${lectures.schedule}),
            INTERVAL ${catchUpDays} DAY
          ) <= ${nowIst}
  )`
}
