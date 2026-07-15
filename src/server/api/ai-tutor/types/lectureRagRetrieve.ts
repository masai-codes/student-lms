export type RagPlatformChunkResult = {
  chunk_id: string
  document_id: string
  score: number
  content: string
  metadata?: Record<string, unknown>
  document_name?: string | null
  chunk_index?: number | null
}

export type RagPlatformRetrieveResponse = {
  query: string
  chunks: Array<RagPlatformChunkResult>
}

export type RetrievedLectureChunk = {
  content: string
  sourceType: string | null
  documentName: string | null
  score: number | null
}
