import { useQuery } from '@tanstack/react-query'
import { ArrowSquareOut, CheckCircle, FileArrowUp } from '@phosphor-icons/react'
import { fetchT0FlowDocuments } from '@/lib/api/dashboard/dashboardApi'

interface DocumentUploadStepProps {
  batchId: number
  /** Refetch tour progress after the learner returns from uploading. */
  onCompleted: () => void
}

const CARD = 'flex flex-col items-start gap-4 rounded-xl border border-gray-200 p-6'
const CTA = 'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#6962AC] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50'

/**
 * Document-upload step. Fetches the (external) admissions document status on
 * open; when not yet uploaded, sends the learner to the admissions portal to
 * upload. Uploads happen externally, so there's no in-app form.
 */
export function DocumentUploadStep({ batchId, onCompleted }: DocumentUploadStepProps) {
  const { data, isPending } = useQuery({
    queryKey: ['dashboard', 't0-flow-documents', batchId],
    queryFn: () => fetchT0FlowDocuments(batchId),
  })

  if (isPending) {
    return (
      <div className={CARD} data-testid="document-upload-step">
        <p className="text-sm text-gray-500">Checking your document status…</p>
      </div>
    )
  }

  if (data?.documentsUploaded) {
    return (
      <div className={CARD} data-testid="document-upload-step">
        <CheckCircle weight="fill" className="size-8 text-green-500" aria-hidden />
        <p className="text-sm font-medium text-gray-900" data-testid="document-upload-done">Documents uploaded</p>
        <p className="text-sm text-gray-600">Thanks! Your documents are with the admissions team.</p>
      </div>
    )
  }

  return (
    <div className={CARD} data-testid="document-upload-step">
      <FileArrowUp className="size-8 text-[#6962AC]" aria-hidden />
      <p className="text-sm font-medium text-gray-900">Upload your documents</p>
      <p className="text-sm text-gray-600">
        You&apos;ll be taken to the admissions portal to upload your documents. Return here once you&apos;re done.
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
          Continue <ArrowSquareOut className="size-4" aria-hidden />
        </button>
      ) : (
        <p className="text-sm text-gray-500">Please contact support for the document-upload link.</p>
      )}
    </div>
  )
}
