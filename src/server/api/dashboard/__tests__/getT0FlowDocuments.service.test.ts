import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getT0FlowDocuments } from '../getT0FlowDocuments.service'

const hoisted = vi.hoisted(() => ({ selectRows: [] as Array<Record<string, unknown>>, execute: vi.fn(), status: vi.fn(), buildRedirect: vi.fn() }))

vi.mock('@/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve(hoisted.selectRows) }) }) }),
    execute: hoisted.execute,
  },
}))
vi.mock('@/server/admissions/getAdmissionsStudentStatus', () => ({ getAdmissionsStudentStatus: hoisted.status }))
vi.mock('@/server/admissions/buildAdmissionsRedirectForUser', () => ({ buildAdmissionsRedirectForUser: hoisted.buildRedirect }))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.selectRows = [{ username: 'riya1' }]
  hoisted.execute.mockResolvedValue([{ payment_url: 'https://pay/x' }])
  hoisted.buildRedirect.mockResolvedValue('https://sso/docs')
})

describe('getT0FlowDocuments', () => {
  it('reports uploaded/verified from the admissions API + an SSO upload link', async () => {
    hoisted.status.mockResolvedValue({ documents: { documentsUploaded: true, documentsVerified: false } })
    const result = await getT0FlowDocuments(1, 5)
    expect(result).toEqual({ documentsUploaded: true, documentsVerified: false, admissionsFormUrl: 'https://sso/docs' })
    expect(hoisted.status).toHaveBeenCalledWith('riya1', 'documents')
    expect(hoisted.buildRedirect).toHaveBeenCalledWith(1, 'https://pay/x')
  })

  it('degrades to not-uploaded when the admissions API is unavailable', async () => {
    hoisted.status.mockResolvedValue(null)
    const result = await getT0FlowDocuments(1, 5)
    expect(result.documentsUploaded).toBe(false)
    expect(result.documentsVerified).toBe(false)
    expect(result.admissionsFormUrl).toBe('https://sso/docs') // still built for the redirect
  })
})
