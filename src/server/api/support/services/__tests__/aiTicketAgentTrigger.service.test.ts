import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

function lastFetchBody(
  fetchMock: ReturnType<typeof vi.fn>,
): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit]
  return JSON.parse(String(init.body))
}

const INPUT = {
  ticketId: 1,
  conversationTurn: 1,
  workflowRunId: 'wf-1',
  userId: 9,
  batchId: 10,
  entityId: 0,
  category: 'lecture',
  messages: [{ role: 'user' as const, content: 'my video is broken' }],
}

beforeEach(() => {
  vi.restoreAllMocks()
  process.env.AI_TICKET_AGENT_TRIGGER_URL = 'http://agent.test/trigger'
  process.env.AI_TICKET_AGENT_INTERNAL_SECRET = 'sekret'
  process.env.AI_TICKET_AGENT_CALLBACK_BASE_URL = 'http://lms.test/'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('triggerAiTicketAgent', () => {
  it('returns false without calling fetch when any env var is missing', async () => {
    delete process.env.AI_TICKET_AGENT_TRIGGER_URL
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { triggerAiTicketAgent } =
      await import('../aiTicketAgentTrigger.service')
    const accepted = await triggerAiTicketAgent(INPUT)

    expect(accepted).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
  })

  it('posts the trigger payload with the shared-secret header and built callback_url', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const { triggerAiTicketAgent } =
      await import('../aiTicketAgentTrigger.service')
    const accepted = await triggerAiTicketAgent(INPUT)

    expect(accepted).toBe(true)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://agent.test/trigger')
    expect(
      (init.headers as Record<string, string>)['x-ai-ticket-agent-secret'],
    ).toBe('sekret')
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('sekret')
    expect(lastFetchBody(fetchMock)).toEqual({
      ticket_id: 1,
      conversation_turn: 1,
      workflow_run_id: 'wf-1',
      user_id: 9,
      batch_id: 10,
      entity_id: null,
      category: 'lecture',
      messages: [{ role: 'user', content: 'my video is broken' }],
      callback_url: 'http://lms.test/api/support/ai/callback',
    })
  })

  it('maps the general bucket to the agent enum and drops unknown categories', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const { triggerAiTicketAgent } =
      await import('../aiTicketAgentTrigger.service')
    await triggerAiTicketAgent({ ...INPUT, category: 'general_query' })
    expect(lastFetchBody(fetchMock).category).toBe('general query')

    await triggerAiTicketAgent({ ...INPUT, category: 'something_else' })
    expect(lastFetchBody(fetchMock).category).toBeNull()
  })

  it('returns false and warns on a non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('boom'),
    })
    vi.stubGlobal('fetch', fetchMock)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { triggerAiTicketAgent } =
      await import('../aiTicketAgentTrigger.service')
    await expect(triggerAiTicketAgent(INPUT)).resolves.toBe(false)
    expect(warn).toHaveBeenCalledWith(
      '[aiTicketAgent] trigger HTTP',
      500,
      'boom',
    )
  })

  it('returns false and swallows transport errors', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { triggerAiTicketAgent } =
      await import('../aiTicketAgentTrigger.service')
    await expect(triggerAiTicketAgent(INPUT)).resolves.toBe(false)
    expect(warn).toHaveBeenCalled()
  })
})
