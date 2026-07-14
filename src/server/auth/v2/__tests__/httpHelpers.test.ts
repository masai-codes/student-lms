import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BadRequestError,
  errorResponse,
  readJsonBody,
  withAuthErrorHandling,
} from '../httpHelpers'
import { resolveTrueStatus } from '@/lib/api/cloudFrontSafeStatus'

async function readBody(
  res: Response,
): Promise<{ error: { code: string; message: string } }> {
  return (await res.json()) as { error: { code: string; message: string } }
}

describe('errorResponse', () => {
  it('builds a structured JSON error body with the given status', async () => {
    const res = errorResponse(404, 'USER_NOT_FOUND', 'No account here')

    // 404 is CloudFront-intercepted, so it ships on the safe wire status (422)
    // with the true status restored from the header.
    expect(res.status).toBe(422)
    expect(resolveTrueStatus(res)).toBe(404)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    await expect(readBody(res)).resolves.toEqual({
      error: { code: 'USER_NOT_FOUND', message: 'No account here' },
    })
  })
})

describe('readJsonBody', () => {
  it('parses a valid JSON request body', async () => {
    const request = new Request('http://test/local', {
      method: 'POST',
      body: JSON.stringify({ identifier: '9999999999' }),
    })

    await expect(
      readJsonBody<{ identifier: string }>(request),
    ).resolves.toEqual({
      identifier: '9999999999',
    })
  })

  it('throws a BadRequestError(INVALID_JSON) for a malformed body', async () => {
    const request = new Request('http://test/local', {
      method: 'POST',
      body: 'not-json{',
    })

    await expect(readJsonBody(request)).rejects.toBeInstanceOf(BadRequestError)
    await readJsonBody(
      new Request('http://test/local', { method: 'POST', body: '{' }),
    ).catch((err) => {
      expect(err).toMatchObject({ code: 'INVALID_JSON' })
    })
  })
})

describe('withAuthErrorHandling', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('passes a successful handler response through untouched', async () => {
    const ok = errorResponse(200, 'OK', 'fine') // any Response works
    const wrapped = withAuthErrorHandling('test', async () => ok)

    const res = await wrapped({ request: new Request('http://test/local') })

    expect(res).toBe(ok)
  })

  it('converts a thrown BadRequestError into a 400 with its code/message', async () => {
    const wrapped = withAuthErrorHandling('test', async () => {
      throw new BadRequestError('MISSING_FIELDS', 'identifier is required')
    })

    const res = await wrapped({ request: new Request('http://test/local') })

    expect(res.status).toBe(400)
    await expect(readBody(res)).resolves.toEqual({
      error: { code: 'MISSING_FIELDS', message: 'identifier is required' },
    })
  })

  it('never leaks a raw error: unexpected throws become a generic 500', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const rawDbError = new Error(
      "ER_NO_SUCH_TABLE: Table 'lms.users' doesn't exist",
    )
    const wrapped = withAuthErrorHandling('request-otp', async () => {
      throw rawDbError
    })

    const res = await wrapped({ request: new Request('http://test/local') })

    expect(res.status).toBe(500)
    const body = await readBody(res)
    expect(body.error.code).toBe('UNEXPECTED_ERROR')
    expect(body.error.message).toBe(
      'Something went wrong on our end. Please try again in a moment.',
    )
    // The raw DB detail must not reach the client...
    expect(body.error.message).not.toContain('ER_NO_SUCH_TABLE')
    // ...but it must be logged server-side for ops.
    expect(errorSpy).toHaveBeenCalledWith(
      '[auth:request-otp] unexpected error:',
      rawDbError,
    )
  })

  it('treats a thrown non-Error value (e.g. null) as an unexpected 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapped = withAuthErrorHandling('verify-otp', async () => {
      throw null
    })

    const res = await wrapped({ request: new Request('http://test/local') })

    expect(res.status).toBe(500)
    await expect(readBody(res)).resolves.toMatchObject({
      error: { code: 'UNEXPECTED_ERROR' },
    })
  })
})
