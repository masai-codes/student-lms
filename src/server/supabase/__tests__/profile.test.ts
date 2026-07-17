import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { updateProfileAvatarByEmail } from '../profile'

const hoisted = vi.hoisted(() => ({ fetch: vi.fn() }))

const ORIGINAL_ENV = { ...process.env }
const ORIGINAL_FETCH = global.fetch

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = hoisted.fetch
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  global.fetch = ORIGINAL_FETCH
})

describe('updateProfileAvatarByEmail', () => {
  it('calls the RPC with the email + avatar url and returns its result', async () => {
    hoisted.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    })

    const result = await updateProfileAvatarByEmail(
      'a@b.com',
      'https://s3/pic.jpg',
    )

    expect(hoisted.fetch).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/rpc/update_profile_avatar_by_email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: 'service-key',
          Authorization: 'Bearer service-key',
        }),
        body: JSON.stringify({
          p_user_email: 'a@b.com',
          p_avatar_url: 'https://s3/pic.jpg',
        }),
      }),
    )
    expect(result).toEqual({ data: { ok: true }, error: null })
  })

  it('returns an error (never throws) when Supabase env is missing', async () => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const result = await updateProfileAvatarByEmail(
      'a@b.com',
      'https://s3/pic.jpg',
    )

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(hoisted.fetch).not.toHaveBeenCalled()
  })

  it('returns an error (never throws) when the RPC responds with a non-2xx status', async () => {
    hoisted.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'function not found' }),
    })

    const result = await updateProfileAvatarByEmail(
      'a@b.com',
      'https://s3/pic.jpg',
    )

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect((result.error as Error).message).toBe('function not found')
  })
})
