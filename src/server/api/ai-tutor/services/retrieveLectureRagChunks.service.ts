import type { RetrievedLectureChunk } from '@/server/api/ai-tutor/types/lectureRagRetrieve'
import {
  getRagPlatformCollectionName,
  isRagPlatformConfigured,
  retrieveRagChunks,
} from '@/server/api/ai-tutor/clients/ragPlatform'
import { AI_TUTOR_RAG_RETRIEVED_CONTENT_MAX_CHARS } from '@/server/api/ai-tutor/constants'
import {
  formatRetrievedChunksForPrompt,
  mapRagChunkToRetrieved,
  trimRetrievedChunksToBudget,
} from '@/server/api/ai-tutor/services/formatRetrievedLectureChunks'

export async function retrieveLectureRagChunksByQuery(input: {
  lectureId: number
  query: string
  topK: number
}): Promise<Array<RetrievedLectureChunk>> {
  if (!isRagPlatformConfigured()) return []

  const query = input.query.trim()
  if (!query) return []

  try {
    const response = await retrieveRagChunks({
      collectionName: getRagPlatformCollectionName(),
      query,
      topK: input.topK,
      metadataFilters: { lecture_id: input.lectureId },
    })

    const mapped = response.chunks.map(mapRagChunkToRetrieved)
    return trimRetrievedChunksToBudget(
      mapped,
      AI_TUTOR_RAG_RETRIEVED_CONTENT_MAX_CHARS,
    )
  } catch (error) {
    console.error('Failed to retrieve lecture RAG chunks', error)
    return []
  }
}

export async function retrieveLectureRagChunksForTool(input: {
  lectureId: number
  query: string
  topK: number
}): Promise<string> {
  const chunks = await retrieveLectureRagChunksByQuery(input)
  return formatRetrievedChunksForPrompt(chunks)
}
