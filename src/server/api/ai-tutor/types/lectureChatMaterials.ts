import type { LectureSharedResource } from '@/server/api/ai-tutor/services/parseLectureZoomChatResources'

export type LectureChatMaterials = {
  lectureId: number
  title: string
  summary: string | null
  resourcesShared: Array<LectureSharedResource>
  notesRagged: boolean
  notesInline: string | null
  notesOutline: string | null
  notesCharacterCount: number
  ragRetrievalAvailable: boolean
}
