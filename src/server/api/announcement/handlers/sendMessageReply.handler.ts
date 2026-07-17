import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { sendMessageReply } from '@/server/api/announcement/sendMessageReply.service'

export async function handleSendMessageReply(
  request: Request,
  rawId: string,
): Promise<Response> {
  const currentUserId = await requireSessionUserId()
  const rootMessageId = parseInt(rawId, 10)
  if (!Number.isFinite(rootMessageId) || rootMessageId <= 0) {
    return new Response(JSON.stringify({ error: 'INVALID_ID' }), {
      status: 400,
    })
  }

  const { body } = (await request.json()) as { body?: string }
  if (!body?.trim()) {
    return new Response(JSON.stringify({ error: 'BODY_REQUIRED' }), {
      status: 400,
    })
  }

  await sendMessageReply(currentUserId, rootMessageId, body.trim())
  return jsonOk({ ok: true }, { status: 201 })
}
