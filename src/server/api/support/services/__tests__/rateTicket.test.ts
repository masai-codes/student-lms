/**
 * Covers rating + student feedback persistence on `tickets.meta.student_feedback`.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  updateSet: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

vi.mock('@/server/api/support/ticketCapabilities', () => ({
  getTicketCapabilities: vi.fn().mockReturnValue({
    canReply: false,
    canRate: true,
    canReopen: false,
    canEscalate: false,
  }),
}))

function mockOwnedTicket(overrides: Record<string, unknown> = {}) {
  const ticket = {
    id: 99,
    userId: 1,
    status: 'resolved',
    rating: 0,
    meta: { escalation_count: 1 },
    ...overrides,
  }
  hoisted.dbSelect.mockReturnValue({
    from: () => ({
      where: () => Promise.resolve([ticket]),
    }),
  })
  return ticket
}

function captureUpdate() {
  const calls: Array<Record<string, unknown>> = []
  hoisted.updateSet.mockImplementation((values: Record<string, unknown>) => {
    calls.push(values)
    return {
      where: () => Promise.resolve([{ affectedRows: 1 }]),
    }
  })
  hoisted.dbUpdate.mockReturnValue({
    set: hoisted.updateSet,
  })
  return calls
}

describe('rateTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores rating and student_feedback (pills + comment) on tickets.meta', async () => {
    mockOwnedTicket()
    const updates = captureUpdate()
    const { rateTicket } = await import('../tickets.write.service')

    await rateTicket({
      userId: 1,
      ticketId: 99,
      rating: 5,
      reasons: ['Quick resolution', 'Helpful support'],
      comment: 'Super clear answer, thanks!',
    })

    expect(updates).toHaveLength(1)
    expect(updates[0].rating).toBe(5)
    expect(updates[0].meta).toMatchObject({
      escalation_count: 1,
      student_feedback: {
        reasons: ['Quick resolution', 'Helpful support'],
        comment: 'Super clear answer, thanks!',
      },
    })
    expect(
      (updates[0].meta as { student_feedback: { submittedAt: string } })
        .student_feedback.submittedAt,
    ).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('trims empty reasons/comment and still writes student_feedback', async () => {
    mockOwnedTicket({ meta: null })
    const updates = captureUpdate()
    const { rateTicket } = await import('../tickets.write.service')

    await rateTicket({
      userId: 1,
      ticketId: 99,
      rating: 1,
      reasons: ['  ', 'Slow response', ''],
      comment: '   ',
    })

    expect(updates[0].meta).toMatchObject({
      student_feedback: {
        reasons: ['Slow response'],
        comment: '',
      },
    })
  })

  it('writes empty feedback arrays when reasons/comment omitted', async () => {
    mockOwnedTicket({ meta: {} })
    const updates = captureUpdate()
    const { rateTicket } = await import('../tickets.write.service')

    await rateTicket({
      userId: 1,
      ticketId: 99,
      rating: 5,
    })

    expect(updates[0].meta).toMatchObject({
      student_feedback: {
        reasons: [],
        comment: '',
      },
    })
  })
})
