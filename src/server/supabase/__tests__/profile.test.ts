import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { updateProfileAvatarByEmail } from '../profile'

const hoisted = vi.hoisted(() => ({ rpc: vi.fn(), createClient: vi.fn() }))

vi.mock('@supabase/supabase-js', () => ({ createClient: hoisted.createClient }))

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.createClient.mockReturnValue({ rpc: hoisted.rpc })
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('updateProfileAvatarByEmail', () => {
  it('calls the RPC with the email + avatar url and returns its result', async () => {
    hoisted.rpc.mockResolvedValue({ data: { ok: true }, error: null })

    const result = await updateProfileAvatarByEmail(
      'a@b.com',
      'https://s3/pic.jpg',
    )

    expect(hoisted.rpc).toHaveBeenCalledWith('update_profile_avatar_by_email', {
      p_user_email: 'a@b.com',
      p_avatar_url: 'https://s3/pic.jpg',
    })
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
    expect(hoisted.rpc).not.toHaveBeenCalled()
  })
})
