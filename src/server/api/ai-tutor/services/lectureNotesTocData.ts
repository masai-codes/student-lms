export const AI_TUTOR_NOTES_TOC_DATA_KEY = 'notesToc'
export const AI_TUTOR_NOTES_RAGGED_DATA_KEY = 'notesRagged'

export type LectureNotesRagData = {
  [AI_TUTOR_NOTES_TOC_DATA_KEY]?: string
  [AI_TUTOR_NOTES_RAGGED_DATA_KEY]?: boolean
}

export function readNotesTocFromLectureData(
  data: Record<string, unknown> | null | undefined,
): string | null {
  const value = data?.[AI_TUTOR_NOTES_TOC_DATA_KEY]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function readNotesRaggedFromLectureData(
  data: Record<string, unknown> | null | undefined,
): boolean | null {
  const value = data?.[AI_TUTOR_NOTES_RAGGED_DATA_KEY]
  return typeof value === 'boolean' ? value : null
}

export function mergeLectureNotesRagData(
  data: Record<string, unknown> | null | undefined,
  input: { notesRagged: boolean; notesToc?: string | null },
): LectureNotesRagData & Record<string, unknown> {
  const next: LectureNotesRagData & Record<string, unknown> = {
    ...(data ?? {}),
    [AI_TUTOR_NOTES_RAGGED_DATA_KEY]: input.notesRagged,
  }

  if (input.notesRagged && input.notesToc) {
    next[AI_TUTOR_NOTES_TOC_DATA_KEY] = input.notesToc
    return next
  }

  delete next[AI_TUTOR_NOTES_TOC_DATA_KEY]
  return next
}
