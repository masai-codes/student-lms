export type ParsedLectureSettings = {
  hideVideo: boolean
  hideNotes: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTruthySettingFlag(value: unknown): boolean {
  return value === true || value === 1
}

export function parseLectureSettings(raw: unknown): ParsedLectureSettings {
  if (!isRecord(raw)) {
    return { hideVideo: false, hideNotes: false }
  }
  return {
    hideVideo: raw.hide_video === true,
    hideNotes: isTruthySettingFlag(raw.hide_notes),
  }
}
