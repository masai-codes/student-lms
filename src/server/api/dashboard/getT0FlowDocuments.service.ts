import { getT0AdmissionsStatus } from './t0/getT0AdmissionsStatus.service'

export interface T0FlowDocumentsStatus {
  /** Uploaded to the admissions portal (external system of record). */
  documentsUploaded: boolean
  documentsVerified: boolean
  /** SSO link to the admissions portal to upload documents. */
  admissionsFormUrl: string | null
}

/**
 * Document-upload status for the guided tour, fetched on demand when the learner
 * opens the step. Upload/verification state and the SSO upload link both come
 * from the admissions `student-status` API (see {@link getT0AdmissionsStatus}) —
 * the LMS doesn't store document state itself. The SSO link is always returned so
 * the redirect works even when the status API is unconfigured.
 */
export async function getT0FlowDocuments(
  userId: number,
  batchId: number,
): Promise<T0FlowDocumentsStatus> {
  const status = await getT0AdmissionsStatus(userId, batchId)
  return {
    documentsUploaded: status.documentsUploaded,
    documentsVerified: status.documentsVerified,
    admissionsFormUrl: status.admissionsFormUrl,
  }
}
