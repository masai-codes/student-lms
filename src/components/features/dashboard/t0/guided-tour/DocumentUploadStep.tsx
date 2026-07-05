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
const CTA = 'inline-flex h-11 items-center justify-center rounded-lg bg-[#6962AC] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#5a4f96]'

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

  // Not uploaded → redirect to admissions.
  return (
    <div className={CARD_CENTER} data-testid="document-upload-step">
      <div className="mb-6">
        <Shuffle size={56} weight="bold" className="text-[#DF3841]" aria-hidden />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-900">Redirecting you to Admissions</h2>
      <p className="mb-8 max-w-sm text-sm text-gray-600">
        You&apos;ll now be redirected to the Admissions platform to upload your documents.
      </p>
      {data?.admissionsFormUrl ? (
        <button
          type="button"
          onClick={() => {
            window.open(data.admissionsFormUrl!, '_blank', 'noopener,noreferrer')
            onCompleted() // refetch so the step reflects the upload when they return
          }}
          className={CTA}
          data-testid="document-upload-continue"
        >
          Continue
        </button>
      ) : (
        <p className="text-sm text-gray-500">Contact support if you need the Admissions portal link.</p>
      )}
    </div>
  )
}
