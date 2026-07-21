/**
 * Mirrors the real "onward" admissions API's `GET /lms/student-status`
 * payload (the same shape `getAdmissionsStudentStatus` fetches in
 * `src/server/admissions/getAdmissionsStudentStatus.ts`). Only 5 fields are
 * actually read by the LMS today — the rest exist so the fixture matches
 * onward's real contract:
 *   - `documents.required` — should the "Upload your documents" step show.
 *   - `documents.documentsUploaded` — has the student uploaded their documents.
 *   - `kit.showKit` — should the "Track your student kit" step show.
 *   - `kit.detailsFilled` — has the student submitted kit shipping details.
 *   - `kit.tracking` — courier tracking URL once the kit ships.
 */

export interface SimulatedOnwardDocuments {
  required: boolean
  instituteSideUpload: boolean
  documentsUploaded: boolean
  documentsVerified: boolean
  documentsPendingVerification: boolean
}

export interface SimulatedOnwardKit {
  showKit: boolean
  welcomeKitUrl: string | null
  detailsFilled: boolean
  details: Record<string, unknown> | null
  tracking: string | null
}

/**
 * Body returned by the mock `/lms/student-status` route. Intentionally
 * unwrapped (no `{ success, data }` envelope) to match what
 * `getAdmissionsStudentStatus` actually parses (`res.json()` cast straight to
 * `AdmissionsStudentStatus`, which reads `.documents` at the top level).
 */
export interface SimulatedOnwardStatus {
  documents: SimulatedOnwardDocuments
  kit: SimulatedOnwardKit
}
