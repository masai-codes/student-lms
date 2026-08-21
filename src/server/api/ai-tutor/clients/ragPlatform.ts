import type { RagPlatformJobResponse } from '@/server/api/ai-tutor/types/lectureRagIngest'
import type { RagPlatformRetrieveResponse } from '@/server/api/ai-tutor/types/lectureRagRetrieve'
import { ApiError } from '@/server/api/http/apiError'

const API_KEY_HEADER = 'X-API-KEY'
const DEFAULT_COLLECTION_NAME = 'student-lms-ai-tutor'
const REQUEST_TIMEOUT_MS = 30_000

function getRagPlatformBaseUrl(): string {
  const raw = process.env.RAG_PLATFORM_BASE_URL?.trim()
  if (!raw) {
    throw new ApiError(503, 'AI_TUTOR_RAG_PLATFORM_NOT_CONFIGURED')
  }
  return raw.replace(/\/$/, '')
}

function getRagPlatformApiKey(): string {
  const apiKey = process.env.RAG_PLATFORM_API_KEY?.trim()
  if (!apiKey) {
    throw new ApiError(503, 'AI_TUTOR_RAG_PLATFORM_NOT_CONFIGURED')
  }
  return apiKey
}

export function getRagPlatformCollectionName(): string {
  return (
    process.env.RAG_PLATFORM_COLLECTION_NAME?.trim() || DEFAULT_COLLECTION_NAME
  )
}

export function isRagPlatformConfigured(): boolean {
  return Boolean(
    process.env.RAG_PLATFORM_BASE_URL?.trim() &&
    process.env.RAG_PLATFORM_API_KEY?.trim(),
  )
}

export function ensureRagPlatformConfigured(): void {
  getRagPlatformBaseUrl()
  getRagPlatformApiKey()
}

function ragHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    [API_KEY_HEADER]: getRagPlatformApiKey(),
  }
}

async function parseRagJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(
      503,
      'AI_TUTOR_RAG_PLATFORM_REQUEST_FAILED',
      `RAG platform HTTP ${res.status}: ${text.slice(0, 200)}`,
    )
  }
  return (await res.json()) as T
}

export async function ensureRagCollection(
  collectionName: string,
): Promise<void> {
  const res = await fetch(`${getRagPlatformBaseUrl()}/collections`, {
    method: 'POST',
    headers: ragHeaders(),
    body: JSON.stringify({ collection_name: collectionName }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  await parseRagJson(res)
}

export async function deleteRagDocument(documentId: string): Promise<void> {
  const res = await fetch(
    `${getRagPlatformBaseUrl()}/documents/${encodeURIComponent(documentId)}`,
    {
      method: 'DELETE',
      headers: ragHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  )
  if (res.status === 404) return
  await parseRagJson(res)
}

export async function ingestRagText(input: {
  collectionName: string
  documentId: string
  documentName: string
  text: string
  metadata: Record<string, string | number>
}): Promise<RagPlatformJobResponse> {
  const res = await fetch(`${getRagPlatformBaseUrl()}/api/v1/ingestion/text`, {
    method: 'POST',
    headers: ragHeaders(),
    body: JSON.stringify({
      collection_name: input.collectionName,
      document_name: input.documentName,
      document_id: input.documentId,
      text: input.text,
      metadata: input.metadata,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  return parseRagJson<RagPlatformJobResponse>(res)
}

export async function retrieveRagChunks(input: {
  collectionName: string
  query: string
  topK: number
  metadataFilters: Record<string, string | number>
}): Promise<RagPlatformRetrieveResponse> {
  const res = await fetch(`${getRagPlatformBaseUrl()}/api/v1/retrieve`, {
    method: 'POST',
    headers: ragHeaders(),
    body: JSON.stringify({
      collection_name: input.collectionName,
      query: input.query,
      top_k: input.topK,
      metadata_filters: input.metadataFilters,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  return parseRagJson<RagPlatformRetrieveResponse>(res)
}
