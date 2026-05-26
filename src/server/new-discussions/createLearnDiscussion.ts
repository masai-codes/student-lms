import { createServerFn } from '@tanstack/react-start'

import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { createDiscussionForLearnEntity } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { parseCreateDiscussionInput } from '@/server/new-discussions/utils/validateDiscussionWriteInput'

export const createLearnDiscussion = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      kind: CreateLearnDiscussionKind
      entityId: number
      title: string
      message: string
    }) => data
  )
  .handler(createLearnDiscussionHandler)

export async function createLearnDiscussionHandler({
  data,
}: {
  data: {
    kind: CreateLearnDiscussionKind
    entityId: number
    title: string
    message: string
  }
}) {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  const { title, message } = parseCreateDiscussionInput({
    title: data.title,
    message: data.message,
  })

  if (!Number.isFinite(data.entityId) || data.entityId <= 0) {
    throw new Error('INVALID_ENTITY_ID')
  }

  return createDiscussionForLearnEntity({
    authorUserId: userId,
    kind: data.kind,
    entityId: data.entityId,
    title,
    message,
  })
}
