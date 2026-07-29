import { describe, expect, it } from 'vitest'
import {
  appendInfoLog,
  parseTicketInfo,
  patchEscalationAudit,
  patchReopenAudit,
} from '../ticketInfo.service'

describe('ticketInfo.service', () => {
  it('parseTicketInfo returns empty object for null', () => {
    expect(parseTicketInfo(null)).toEqual({})
  })

  it('appendInfoLog preserves existing log and adds newline', () => {
    expect(appendInfoLog({ log: 'line one\n' }, 'line two')).toEqual({
      log: 'line one\nline two\n',
    })
  })

  it('patchEscalationAudit appends legacy lines and logstamps', () => {
    const result = patchEscalationAudit({
      info: { log: 'created.\n' },
      logstamps: { L1_assigned_at: '2026-07-29 19:00:00' },
      meta: { escalation_count: 1 },
      now: '2026-07-29 19:10:00',
      fromLevel: 'l1',
      toLevel: 'l2',
      currentAssigneeId: 62245,
      nextAssigneeId: 131,
      nextAssigneeLabel: 'admin@masai.com (131) - Admin',
    })

    expect(result.info.log).toContain('Ticket status changed to re-opened')
    expect(result.info.log).toContain('Ticket escalated from L1 to L2')
    expect(result.info.log).toContain(
      'Escalated to L2 -> admin@masai.com (131) - Admin.',
    )
    expect(result.logstamps).toMatchObject({
      reopened_at: '2026-07-29 19:10:00',
      escalated_to_l2_at: '2026-07-29 19:10:00',
      previous_assignee_id: 62245,
      new_assignee_id: 131,
    })
    expect(result.meta.escalation_count).toBe(2)
  })

  it('patchReopenAudit tracks reopen counts in meta and log', () => {
    const first = patchReopenAudit({
      info: { log: 'created.\n' },
      logstamps: {},
      meta: {},
      now: '2026-07-29 19:15:00',
      status: 'resolved',
      assigneeId: 62245,
    })

    expect(first.info.log).toContain(
      'student has requested to reopen the ticket.',
    )
    expect(first.info.log).toContain(
      'Ticket reopened for the 1st time (1st time with assignee_id: 62245)',
    )
    expect(first.meta.reopen_count).toBe(1)

    const second = patchReopenAudit({
      info: first.info,
      logstamps: first.logstamps,
      meta: first.meta,
      now: '2026-07-29 19:20:00',
      status: 'closed',
      assigneeId: 62245,
    })

    expect(second.info.log).toContain(
      'Ticket is being reopened from closed status.',
    )
    expect(second.info.log).toContain(
      'Ticket reopened for the 2nd time (2nd time with assignee_id: 62245)',
    )
    expect(second.logstamps.reopened_at_2).toBe('2026-07-29 19:20:00')
  })
})
