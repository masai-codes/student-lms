import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  txBox: { current: null as any },
  sendFallbackForDraft: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    transaction: (cb: (tx: any) => Promise<any>) => cb(hoisted.txBox.current),
  },
}))
vi.mock('@/server/api/support/services/aiTicketDraftFallback.service', () => ({
  sendFallbackForDraft: hoisted.sendFallbackForDraft,
}))

/** A `select().from().where()` result that also answers `.for('update')` — covers
 * both the row-locked draft lookup and the plain ticket re-verification lookup. */
function selectable(rows: Array<Record<string, any>>) {
  const promise = Promise.resolve(rows) as Promise<any> & { for: () => any }
  promise.for = () => Promise.resolve(rows)
  return promise
}

function makeTx(rowsByCall: Array<Array<Record<string, any>>>) {
  let call = 0
  const updates: Array<Record<string, any>> = []
  const inserts: Array<Record<string, any>> = []

  const tx = {
    select: vi.fn(() => {
      const rows = rowsByCall[call] ?? []
      call += 1
      return { from: () => ({ where: () => selectable(rows) }) }
    }),
    update: vi.fn(() => ({
      set: (values: Record<string, any>) => ({
        where: () => {
          updates.push(values)
          return Promise.resolve()
        },
      }),
    })),
    insert: vi.fn(() => ({
      values: (values: Record<string, any>) => {
        inserts.push(values)
        return Promise.resolve([{ insertId: 999 }])
      },
    })),
  }
  return { tx, updates, inserts }
}

const DRAFT_ROW = {
  id: 5,
  ticketId: 1,
  conversationTurn: 1,
  workflowRunId: 'wf-1',
  sentCommentId: null as number | null,
}

const BASE_PAYLOAD = {
  ticket_id: 1,
  conversation_turn: 1,
  workflow_run_id: 'wf-1',
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('evaluateAiDraftSendDecision', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('sends the AI answer when ready + answer + a non-empty message', async () => {
    const { evaluateAiDraftSendDecision } =
      await import('../aiTicketCallback.service')
    expect(
      evaluateAiDraftSendDecision({
        status: 'ready',
        draft_kind: 'answer',
        generated_message: 'here is the fix',
      }),
    ).toBe('send_ai')
  })

  it('sends the AI answer for a ready clarifying_question too', async () => {
    const { evaluateAiDraftSendDecision } =
      await import('../aiTicketCallback.service')
    expect(
      evaluateAiDraftSendDecision({
        status: 'ready',
        draft_kind: 'clarifying_question',
        generated_message: 'can you share a screenshot?',
      }),
    ).toBe('send_ai')
  })

  it('falls back when ready but the message is empty/whitespace', async () => {
    const { evaluateAiDraftSendDecision } =
      await import('../aiTicketCallback.service')
    expect(
      evaluateAiDraftSendDecision({
        status: 'ready',
        draft_kind: 'answer',
        generated_message: '   ',
      }),
    ).toBe('send_fallback')
  })

  it('falls back on status failed', async () => {
    const { evaluateAiDraftSendDecision } =
      await import('../aiTicketCallback.service')
    expect(evaluateAiDraftSendDecision({ status: 'failed' })).toBe(
      'send_fallback',
    )
  })

  it('falls back on a handoff regardless of status', async () => {
    const { evaluateAiDraftSendDecision } =
      await import('../aiTicketCallback.service')
    expect(
      evaluateAiDraftSendDecision({ status: 'ready', draft_kind: 'handoff' }),
    ).toBe('send_fallback')
  })

  it('waits when "generating" arrives as a terminal webhook', async () => {
    const { evaluateAiDraftSendDecision } =
      await import('../aiTicketCallback.service')
    expect(
      evaluateAiDraftSendDecision({
        status: 'generating',
        draft_kind: 'answer',
      }),
    ).toBe('wait')
  })

  it('waits on an unrecognized draft_kind', async () => {
    const { evaluateAiDraftSendDecision } =
      await import('../aiTicketCallback.service')
    expect(evaluateAiDraftSendDecision({ status: 'ready' })).toBe('wait')
  })
})

describe('resolveAiTicketDraftCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 404 when no draft matches the (ticket, turn, workflow_run_id)', async () => {
    const { tx } = makeTx([[]])
    hoisted.txBox.current = tx
    const { resolveAiTicketDraftCallback } =
      await import('../aiTicketCallback.service')

    await expect(
      resolveAiTicketDraftCallback({ ...BASE_PAYLOAD, status: 'ready' }),
    ).rejects.toMatchObject({ status: 404, code: 'AI_TICKET_DRAFT_NOT_FOUND' })
  })

  it('is a no-op for a duplicate/late webhook (sentCommentId already set)', async () => {
    const { tx, updates, inserts } = makeTx([
      [{ ...DRAFT_ROW, sentCommentId: 42 }],
    ])
    hoisted.txBox.current = tx
    const { resolveAiTicketDraftCallback } =
      await import('../aiTicketCallback.service')

    const result = await resolveAiTicketDraftCallback({
      ...BASE_PAYLOAD,
      status: 'ready',
      draft_kind: 'answer',
      generated_message: 'too late',
    })

    expect(result).toEqual({ outcome: 'duplicate' })
    expect(updates).toHaveLength(0)
    expect(inserts).toHaveLength(0)
    expect(hoisted.sendFallbackForDraft).not.toHaveBeenCalled()
  })

  it('send_ai: inserts an AI-sourced comment and backfills sentCommentId', async () => {
    const { tx, updates, inserts } = makeTx([
      [DRAFT_ROW],
      [{ id: 1, assigneeId: 77 }],
    ])
    hoisted.txBox.current = tx
    const { resolveAiTicketDraftCallback } =
      await import('../aiTicketCallback.service')

    const result = await resolveAiTicketDraftCallback({
      ...BASE_PAYLOAD,
      status: 'ready',
      draft_kind: 'answer',
      generated_message: 'Here is the answer.',
    })

    expect(result).toEqual({ outcome: 'sent_ai' })
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({
      ticketId: 1,
      userId: 77,
      message: 'Here is the answer.',
      public: 1,
      data: { source: 'ai', aiTicketDraftId: 5 },
    })
    // agent_response update, then the sentCommentId backfill, then ticket.updatedAt.
    expect(updates.some((u) => u.sentCommentId === 999)).toBe(true)
    expect(hoisted.sendFallbackForDraft).not.toHaveBeenCalled()
  })

  it('send_ai but the ticket vanished: skips the comment, does not throw', async () => {
    const { tx, inserts } = makeTx([[DRAFT_ROW], []])
    hoisted.txBox.current = tx
    const { resolveAiTicketDraftCallback } =
      await import('../aiTicketCallback.service')

    const result = await resolveAiTicketDraftCallback({
      ...BASE_PAYLOAD,
      status: 'ready',
      draft_kind: 'answer',
      generated_message: 'Here is the answer.',
    })

    expect(result).toEqual({ outcome: 'ticket_not_found' })
    expect(inserts).toHaveLength(0)
  })

  it('send_fallback: delegates to the shared fallback helper inside the same lock', async () => {
    const { tx } = makeTx([[DRAFT_ROW]])
    hoisted.txBox.current = tx
    const { resolveAiTicketDraftCallback } =
      await import('../aiTicketCallback.service')

    const result = await resolveAiTicketDraftCallback({
      ...BASE_PAYLOAD,
      status: 'failed',
    })

    expect(result).toEqual({ outcome: 'sent_fallback' })
    expect(hoisted.sendFallbackForDraft).toHaveBeenCalledWith(
      { id: 5, ticketId: 1, conversationTurn: 1 },
      { dbOrTx: tx, markFailed: false },
    )
  })

  it('wait: only persists agent_response/status, sends nothing', async () => {
    const { tx, updates, inserts } = makeTx([[DRAFT_ROW]])
    hoisted.txBox.current = tx
    const { resolveAiTicketDraftCallback } =
      await import('../aiTicketCallback.service')

    const result = await resolveAiTicketDraftCallback({
      ...BASE_PAYLOAD,
      status: 'generating',
      draft_kind: 'answer',
    })

    expect(result).toEqual({ outcome: 'waiting' })
    expect(inserts).toHaveLength(0)
    expect(hoisted.sendFallbackForDraft).not.toHaveBeenCalled()
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ status: 'generating' })
  })
})
