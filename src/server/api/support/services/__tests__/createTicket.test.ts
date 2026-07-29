/**
 * Regression cover for the two columns `createTicket` used to drop on the floor.
 *
 * `tickets.created_at` / `updated_at` are `TIMESTAMP(0) NULL` with no DB
 * default, and `data.entity_id` is the only record of which lecture /
 * assignment / resource a ticket was raised from. Both were silently missing
 * from every ticket the new LMS created.
 *
 * The `data` key names are asserted verbatim: they must stay byte-identical to
 * the legacy web payload (old-LMS AssignmentCreateTicketModal → GraphQL
 * `createTicketV2`) or the admin ticket filters stop matching.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  buildFirstTemplateResponse: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, insert: hoisted.dbInsert },
}))
vi.mock('@/server/api/support/services/ticketReplyTemplate', () => ({
  buildFirstTemplateResponse: hoisted.buildFirstTemplateResponse,
}))
vi.mock('@/server/api/support/services/directory.service', () => ({
  getActiveSectionNames: vi.fn().mockResolvedValue([]),
}))
vi.mock(
  '@/server/api/support/services/fetchEntityTitleForTicket.service',
  () => ({
    fetchEntityTitleForTicket: vi.fn().mockResolvedValue(null),
  }),
)
vi.mock('@/server/api/support/services/generateTicketTitle.service', () => ({
  resolveTicketTitle: vi
    .fn()
    .mockResolvedValue({ title: 'Support request', source: 'fallback' }),
}))

/** Queue one `select().from().where()` chain resolving to `rows`. */
function mockSelect(rows: Array<unknown>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => Promise.resolve(rows) }),
  })
}

/** Capture every `insert().values()` payload in call order. */
function captureInserts() {
  const calls: Array<Record<string, any>> = []
  hoisted.dbInsert.mockReturnValue({
    values: (v: Record<string, any>) => {
      calls.push(v)
      return Promise.resolve([{ insertId: 4242 }])
    },
  })
  return calls
}

const MYSQL_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

describe('createTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.buildFirstTemplateResponse.mockResolvedValue({
      message: 'template',
      displayName: 'Program Co-ordinator',
    })
  })

  it('stores created_at / updated_at as IST wall-clock, never NULL', async () => {
    mockSelect([{ settings: { opsPC: { l1: 77 } } }]) // resolveInitialAssignee
    const inserts = captureInserts()
    const { createTicket } = await import('../tickets.write.service')

    const before = Date.now()
    await createTicket({
      userId: 1,
      batchId: 10,
      category: 'lecture',
      message: 'my video is broken',
    })

    const ticket = inserts[0]
    expect(ticket.createdAt).toMatch(MYSQL_DATETIME)
    expect(ticket.updatedAt).toBe(ticket.createdAt)

    // IST wall-clock == UTC + 5:30, matching legacy `getCurrentTime()`. The
    // lower bound allows one second of slack: the column is TIMESTAMP(0), so
    // the formatter truncates (never rounds) sub-second precision.
    const stored = Date.parse(`${ticket.createdAt.replace(' ', 'T')}Z`)
    const skew = stored - (before + 5.5 * 60 * 60 * 1000)
    expect(skew).toBeGreaterThan(-1_000)
    expect(skew).toBeLessThan(5_000)
  })

  it('writes the legacy data payload verbatim, entity included', async () => {
    mockSelect([{ settings: { opsPC: { l1: 77 } } }])
    const inserts = captureInserts()
    const { createTicket } = await import('../tickets.write.service')

    await createTicket({
      userId: 1,
      batchId: 10,
      category: 'lecture',
      subCategory: 'video-not-playing',
      message: 'my video is broken',
      entityId: 98765,
    })

    expect(inserts[0].data).toMatchObject({
      batch_id: '10', // string: legacy `CreateTicketV2Input.batch_id: String!`
      subCategory: 'video-not-playing',
      help_faq_question: true,
      entity_id: 98765,
    })
    expect(inserts[0].data['active-sections']).toEqual([])
    expect(inserts[0].data.workflow_id).toMatch(/^ticket-/)
    expect(inserts[0].data.title_source).toBe('fallback')
  })

  it('omits entity_id, and defaults subCategory to "", outside an entity page', async () => {
    mockSelect([{ settings: { opsPC: { l1: 77 } } }])
    const inserts = captureInserts()
    const { createTicket } = await import('../tickets.write.service')

    await createTicket({
      userId: 1,
      batchId: 10,
      category: 'support',
      message: 'general query',
    })

    expect(inserts[0].data).toMatchObject({
      batch_id: '10',
      subCategory: '', // legacy sends `normalizedSubcategory || ''`, never null
      help_faq_question: true,
    })
    expect(inserts[0].data).not.toHaveProperty('entity_id')
    expect(inserts[0].data['active-sections']).toEqual([])
  })

  it('includes question_id only for FAQ-originated tickets', async () => {
    mockSelect([{ settings: { opsPC: { l1: 77 } } }])
    const inserts = captureInserts()
    const { createTicket } = await import('../tickets.write.service')

    await createTicket({
      userId: 1,
      batchId: 10,
      category: 'support',
      message: 'from an faq',
      questionId: 55,
    })

    expect(inserts[0].data).toMatchObject({ question_id: 55 })
  })

  it('timestamps the first-template comment with the same convention', async () => {
    mockSelect([{ settings: { opsPC: { l1: 77 } } }])
    const inserts = captureInserts()
    const { createTicket } = await import('../tickets.write.service')

    await createTicket({
      userId: 1,
      batchId: 10,
      category: 'lecture',
      message: 'my video is broken',
    })

    const comment = inserts[1]
    expect(comment.ticketId).toBe(4242)
    expect(comment.createdAt).toMatch(MYSQL_DATETIME)
    expect(comment.updatedAt).toMatch(MYSQL_DATETIME)
  })
})
