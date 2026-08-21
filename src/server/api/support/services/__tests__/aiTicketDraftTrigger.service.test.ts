import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  triggerAiTicketAgent: vi.fn(),
  sendFallbackForDraft: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, insert: hoisted.dbInsert },
}))
vi.mock('@/server/api/support/services/aiTicketAgentTrigger.service', () => ({
  triggerAiTicketAgent: hoisted.triggerAiTicketAgent,
}))
vi.mock('@/server/api/support/services/aiTicketDraftFallback.service', () => ({
  sendFallbackForDraft: hoisted.sendFallbackForDraft,
}))

/** A `.where()` result that resolves directly (nextConversationTurn / ticket
 * lookup) and also answers `.orderBy()` (the comments lookup). */
function chainable(rows: Array<Record<string, any>>) {
  const promise = Promise.resolve(rows) as Promise<any> & {
    orderBy: () => any
  }
  promise.orderBy = () => Promise.resolve(rows)
  return promise
}

/** Queues one result per call to `db.select(...)`, in call order. */
function stubSelectSequence(results: Array<Array<Record<string, any>>>) {
  let call = 0
  hoisted.dbSelect.mockImplementation(() => {
    const rows = results[call] ?? []
    call += 1
    return { from: () => ({ where: () => chainable(rows) }) }
  })
}

function captureInserts(insertId = 42) {
  const calls: Array<Record<string, any>> = []
  hoisted.dbInsert.mockReturnValue({
    values: (v: Record<string, any>) => {
      calls.push(v)
      return Promise.resolve([{ insertId }])
    },
  })
  return calls
}

const TICKET_ROW = {
  id: 1,
  userId: 9,
  message: 'my video is broken',
  category: 'lecture',
  data: { batch_id: '10', entity_id: 500 },
}

describe('nextConversationTurn', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is 1 when no drafts exist yet', async () => {
    stubSelectSequence([[{ maxTurn: null }]])
    const { nextConversationTurn } =
      await import('../aiTicketDraftTrigger.service')
    await expect(nextConversationTurn(1)).resolves.toBe(1)
  })

  it('is one more than the highest existing turn', async () => {
    stubSelectSequence([[{ maxTurn: 2 }]])
    const { nextConversationTurn } =
      await import('../aiTicketDraftTrigger.service')
    await expect(nextConversationTurn(1)).resolves.toBe(3)
  })
})

describe('triggerAiTicketDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.triggerAiTicketAgent.mockResolvedValue(true)
  })

  it('does nothing when the ticket no longer exists', async () => {
    stubSelectSequence([[]])
    const inserts = captureInserts()
    const { triggerAiTicketDraft } =
      await import('../aiTicketDraftTrigger.service')

    await triggerAiTicketDraft({ ticketId: 404 })

    expect(inserts).toHaveLength(0)
    expect(hoisted.triggerAiTicketAgent).not.toHaveBeenCalled()
  })

  it('inserts a generating draft and triggers the agent with the full history', async () => {
    stubSelectSequence([
      [TICKET_ROW],
      [
        { authorId: 9, message: 'my video is broken again' },
        { authorId: 77, message: 'looking into it' },
      ],
      [{ maxTurn: 1 }],
    ])
    const inserts = captureInserts(42)
    const { triggerAiTicketDraft } =
      await import('../aiTicketDraftTrigger.service')

    await triggerAiTicketDraft({ ticketId: 1 })

    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({
      ticketId: 1,
      conversationTurn: 2,
      generatedMessage: '',
      status: 'generating',
    })
    expect(typeof inserts[0].workflowRunId).toBe('string')
    expect(inserts[0].workflowRunId.length).toBeGreaterThan(0)

    expect(hoisted.triggerAiTicketAgent).toHaveBeenCalledWith({
      ticketId: 1,
      conversationTurn: 2,
      workflowRunId: inserts[0].workflowRunId,
      userId: 9,
      batchId: 10,
      entityId: 500,
      category: 'lecture',
      messages: [
        { role: 'user', content: 'my video is broken' },
        { role: 'user', content: 'my video is broken again' },
        { role: 'assistant', content: 'looking into it' },
      ],
    })
    expect(hoisted.sendFallbackForDraft).not.toHaveBeenCalled()
  })

  it('defaults batchId/entityId to 0 when the ticket has none on record', async () => {
    stubSelectSequence([[{ ...TICKET_ROW, data: {} }], [], [{ maxTurn: null }]])
    captureInserts(1)
    const { triggerAiTicketDraft } =
      await import('../aiTicketDraftTrigger.service')

    await triggerAiTicketDraft({ ticketId: 1 })

    expect(hoisted.triggerAiTicketAgent).toHaveBeenCalledWith(
      expect.objectContaining({ batchId: 0, entityId: 0 }),
    )
  })

  it('resolves the fallback immediately when the agent trigger is not accepted', async () => {
    stubSelectSequence([[TICKET_ROW], [], [{ maxTurn: null }]])
    captureInserts(42)
    hoisted.triggerAiTicketAgent.mockResolvedValue(false)
    const { triggerAiTicketDraft } =
      await import('../aiTicketDraftTrigger.service')

    await triggerAiTicketDraft({ ticketId: 1 })

    expect(hoisted.sendFallbackForDraft).toHaveBeenCalledWith({
      id: 42,
      ticketId: 1,
      conversationTurn: 1,
    })
  })

  it('never throws — logs and swallows any internal failure', async () => {
    hoisted.dbSelect.mockImplementation(() => {
      throw new Error('db down')
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { triggerAiTicketDraft } =
      await import('../aiTicketDraftTrigger.service')

    await expect(triggerAiTicketDraft({ ticketId: 1 })).resolves.toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()
  })
})
