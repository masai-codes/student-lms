import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdmissionsStudentStatus } from '../getAdmissionsStudentStatus'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.ADMISSIONS_API_BASE_URL = 'https://admissions.example.com'
  process.env.ADMISSIONS_API_KEY = 'key-123'
})
afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

describe('getAdmissionsStudentStatus', () => {
  it('returns null (no request) when the API is not configured', async () => {
    delete process.env.ADMISSIONS_API_BASE_URL
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await getAdmissionsStudentStatus('riya1')).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('calls the admissions endpoint with the api key and returns the payload', async () => {
    const fetchSpy = vi.fn(
      (_url: string, _opts: { headers: Record<string, string> }) =>
        // The endpoint wraps its payload as `{ success, data }`; the client unwraps `data`.
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { documents: { documentsUploaded: true } },
            }),
        }),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const result = await getAdmissionsStudentStatus('riya1', 'documents')

    expect(result).toEqual({ documents: { documentsUploaded: true } })
    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toContain(
      '/lms/student-status?student_code=riya1&include=documents',
    )
    expect(opts.headers['x-api-key']).toBe('key-123')
  })

  it('returns null on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: false, json: () => Promise.resolve({}) }),
      ),
    )
    expect(await getAdmissionsStudentStatus('riya1')).toBeNull()
  })
})
