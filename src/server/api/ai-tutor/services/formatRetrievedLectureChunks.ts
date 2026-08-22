import type {
  RagPlatformChunkResult,
  RetrievedLectureChunk,
} from '@/server/api/ai-tutor/types/lectureRagRetrieve'
import { AI_TUTOR_RAG_RETRIEVED_CONTENT_MAX_CHARS } from '@/server/api/ai-tutor/constants'

function readSourceType(
  metadata: Record<string, unknown> | undefined,
): string | null {
  const value = metadata?.source_type
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function mapRagChunkToRetrieved(
  chunk: RagPlatformChunkResult,
): RetrievedLectureChunk {
  return {
    content: chunk.content,
    sourceType: readSourceType(chunk.metadata),
    documentName: chunk.document_name ?? null,
    score: typeof chunk.score === 'number' ? chunk.score : null,
  }
}

export function trimRetrievedChunksToBudget(
  chunks: Array<RetrievedLectureChunk>,
  maxChars = AI_TUTOR_RAG_RETRIEVED_CONTENT_MAX_CHARS,
): Array<RetrievedLectureChunk> {
  const trimmed: Array<RetrievedLectureChunk> = []
  let usedChars = 0

  for (const chunk of chunks) {
    const content = chunk.content.trim()
    if (!content) continue

    const separatorLength = trimmed.length > 0 ? 2 : 0
    if (usedChars + separatorLength + content.length > maxChars) break

    trimmed.push({ ...chunk, content })
    usedChars += separatorLength + content.length
  }

  return trimmed
}

export function formatRetrievedChunksForPrompt(
  chunks: Array<RetrievedLectureChunk>,
): string {
  if (chunks.length === 0) {
    return 'No lecture content was retrieved for this question.'
  }

  return chunks
    .map((chunk) => {
      const label = chunk.sourceType ?? chunk.documentName ?? 'lecture'
      const score =
        chunk.score == null ? '' : ` · score ${chunk.score.toFixed(2)}`
      return `[${label}${score}]\n${chunk.content}`
    })
    .join('\n\n')
}
