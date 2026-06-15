import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { fetchAssessLink } from '@/lib/api/dashboard/dashboardApi'

interface AssessNpsContentProps {
  formId: number
  title: string
}

export function AssessNpsContent({ formId, title }: AssessNpsContentProps) {
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAssessLink(formId)
      .then((result) => {
        setUrl(result.url)
        setCompleted(result.completed)
      })
      .catch(() => setError('Failed to load assessment. Please try again.'))
      .finally(() => setLoading(false))
  }, [formId])

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <Loader2 size={28} className="animate-spin text-[#6962AC]" />
        <p className="text-sm text-gray-500">Preparing your assessment…</p>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-10 text-center">
        <div className="size-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-500" strokeWidth={2} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
          Assessment Completed!
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
          You have already completed the <span className="font-medium text-gray-700">{title}</span> assessment. Thank you for your participation.
        </p>
      </div>
    )
  }

  if (error || !url) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm text-red-500">{error || 'Assessment link unavailable.'}</p>
        <button
          type="button"
          onClick={() => {
            setError('')
            setLoading(true)
            fetchAssessLink(formId)
              .then((result) => { setUrl(result.url); setCompleted(result.completed) })
              .catch(() => setError('Failed to load assessment. Please try again.'))
              .finally(() => setLoading(false))
          }}
          className="text-sm font-medium underline text-[#6962AC] focus-visible:outline-none"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <iframe
        src={url}
        title={title}
        className="flex-1 w-full border-0"
        allow="camera; microphone; fullscreen"
      />
    </div>
  )
}
