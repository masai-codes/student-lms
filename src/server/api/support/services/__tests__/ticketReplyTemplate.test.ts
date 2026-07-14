import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

/** Queue one `select().from().where()` chain resolving to `rows`. */
function mockSelect(rows: Array<unknown>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => Promise.resolve(rows) }),
  })
}

describe('buildFirstTemplateResponse', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the ops L1 fallback title and the legacy body for a non-assignment ticket', async () => {
    mockSelect([{ settings: {} }]) // batch settings
    const { buildFirstTemplateResponse } =
      await import('../ticketReplyTemplate')

    const { message, displayName } = await buildFirstTemplateResponse({
      batchId: 10,
      category: 'lecture',
      assigneeId: 5,
    })

    expect(displayName).toBe('Program Co-ordinator')
    expect(message).toContain('Dear Student,')
    expect(message).toContain('Our team will get back to you within 48 hours.')
    expect(message).toContain(
      'Regards,<br/>Program Co-ordinator<br/>Student Experience Team',
    )
    // No phone configured → no phone line.
    expect(message).not.toMatch(/Regards,<br\/>Program Co-ordinator<br\/>\+?\d/)
  })

  it('uses the curriculum title and never a phone for assignment-track tickets', async () => {
    mockSelect([{ settings: { phNumbers: { ph_l1: '99999' } } }])
    const { buildFirstTemplateResponse } =
      await import('../ticketReplyTemplate')

    const { message, displayName } = await buildFirstTemplateResponse({
      batchId: 10,
      category: 'assignment',
      assigneeId: 5,
    })

    expect(displayName).toBe('Curriculum Co-ordinator')
    expect(message).toContain(
      'Regards,<br/>Curriculum Co-ordinator<br/>Student Experience Team',
    )
    expect(message).not.toContain('99999')
  })

  it('prefers the batch opsRoleTitles override and includes the L1 phone', async () => {
    mockSelect([
      {
        settings: {
          opsRoleTitles: { l1: 'Batch Buddy' },
          phNumbers: { ph_l1: '1800-123' },
        },
      },
    ])
    const { buildFirstTemplateResponse } =
      await import('../ticketReplyTemplate')

    const { message, displayName } = await buildFirstTemplateResponse({
      batchId: 10,
      category: 'doubt',
      assigneeId: 5,
    })

    expect(displayName).toBe('Batch Buddy')
    expect(message).toContain(
      'Regards,<br/>Batch Buddy<br/>1800-123<br/>Student Experience Team',
    )
  })

  it('uses the assignee name when showAdminNameInTicketReply is set', async () => {
    mockSelect([{ settings: { showAdminNameInTicketReply: true } }]) // batch
    mockSelect([{ name: '  Asha Rao  ' }]) // assignee
    const { buildFirstTemplateResponse } =
      await import('../ticketReplyTemplate')

    const { displayName, message } = await buildFirstTemplateResponse({
      batchId: 10,
      category: 'lecture',
      assigneeId: 5,
    })

    expect(displayName).toBe('Asha Rao')
    expect(message).toContain(
      'Regards,<br/>Asha Rao<br/>Student Experience Team',
    )
  })
})
