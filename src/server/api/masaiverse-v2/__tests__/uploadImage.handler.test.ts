import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  uploadImageToS3: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/storage/s3Upload', () => ({
  uploadImageToS3: hoisted.uploadImageToS3,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
}))

function uploadRequest(form: FormData | undefined, cookie: string | null): Request {
  return new Request('http://localhost/api/masaiverse-v2/uploads/image', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
    body: form,
  })
}

function formWith(file: File): FormData {
  const form = new FormData()
  form.append('file', file)
  return form
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleUploadImage', () => {
  it('uploads a valid image and returns its url (201)', async () => {
    const { handleUploadImage } = await import('../handlers/uploadImage.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.uploadImageToS3.mockResolvedValueOnce('https://bucket.s3.amazonaws.com/x.png')
    const file = new File([new Uint8Array([1, 2, 3])], 'pic.png', { type: 'image/png' })

    const response = await handleUploadImage(uploadRequest(formWith(file), 'session=abc'))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      url: 'https://bucket.s3.amazonaws.com/x.png',
    })
    expect(hoisted.uploadImageToS3).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/png', ext: 'png' }),
    )
  })

  it('returns 401 without a session', async () => {
    const { handleUploadImage } = await import('../handlers/uploadImage.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)
    const file = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })

    const response = await handleUploadImage(uploadRequest(formWith(file), null))
    expect(response.status).toBe(401)
    expect(hoisted.uploadImageToS3).not.toHaveBeenCalled()
  })

  it('400s when no file is present', async () => {
    const { handleUploadImage } = await import('../handlers/uploadImage.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)

    const response = await handleUploadImage(uploadRequest(new FormData(), 'session=abc'))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ code: 'UPLOAD_NO_FILE' })
  })

  it('400s for a non-image file', async () => {
    const { handleUploadImage } = await import('../handlers/uploadImage.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    const file = new File([new Uint8Array([1])], 'a.txt', { type: 'text/plain' })

    const response = await handleUploadImage(uploadRequest(formWith(file), 'session=abc'))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'UPLOAD_INVALID_FILE_TYPE',
    })
  })

  it('400s for a file over the size limit', async () => {
    const { handleUploadImage } = await import('../handlers/uploadImage.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    const big = new File([new Uint8Array(11 * 1024 * 1024)], 'big.png', {
      type: 'image/png',
    })

    const response = await handleUploadImage(uploadRequest(formWith(big), 'session=abc'))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'UPLOAD_FILE_TOO_LARGE',
    })
  })

  it('maps an unexpected upload failure to a 500 error', async () => {
    const { handleUploadImage } = await import('../handlers/uploadImage.handler')
    hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(9)
    hoisted.uploadImageToS3.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const file = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })

    const response = await handleUploadImage(uploadRequest(formWith(file), 'session=abc'))
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_UPLOADING_IMAGE',
    })
    consoleSpy.mockRestore()
  })
})
