import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildAdmissionsRedirectForUser } from '../buildAdmissionsRedirectForUser'

const hoisted = vi.hoisted(() => ({ userRows: [] as Array<Record<string, unknown>>, profileRows: [] as Array<Record<string, unknown>>, buildUrl: vi.fn() }))

vi.mock('@/db', () => {
  let call = 0
  return {
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve(call++ === 0 ? hoisted.userRows : hoisted.profileRows),
          }),
        }),
      }),
    },
  }
})
vi.mock('../createAdmissionsSsoToken', () => ({ buildAdmissionsSsoUrl: hoisted.buildUrl }))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.userRows = [{ id: 1, name: 'Riya', email: 'r@x.com', mobile: '9', }]
  hoisted.profileRows = [{ meta: { profile_pic: 'https://a/p.jpg' } }]
  hoisted.buildUrl.mockReturnValue('https://sso/link')
})

describe('buildAdmissionsRedirectForUser', () => {
  it('builds an SSO url from the user + avatar', async () => {
    const url = await buildAdmissionsRedirectForUser(1, 'https://redirect')
    expect(url).toBe('https://sso/link')
    expect(hoisted.buildUrl).toHaveBeenCalledWith(
      expect.objectContaining({ userId: '1', name: 'Riya', email: 'r@x.com', platform: 'LMS', avatar: 'https://a/p.jpg' }),
      'https://redirect',
    )
  })

  it('returns null when the SSO signer throws (unconfigured)', async () => {
    hoisted.buildUrl.mockImplementation(() => { throw new Error('ADMISSIONS_SSO_SECRET is not configured') })
    expect(await buildAdmissionsRedirectForUser(1, 'https://redirect')).toBeNull()
  })
})
