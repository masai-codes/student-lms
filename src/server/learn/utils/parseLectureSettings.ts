export type ParsedLectureSettings = {
  hideVideo: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseLectureSettings(raw: unknown): ParsedLectureSettings {
  if (!isRecord(raw)) {
    return { hideVideo: false }
  }
  return { hideVideo: raw.hide_video === true }
}
