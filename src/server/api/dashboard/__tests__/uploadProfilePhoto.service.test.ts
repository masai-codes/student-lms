import { beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadProfilePhoto } from '../uploadProfilePhoto.service'

const hoisted = vi.hoisted(() => ({
  selectRows: [] as Array<Record<string, unknown>>,
  updateSet: vi.fn(),
  insertValues: vi.fn(),
  uploadS3: vi.fn(),
  supabaseAvatar: vi.fn(),
}))

vi.mock('@/server/storage/s3Upload', () => ({
  uploadImageToS3: hoisted.uploadS3,
}))
vi.mock('@/server/supabase/profile', () => ({
  updateProfileAvatarByEmail: hoisted.supabaseAvatar,
}))
vi.mock('@/db', () => {
  const db = {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(hoisted.selectRows) }),
      }),
    }),
    update: () => ({
      set: (values: unknown) => {
        hoisted.updateSet(values)
        return { where: () => Promise.resolve() }
      },
    }),
    insert: () => ({
      values: (values: unknown) => {
        hoisted.insertValues(values)
        return Promise.resolve()
      },
    }),
  }
  return { db }
})

const DATA_URL = 'data:image/jpeg;base64,ZmFrZQ==' // "fake"

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.selectRows = []
  hoisted.uploadS3.mockResolvedValue('https://bucket.s3.amazonaws.com/pic.jpg')
  hoisted.supabaseAvatar.mockResolvedValue({ data: null, error: null })
})

describe('uploadProfilePhoto', () => {
  it('rejects a non-data-URL payload', async () => {
    await expect(uploadProfilePhoto(1, 'not-an-image')).rejects.toMatchObject({
      code: 'INVALID_IMAGE',
    })
    expect(hoisted.uploadS3).not.toHaveBeenCalled()
  })

  it('merges profile_pic into an existing profile, sets profile_photo_path, and syncs Supabase', async () => {
    hoisted.selectRows = [
      { id: 9, meta: { position: 'x' }, email: 'learner@masaischool.com' },
    ]

    const result = await uploadProfilePhoto(42, DATA_URL)

    expect(result.url).toBe('https://bucket.s3.amazonaws.com/pic.jpg')
    // Uploaded the decoded buffer with the right content type.
    expect(hoisted.uploadS3).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/jpeg', ext: 'jpeg' }),
    )
    // profiles.meta merged (keeps existing keys) + users.profile_photo_path set.
    expect(hoisted.updateSet).toHaveBeenCalledWith({
      meta: { position: 'x', profile_pic: result.url },
    })
    expect(hoisted.updateSet).toHaveBeenCalledWith({
      profilePhotoPath: result.url,
    })
    expect(hoisted.insertValues).not.toHaveBeenCalled()
    // Best-effort Supabase avatar sync by email.
    expect(hoisted.supabaseAvatar).toHaveBeenCalledWith(
      'learner@masaischool.com',
      result.url,
    )
  })

  it('skips the Supabase sync when the user has no email', async () => {
    hoisted.selectRows = [{ id: 9, meta: {} }]
    await uploadProfilePhoto(42, DATA_URL)
    expect(hoisted.supabaseAvatar).not.toHaveBeenCalled()
  })

  it('creates the profile row when none exists', async () => {
    hoisted.selectRows = []

    const result = await uploadProfilePhoto(42, DATA_URL)

    expect(hoisted.insertValues).toHaveBeenCalledWith({
      userId: 42,
      meta: { profile_pic: result.url },
    })
    expect(hoisted.updateSet).toHaveBeenCalledWith({
      profilePhotoPath: result.url,
    })
  })
})
