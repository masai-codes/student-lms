import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  handleSubmitSolutionLink,
  handleUploadSolutionFile,
} from '../solutionSubmissionActions.handler'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  submitSolutionForUser: vi.fn(),
  uploadImageToS3: vi.fn(),
}))

vi.mock('@/server/assignments/services/submitSolution.service', () => ({
  submitSolutionForUser: hoisted.submitSolutionForUser,
}))
vi.mock('@/server/storage/s3Upload', () => ({
  uploadImageToS3: hoisted.uploadImageToS3,
}))
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

function linkRequest(body: unknown, cookie: string | null = 'session=abc') {
  return new Request('http://localhost/api/learn/solutions/7', {
    method: 'PATCH',
    headers: cookie ? { cookie } : {},
    body: JSON.stringify(body),
  })
}

function fileRequest(file: File | null, cookie: string | null = 'session=abc') {
  const form = new FormData()
  if (file) form.append('file', file)
  return new Request('http://localhost/api/learn/solutions/7/file', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
    body: form,
  })
}

describe('solution submission handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(5)
    hoisted.submitSolutionForUser.mockResolvedValue({
      status: 'submitted',
      submissionLink: 'https://x.test',
    })
  })

  it('submits a valid LINK solution', async () => {
    const response = await handleSubmitSolutionLink(
      linkRequest({ submissionLink: 'https://x.test' }),
      '7',
    )

    expect(response.status).toBe(200)
    expect(hoisted.submitSolutionForUser).toHaveBeenCalledWith({
      userId: 5,
      solutionId: 7,
      submissionLink: 'https://x.test',
    })
  })

  it('rejects an invalid LINK url with 400', async () => {
    const response = await handleSubmitSolutionLink(
      linkRequest({ submissionLink: 'not a url' }),
      '7',
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_SOLUTION_PAYLOAD',
    })
    expect(hoisted.submitSolutionForUser).not.toHaveBeenCalled()
  })

  it('returns 401 for an unauthenticated LINK submit', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    vi.mocked(requireSessionUserId).mockRejectedValueOnce(
      new ApiError(401, 'UNAUTHORIZED'),
    )

    const response = await handleSubmitSolutionLink(
      linkRequest({ submissionLink: 'https://x.test' }, null),
      '7',
    )

    expect(response.status).toBe(401)
  })

  it('uploads and submits a FILE solution', async () => {
    hoisted.uploadImageToS3.mockResolvedValueOnce('https://cdn.test/file.pdf')
    const file = new File(['hello'], 'answer.pdf', { type: 'application/pdf' })

    const response = await handleUploadSolutionFile(fileRequest(file), '7')

    expect(response.status).toBe(200)
    expect(hoisted.uploadImageToS3).toHaveBeenCalledTimes(1)
    expect(hoisted.submitSolutionForUser).toHaveBeenCalledWith({
      userId: 5,
      solutionId: 7,
      submissionLink: 'https://cdn.test/file.pdf',
    })
  })

  it('returns 400 when no file is provided', async () => {
    const response = await handleUploadSolutionFile(fileRequest(null), '7')

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SOLUTION_UPLOAD_NO_FILE',
    })
    expect(hoisted.uploadImageToS3).not.toHaveBeenCalled()
  })
})
