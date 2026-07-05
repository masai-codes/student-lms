/**
 * Pure helpers for turning raw `lectures` rows into the guided-tour lecture
 * items the T0 flow renders. Kept db-free so the URL-resolution rules (video +
 * `zoom_link` backup) can be unit-tested without a database connection.
 */

export interface T0FlowLectureItem {
  id: string
  lectureId: number
  title: string
  videoUrl: string | null
  lectureType: string
}

export interface LectureRow {
  id: number
  title: string
  type: string
  videos: string | Array<string> | null
  zoom_link: string | null
}

/** First non-empty URL in the `videos` JSON array, or null. */
function firstVideoUrl(videos: string | Array<string> | null): string | null {
  if (!videos) return null
  try {
    const parsed = typeof videos === 'string' ? JSON.parse(videos) : videos
    if (Array.isArray(parsed)) {
      const url = parsed.find((u) => typeof u === 'string' && u.trim() !== '')
      return typeof url === 'string' ? url : null
    }
  } catch {
    // videos field not valid JSON — fall through to the zoom_link backup
  }
  return null
}

export function expandLectures(rows: Array<LectureRow>): Array<T0FlowLectureItem> {
  const items: Array<T0FlowLectureItem> = []
  for (const row of rows) {
    // Prefer the recorded video; fall back to the `zoom_link` backup column.
    // Adaptive / interactive-video lectures store their playback link in
    // `zoom_link` and leave `videos` empty — without this fallback they were
    // dropped from the tour even though the progress denominator still counts
    // them, so the modal showed fewer lectures than the "n/m" total.
    const zoomBackup = typeof row.zoom_link === 'string' && row.zoom_link.trim() !== '' ? row.zoom_link.trim() : null
    const videoUrl = firstVideoUrl(row.videos) ?? zoomBackup
    if (videoUrl === null) continue

    items.push({
      id: String(row.id),
      lectureId: row.id,
      title: row.title,
      videoUrl,
      lectureType: row.type,
    })
  }
  return items
}
