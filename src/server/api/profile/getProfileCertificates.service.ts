import { getCourseCertificates } from '@/server/api/course/getCourseCertificates.service'
import type { CertificateItem } from '@/server/api/course/getCourseCertificates.service'

/**
 * Every certificate the student holds, across every batch.
 *
 * Delegates to {@link getCourseCertificates} with no batch scope, so the profile
 * tab and the course page can never disagree about what a student holds.
 *
 * This deliberately does **not** filter by the student's `batch_user` enrolments
 * (which is what the first version did, via `getStudentCodesForUser`). A
 * certificate lives on `certificate_user_relation.batch_id`, and that batch is
 * frequently one the student has no `batch_user.username` for — an event or
 * cross-programme certificate, say. Scoping by enrolment silently hid those,
 * whereas the old LMS's `getMyProfileCertificates` queries the relation table
 * for the user directly with no batch join at all.
 */
export async function getProfileCertificates(
  userId: number,
): Promise<Array<CertificateItem>> {
  try {
    return await getCourseCertificates(null, userId)
  } catch (error) {
    console.error('Failed to load profile certificates', userId, error)
    return []
  }
}
