import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  dbInsert: vi.fn(),
  buildFirstTemplateResponse: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.dbSelect,
    update: hoisted.dbUpdate,
    insert: hoisted.dbInsert,
  },
}))
vi.mock('@/server/api/support/services/ticketReplyTemplate', () => ({
  buildFirstTemplateResponse: hoisted.buildFirstTemplateResponse,
}))

function stubSelect(rows: Array<Record<string, any>>) {
  hoisted.dbSelect.mockReturnValue({
    from: () => ({ where: () => Promise.resolve(rows) }),
  })
}

function captureUpdates() {
  const calls: Array<Record<string, any>> = []
  hoisted.dbUpdate.mockReturnValue({
    set: (v: Record<string, any>) => {
      calls.push(v)
      return { where: () => Promise.resolve() }
    },
  })
  return calls
}

function captureInserts(insertId = 555) {
  const calls: Array<Record<string, any>> = []
  hoisted.dbInsert.mockReturnValue({
    values: (v: Record<string, any>) => {
      calls.push(v)
      return Promise.resolve([{ insertId }])
    },
  })
  return calls
}

describe('sendFallbackForDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.buildFirstTemplateResponse.mockResolvedValue({
      message: 'template reply',
      displayName: 'Program Co-ordinator',
    })
  })

  it('turn 1: inserts the templated first-response comment and backfills sentCommentId', async () => {
    stubSelect([
      { data: { batch_id: '10' }, category: 'lecture', assigneeId: 77 },
    ])
    const updates = captureUpdates()
    const inserts = captureInserts(555)
    const { sendFallbackForDraft } =
      await import('../aiTicketDraftFallback.service')

    await sendFallbackForDraft({ id: 5, ticketId: 1, conversationTurn: 1 })

    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({
      ticketId: 1,
      userId: 77,
      message: 'template reply',
      public: 1,
      data: {
        firstTemplateResponse: true,
        ticket_level: 'l1',
        displayName: 'Program Co-ordinator',
      },
    })
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ sentCommentId: 555 })
  })

  it('turn 1: logs and skips when the ticket is gone, without throwing', async () => {
    stubSelect([])
    const inserts = captureInserts()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { sendFallbackForDraft } =
      await import('../aiTicketDraftFallback.service')

    await expect(
      sendFallbackForDraft({ id: 5, ticketId: 404, conversationTurn: 1 }),
    ).resolves.toBeUndefined()
    expect(inserts).toHaveLength(0)
    expect(errorSpy).toHaveBeenCalled()
  })

  it('turn > 1, default markFailed: sends no comment, only marks the draft failed', async () => {
    const updates = captureUpdates()
    const inserts = captureInserts()
    const { sendFallbackForDraft } =
      await import('../aiTicketDraftFallback.service')

    await sendFallbackForDraft({ id: 5, ticketId: 1, conversationTurn: 2 })

    expect(inserts).toHaveLength(0)
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ status: 'failed' })
    expect(updates[0]).not.toHaveProperty('sentCommentId')
  })

  it('turn > 1, markFailed: false: is a true no-op (webhook already wrote agent_response)', async () => {
    const updates = captureUpdates()
    const inserts = captureInserts()
    const { sendFallbackForDraft } =
      await import('../aiTicketDraftFallback.service')

    await sendFallbackForDraft(
      { id: 5, ticketId: 1, conversationTurn: 2 },
      { markFailed: false },
    )

    expect(inserts).toHaveLength(0)
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
    expect(updates).toHaveLength(0)
  })
})
