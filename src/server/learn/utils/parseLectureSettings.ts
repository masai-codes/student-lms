/**
 * A single in-lecture popup quiz, surfaced while the recording plays between the
 * given start/end timestamps (`HH:MM:SS`). `assessmentTemplate` is the id of the
 * assessment template to render.
 */
type InLecturePopupQuiz = {
  timeStamp: { start: string; end: string }
  assessmentTemplate: string
}

export type ParsedLectureSettings = {
  hideVideo: boolean
  hideNotes: boolean
  showFeedback: boolean
  inLecturePopupQuiz: Array<InLecturePopupQuiz>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTruthySettingFlag(value: unknown): boolean {
  return value === true || value === 1
}

function parseInLecturePopupQuiz(raw: unknown): Array<InLecturePopupQuiz> {
  if (!Array.isArray(raw)) {
    return []
  }
  const quizzes: Array<InLecturePopupQuiz> = []
  for (const entry of raw) {
    if (!isRecord(entry)) continue
    const { timeStamp, assessmentTemplate } = entry
    if (typeof assessmentTemplate !== 'string') continue
    if (!isRecord(timeStamp)) continue
    const { start, end } = timeStamp
    if (typeof start !== 'string' || typeof end !== 'string') continue
    quizzes.push({ timeStamp: { start, end }, assessmentTemplate })
  }
  return quizzes
}

export function parseLectureSettings(raw: unknown): ParsedLectureSettings {
  if (!isRecord(raw)) {
    return {
      hideVideo: false,
      hideNotes: false,
      showFeedback: false,
      inLecturePopupQuiz: [],
    }
  }
  return {
    // Match legacy LMS truthy semantics: `hide_video` is stored as either a
    // JSON boolean `true` or the integer `1`, both of which must hide the video.
    hideVideo: isTruthySettingFlag(raw.hide_video),
    hideNotes: isTruthySettingFlag(raw.hide_notes),
    showFeedback: isTruthySettingFlag(raw.show_feedback),
    inLecturePopupQuiz: parseInLecturePopupQuiz(raw.inLecturePopupQuiz),
  }
}
