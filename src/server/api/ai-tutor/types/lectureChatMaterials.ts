export type LectureChatMaterials = {
  lectureId: number
  summary: string | null
  notesRagged: boolean
  notesInline: string | null
  notesOutline: string | null
  notesCharacterCount: number
  ragRetrievalAvailable: boolean
}
