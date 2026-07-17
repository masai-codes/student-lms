export type ParsedLectureSettings = {
  hideVideo: boolean
  hideNotes: boolean
  showFeedback: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTruthySettingFlag(value: unknown): boolean {
  return value === true || value === 1
}

export function parseLectureSettings(raw: unknown): ParsedLectureSettings {
  if (!isRecord(raw)) {
    return { hideVideo: false, hideNotes: false, showFeedback: false }
  }
  return {
    // Match legacy LMS truthy semantics: `hide_video` is stored as either a
    // JSON boolean `true` or the integer `1`, both of which must hide the video.
    hideVideo: isTruthySettingFlag(raw.hide_video),
    hideNotes: isTruthySettingFlag(raw.hide_notes),
    showFeedback: isTruthySettingFlag(raw.show_feedback),
  }
}
