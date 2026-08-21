import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  dbUpdate: vi.fn(),
  triggerAiTicketDraft: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.dbSelect,
    insert: hoisted.dbInsert,
    update: hoisted.dbUpdate,
  },
}))
vi.mock('@/server/api/support/services/aiTicketDraftTrigger.service', () => ({
  triggerAiTicketDraft: hoisted.triggerAiTicketDraft,
}))

const OWNED_OPEN_TICKET = {
  id: 1,
  userId: 5,
  status: 'open',
  rating: 0,
}

function stubOwnedTicket(row: Record<string, any> | null) {
  hoisted.dbSelect.mockReturnValue({
    from: () => ({ where: () => Promise.resolve(row ? [row] : []) }),
  })
}

function captureInserts(insertId = 77) {
  const calls: Array<Record<string, any>> = []
  hoisted.dbInsert.mockReturnValue({
    values: (v: Record<string, any>) => {
      calls.push(v)
      return Promise.resolve([{ insertId }])
    },
  })
  return calls
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

describe('addReply', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.triggerAiTicketDraft.mockResolvedValue(undefined)
  })

  it('inserts the reply, bumps the ticket, and triggers the AI draft for this turn', async () => {
    stubOwnedTicket(OWNED_OPEN_TICKET)
    const inserts = captureInserts(77)
    const updates = captureUpdates()
    const { addReply } = await import('../tickets.write.service')

    const result = await addReply({
      userId: 5,
      ticketId: 1,
      message: 'still broken',
    })

    expect(result).toEqual({ id: 77 })
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({
      ticketId: 1,
      userId: 5,
      message: 'still broken',
      public: 1,
    })
    expect(updates).toHaveLength(1)
    expect(hoisted.triggerAiTicketDraft).toHaveBeenCalledWith({ ticketId: 1 })
  })

  it('rejects an empty message before touching the DB', async () => {
    const { addReply } = await import('../tickets.write.service')

    await expect(
      addReply({ userId: 5, ticketId: 1, message: '   ' }),
    ).rejects.toThrow('SUPPORT_MESSAGE_REQUIRED')
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
    expect(hoisted.triggerAiTicketDraft).not.toHaveBeenCalled()
  })

  it('rejects a reply on a ticket the student does not own', async () => {
    stubOwnedTicket(null)
    const { addReply } = await import('../tickets.write.service')

    await expect(
      addReply({ userId: 5, ticketId: 404, message: 'hi' }),
    ).rejects.toThrow('SUPPORT_TICKET_NOT_FOUND')
    expect(hoisted.triggerAiTicketDraft).not.toHaveBeenCalled()
  })

  it('rejects a reply when the ticket is resolved (no longer live)', async () => {
    stubOwnedTicket({ ...OWNED_OPEN_TICKET, status: 'resolved' })
    const { addReply } = await import('../tickets.write.service')

    await expect(
      addReply({ userId: 5, ticketId: 1, message: 'hi' }),
    ).rejects.toThrow('SUPPORT_REPLY_NOT_ALLOWED')
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
    expect(hoisted.triggerAiTicketDraft).not.toHaveBeenCalled()
  })
})
