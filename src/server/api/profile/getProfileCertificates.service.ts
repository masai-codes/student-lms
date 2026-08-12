import { getCourseCertificates } from '@/server/api/course/getCourseCertificates.service'
import type { CertificateItem } from '@/server/api/course/getCourseCertificates.service'
import { getStudentCodesForUser } from '@/server/users/getStudentCode'

/**
 * Every certificate the student holds, across all their batch enrolments.
 *
 * Deliberately fans out over {@link getCourseCertificates} rather than
 * re-deriving the (non-trivial, raw-SQL, signed-URL) certificate logic: the
 * course page and the profile tab must never disagree about what a student
 * holds. A batch whose lookup fails is skipped rather than failing the tab.
 */
export async function getProfileCertificates(
  userId: number,
): Promise<Array<CertificateItem>> {
  const codes = await getStudentCodesForUser(userId)
  const batchIds = [...new Set(codes.map((code) => code.batchId))]
  if (batchIds.length === 0) return []

  const perBatch = await Promise.all(
    batchIds.map(async (batchId) => {
      try {
        return await getCourseCertificates(batchId, userId)
      } catch (error) {
        console.error('Failed to load certificates for batch', batchId, error)
        return []
      }
    }),
  )

  return perBatch.flat()
}
