import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProfileCertificates } from '@/server/api/profile/getProfileCertificates.service'

const getCourseCertificates = vi.hoisted(() => vi.fn())

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
  it('asks for every batch, not just the student’s enrolments', async () => {
    // Regression: scoping by `batch_user` enrolments hid certificates whose
    // relation batch the student has no student code for (event / cross-programme
    // certificates), which the old LMS showed.
    getCourseCertificates.mockResolvedValue([certificate('a')])

    await getProfileCertificates(7)

    expect(getCourseCertificates).toHaveBeenCalledTimes(1)
    expect(getCourseCertificates).toHaveBeenCalledWith(null, 7)
  })

  it('returns every certificate the service reports', async () => {
    getCourseCertificates.mockResolvedValue([
      certificate('a'),
      certificate('b'),
    ])

    await expect(getProfileCertificates(7)).resolves.toEqual([
      certificate('a'),
      certificate('b'),
    ])
  })

  it('resolves empty when the student holds none', async () => {
    getCourseCertificates.mockResolvedValue([])
    await expect(getProfileCertificates(7)).resolves.toEqual([])
  })

  it('degrades to an empty tab rather than failing the page', async () => {
    getCourseCertificates.mockRejectedValue(new Error('S3 down'))

    await expect(getProfileCertificates(7)).resolves.toEqual([])
    expect(console.error).toHaveBeenCalled()
  })
})
