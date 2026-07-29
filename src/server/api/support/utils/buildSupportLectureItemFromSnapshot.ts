import type {
  LectureSupportSnapshot,
  SupportEntityContextItem,
} from '@/server/api/support/support.types'

/** Item card fields derived from the lecture support snapshot (single source of truth). */
export function buildSupportLectureItemFromSnapshot(
  snapshot: LectureSupportSnapshot,
): SupportEntityContextItem {
  return {
    id: snapshot.lectureId,
    title: snapshot.title,
    meta: snapshot.meta,
    date: snapshot.date,
    type: snapshot.lectureDisplayType,
    startTime: snapshot.schedule ?? undefined,
    isOptional: snapshot.isOptional ? true : undefined,
    isMandatory: snapshot.isMandatory ? true : undefined,
  }
}
