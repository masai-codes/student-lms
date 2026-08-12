import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProfileCertificates } from '@/server/api/profile/getProfileCertificates.service'

const getStudentCodesForUser = vi.hoisted(() => vi.fn())
const getCourseCertificates = vi.hoisted(() => vi.fn())

vi.mock('@/server/users/getStudentCode', () => ({
  getStudentCodesForUser: (...args: Array<unknown>) =>
    getStudentCodesForUser(...args),
}))

vi.mock('@/server/api/course/getCourseCertificates.service', () => ({
  getCourseCertificates: (...args: Array<unknown>) =>
    getCourseCertificates(...args),
}))

function certificate(id: string) {
  return { certificateObjectId: id, batchName: 'Batch' }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('getProfileCertificates', () => {
  it('returns nothing when the student has no enrolments', async () => {
    getStudentCodesForUser.mockResolvedValue([])
    await expect(getProfileCertificates(7)).resolves.toEqual([])
    expect(getCourseCertificates).not.toHaveBeenCalled()
  })

  it('concatenates certificates across every batch', async () => {
    getStudentCodesForUser.mockResolvedValue([
      { code: 'A', batchId: 900 },
      { code: 'B', batchId: 901 },
    ])
    getCourseCertificates
      .mockResolvedValueOnce([certificate('a')])
      .mockResolvedValueOnce([certificate('b'), certificate('c')])

    const certificates = await getProfileCertificates(7)
    expect(certificates.map((c) => c.certificateObjectId)).toEqual([
      'a',
      'b',
      'c',
    ])
    expect(getCourseCertificates).toHaveBeenCalledWith(900, 7)
    expect(getCourseCertificates).toHaveBeenCalledWith(901, 7)
  })

  it('queries each batch once even with duplicate codes', async () => {
    getStudentCodesForUser.mockResolvedValue([
      { code: 'A', batchId: 900 },
      { code: 'A2', batchId: 900 },
    ])
    getCourseCertificates.mockResolvedValue([])

    await getProfileCertificates(7)
    expect(getCourseCertificates).toHaveBeenCalledTimes(1)
  })

  it('skips a failing batch instead of failing the whole tab', async () => {
    getStudentCodesForUser.mockResolvedValue([
      { code: 'A', batchId: 900 },
      { code: 'B', batchId: 901 },
    ])
    getCourseCertificates
      .mockRejectedValueOnce(new Error('S3 down'))
      .mockResolvedValueOnce([certificate('b')])

    await expect(getProfileCertificates(7)).resolves.toEqual([certificate('b')])
    expect(console.error).toHaveBeenCalled()
  })
})
