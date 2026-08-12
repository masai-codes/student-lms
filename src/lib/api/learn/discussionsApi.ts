import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import type { LearnDiscussionListItem } from '@/server/learn/types'
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

export async function listLearnDiscussionsViaApi(
  batchId: number,
): Promise<Array<LearnDiscussionListItem>> {
  const { discussions } = await call<{
    discussions: Array<LearnDiscussionListItem>
  }>(`${LEARN_API.discussions}?batchId=${batchId}`, { method: 'GET' })
  return discussions
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

export async function markLearnDiscussionRepliesReadViaApi(
  discussionId: number,
): Promise<{ ok: boolean }> {
  return call<{ ok: boolean }>(LEARN_API.discussionRead(discussionId), {
    method: 'POST',
  })
}

export async function setLearnDiscussionClosedViaApi(input: {
  discussionId: number
  isClosed: boolean
}): Promise<{ isClosed: boolean }> {
  return call<{ isClosed: boolean }>(
    LEARN_API.discussionClose(input.discussionId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isClosed: input.isClosed }),
    },
  )
}

export async function submitLearnDiscussionFeedbackViaApi(input: {
  discussionId: number
  rating: number
  comment?: string
}): Promise<{ rating: number }> {
  return call<{ rating: number }>(
    LEARN_API.discussionFeedback(input.discussionId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: input.rating, comment: input.comment }),
    },
  )
}
