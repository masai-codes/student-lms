import { createServerFn } from "@tanstack/react-start";
import { and, between, inArray, or } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import { assignments, lectures } from "@/db/schema";
import { getBatchIdsForEnrolledUser } from "@/server/batches/getBatchIdsForEnrolledUser";

/* ---------------- types ---------------- */

type Lecture = InferSelectModel<typeof lectures>;
type Assignment = InferSelectModel<typeof assignments>;

type DaySchedule = {
  lectures: Array<Lecture>;
  assignments: Array<Assignment>;
};

export type WeeklyScheduleResponse = Record<string, DaySchedule>;

/* ---------------- helpers ---------------- */

const toMysqlDateTime = (date: Date) =>
  date.toISOString().slice(0, 19).replace("T", " ");

const formatDateKey = (date: Date) => {
  const day = date.toLocaleDateString("en-US", { weekday: "short" });
  const dd = date.toLocaleDateString("en-US", { day: "2-digit" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day}-${dd}-${month}`;
};

const getDateOnly = (date: string | Date | null) => {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const pushUnique = <T extends { id: number }>(
  bucket: Array<T>,
  item: T
) => {
  if (!bucket.some((i) => i.id === item.id)) {
    bucket.push(item);
  }
};

/* ---------------- server fn ---------------- */

export const fetchWeeklySchedule = createServerFn({ method: "GET" })
  .inputValidator((data: { userId: number }) => data)
  .handler(async ({ data }): Promise<WeeklyScheduleResponse> => {
    try {
      /* 1. get user batches (section enrollments) */
      const batchIds = await getBatchIdsForEnrolledUser(data.userId);
      if (!batchIds.length) return {};

      /* 2. date range */
      const now = new Date();
      const next7Days = new Date();
      next7Days.setDate(now.getDate() + 7);

      const from = toMysqlDateTime(now);
      const to = toMysqlDateTime(next7Days);

      /* 3. fetch lectures & assignments */
      const upcomingLectures = await db
        .select()
        .from(lectures)
        .where(
          and(
            inArray(lectures.batchId, batchIds),
            or(
              between(lectures.schedule, from, to),
              between(lectures.concludes, from, to)
            )
          )
        );

      const upcomingAssignments = await db
        .select()
        .from(assignments)
        .where(
          and(
            inArray(assignments.batchId, batchIds),
            or(
              between(assignments.schedule, from, to),
              between(assignments.concludes, from, to)
            )
          )
        );

      /* 4. build ordered days (SINGLE SOURCE OF TRUTH) */
      const days: Array<{ key: string; time: number }> = [];

      for (let i = 0; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        d.setHours(0, 0, 0, 0);

        days.push({
          key: formatDateKey(d),
          time: d.getTime(),
        });
      }

      /* 5. init ordered schedule map */
      const scheduleMap: WeeklyScheduleResponse = Object.fromEntries(
        days.map(({ key }) => [
          key,
          { lectures: [], assignments: [] },
        ])
      );

      /* 6. bucket lectures */
      for (const lecture of upcomingLectures) {
        const scheduleDate = getDateOnly(lecture.schedule);
        const concludeDate = getDateOnly(lecture.concludes);

        for (const day of days) {
          if (
            (scheduleDate && scheduleDate === day.time) ||
            (concludeDate && concludeDate === day.time)
          ) {
            pushUnique(scheduleMap[day.key].lectures, lecture);
          }
        }
      }

      /* 7. bucket assignments */
      for (const assignment of upcomingAssignments) {
        const scheduleDate = getDateOnly(assignment.schedule);
        const concludeDate = getDateOnly(assignment.concludes);

        for (const day of days) {
          if (
            (scheduleDate && scheduleDate === day.time) ||
            (concludeDate && concludeDate === day.time)
          ) {
            pushUnique(scheduleMap[day.key].assignments, assignment);
          }
        }
      }

      /* 8. RETURN — guaranteed order */
      return scheduleMap;
    } catch (err) {
      console.error("🔥 Server/DB error", err);
      throw new Error("SERVER_ERROR_FETCHING_WEEKLY_SCHEDULE");
    }
  });
