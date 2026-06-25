import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'
import { LEARN_API } from '@/lib/api/learnPaths'

async function call<T>(path: string, init: RequestInit): Promise<T> {
  try {
    return await fetchJson<T>(path, init)
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.code)
    }
    throw error
  }
}

export async function createLearnDiscussionViaApi(input: {
  kind: CreateLearnDiscussionKind
  entityId: number
  title: string
  message: string
}): Promise<{ discussionId: number }> {
  return call<{ discussionId: number }>(LEARN_API.discussions, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function addLearnDiscussionReplyViaApi(input: {
  discussionId: number
  message: string
}): Promise<{ ok: boolean }> {
  return call<{ ok: boolean }>(
    LEARN_API.discussionReplies(input.discussionId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.message }),
    },
  )
}
