import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleAiTicketCallback } from '@/server/api/support/handlers/aiTicketCallback.handler'

const resolveAiTicketDraftCallback = vi.hoisted(() => vi.fn())

vi.mock('@/server/api/support/services/aiTicketCallback.service', () => ({
  resolveAiTicketDraftCallback,
}))

const API_KEY = 'agent-secret'

function request(body: unknown, apiKey: string | undefined = API_KEY): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (apiKey !== undefined) headers.set('x-api-key', apiKey)
  return new Request('http://localhost/api/support/ai/callback', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function validBody() {
  return {
    ticket_id: 1,
    conversation_turn: 1,
    workflow_run_id: 'wf-1',
    status: 'ready',
    draft_kind: 'answer',
    generated_message: 'here is the fix',
  }
}

beforeEach(() => {
  process.env.AI_TICKET_AGENT_INTERNAL_SECRET = API_KEY
  resolveAiTicketDraftCallback.mockReset()
})

afterEach(() => {
  delete process.env.AI_TICKET_AGENT_INTERNAL_SECRET
})

describe('handleAiTicketCallback', () => {
  it('returns 200 with the service result on a valid request', async () => {
    resolveAiTicketDraftCallback.mockResolvedValue({ outcome: 'sent_ai' })

    const response = await handleAiTicketCallback(request(validBody()))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ outcome: 'sent_ai' })
    expect(resolveAiTicketDraftCallback).toHaveBeenCalledTimes(1)
  })

  it('returns 401 when the shared secret is wrong', async () => {
    const response = await handleAiTicketCallback(request(validBody(), 'wrong'))

    expect(response.status).toBe(401)
    expect(resolveAiTicketDraftCallback).not.toHaveBeenCalled()
  })

  it('returns 503 when the webhook is not configured', async () => {
    delete process.env.AI_TICKET_AGENT_INTERNAL_SECRET
    const response = await handleAiTicketCallback(request(validBody()))

    expect(response.status).toBe(503)
    expect(resolveAiTicketDraftCallback).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid payload', async () => {
    const response = await handleAiTicketCallback(
      request({ ticket_id: 1 }, API_KEY),
    )

    expect(response.status).toBe(400)
    expect(resolveAiTicketDraftCallback).not.toHaveBeenCalled()
  })

  it('maps a thrown ApiError from the service to its status', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    resolveAiTicketDraftCallback.mockRejectedValue(
      new ApiError(404, 'AI_TICKET_DRAFT_NOT_FOUND'),
    )

    const response = await handleAiTicketCallback(request(validBody()))

    expect(response.status).toBe(422)
    expect(response.headers.get('x-true-status')).toBe('404')
    await expect(response.json()).resolves.toMatchObject({
      code: 'AI_TICKET_DRAFT_NOT_FOUND',
    })
  })
})
