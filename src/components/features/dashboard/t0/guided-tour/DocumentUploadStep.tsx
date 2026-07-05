import { useQuery } from '@tanstack/react-query'
import { CheckCircle } from '@phosphor-icons/react'
import { AdmissionsRedirectCard } from './AdmissionsRedirectCard'
import { fetchT0FlowDocuments } from '@/lib/api/dashboard/dashboardApi'

interface DocumentUploadStepProps {
  batchId: number
  /** Refetch tour progress after the learner returns from uploading. */
  onCompleted: () => void
}

const CARD_CENTER =
  'flex min-h-[360px] w-full flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm'

/**
 * Document-upload step, mirroring the legacy LMS: fetches the (external)
 * admissions document status on open. When not yet uploaded it redirects the
 * learner to the admissions portal; once uploaded it shows a success card.
 * Uploads happen externally, so there's no in-app form.
 */
export function DocumentUploadStep({ batchId, onCompleted }: DocumentUploadStepProps) {
  const { data, isPending } = useQuery({
    queryKey: ['dashboard', 't0-flow-documents', batchId],
    queryFn: () => fetchT0FlowDocuments(batchId),
  })

  if (isPending) {
    return (
      <div className={CARD_CENTER} data-testid="document-upload-step">
        <p className="text-sm text-gray-500">Checking your document status…</p>
      </div>
    )
  }

  // Uploaded → success.
  if (data?.documentsUploaded) {
    return (
      <div className={CARD_CENTER} data-testid="document-upload-step">
        <div className="mb-6 flex size-[72px] items-center justify-center rounded-full bg-[#3B9D6E]">
          <CheckCircle size={40} weight="bold" className="text-white" aria-hidden />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900" data-testid="document-upload-done">
          Documents Submitted
        </h2>
        <p className="max-w-sm text-sm text-gray-600">Your documents have been uploaded successfully</p>
      </div>
    )
  }

  // Not uploaded → redirect to admissions (shared redirect card).
  return (
    <AdmissionsRedirectCard
      message="You'll now be redirected to the Admissions platform to upload your documents."
      url={data?.admissionsFormUrl ?? null}
      onContinue={onCompleted} // refetch so the step reflects the upload when they return
      ctaTestId="document-upload-continue"
    />
  )
}
