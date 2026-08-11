import { useState } from 'react'
import { ThumbsUp, ThumbsDown, CheckCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ResolvedTicketFeedbackProps {
  alreadySubmitted?: boolean
  isSubmitting?: boolean
  submitError?: string | null
  onSubmitRating: (rating: 1 | 5) => void | Promise<void>
  onReopenEscalate: () => void | Promise<void>
}

export function ResolvedTicketFeedback({
  alreadySubmitted = false,
  isSubmitting = false,
  submitError,
  onSubmitRating,
  onReopenEscalate,
}: ResolvedTicketFeedbackProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const goodReasons = [
    'Quick resolution',
    'Clear explanation',
    'Helpful support',
    'Above & beyond',
  ]
  const badReasons = [
    'Issue not solved',
    'Slow response',
    'Unclear explanation',
    'Rude support',
  ]

  const currentReasons = rating === 'up' ? goodReasons : badReasons
  const errorMessage = localError ?? submitError

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    )
  }

  const handleSubmit = async (reopen: boolean) => {
    if (isSubmitting || rating == null) return
    setLocalError(null)
    try {
      if (reopen) {
        await onReopenEscalate()
      } else {
        await onSubmitRating(rating === 'up' ? 5 : 1)
        setIsSubmitted(true)
      }
    } catch {
      setLocalError('Couldn’t save your feedback. Please try again.')
    }
  }

  const gradientBg =
    'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  if (isSubmitted || alreadySubmitted) {
    return (
      <div className="shrink-0 p-6 border-t border-[#e9e9f3] dark:border-border bg-[#f9f9fc] dark:bg-surface-muted animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center size-[48px] rounded-full bg-[#f0fdf4] text-[#0E9F6E] dark:bg-success-subtle dark:text-success-subtle-foreground mb-3">
          <CheckCircle weight="fill" className="size-[28px]" />
        </div>
        <div className="text-[14px] font-bold text-[#15162c] dark:text-foreground mb-1">
          Feedback Submitted
        </div>
        <div className="text-[12.5px] text-[#62647d] dark:text-foreground-muted text-center">
          Thank you for helping us improve our support experience.
        </div>
      </div>
    )
  }

  if (!rating) {
    return (
      <div className="shrink-0 p-4 border-t border-[#e9e9f3] dark:border-border bg-[#f9f9fc] dark:bg-surface-muted animate-in fade-in slide-in-from-bottom-2">
        <div className="text-[13px] font-bold text-[#62647d] dark:text-foreground-muted text-center mb-3">
          This ticket has been marked as resolved
        </div>
        <div className="flex items-center justify-between bg-surface border border-[#e9e9f3] dark:border-border rounded-[12px] p-[14px_16px] shadow-sm">
          <span className="text-[13.5px] font-bold text-[#15162c] dark:text-foreground">
            Did we solve your issue?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRating('up')}
              className="p-2 rounded-full hover:bg-[#f0fdf4] text-[#62647d] hover:text-[#0E9F6E] dark:hover:bg-success-subtle dark:text-foreground-muted dark:hover:text-success-subtle-foreground transition-colors"
            >
              <ThumbsUp weight="bold" className="size-[20px]" />
            </button>
            <button
              type="button"
              onClick={() => setRating('down')}
              className="p-2 rounded-full hover:bg-[#fef2f2] text-[#62647d] hover:text-[#ef4444] dark:hover:bg-danger-subtle dark:text-foreground-muted dark:hover:text-danger-subtle-foreground transition-colors"
            >
              <ThumbsDown weight="bold" className="size-[20px]" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 p-4 border-t border-[#e9e9f3] dark:border-border bg-[#f9f9fc] dark:bg-surface-muted animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13.5px] font-bold text-[#15162c] dark:text-foreground">
          {rating === 'up'
            ? 'Great! What did you like?'
            : 'Sorry about that. What went wrong?'}
        </div>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            setRating(null)
            setSelectedReasons([])
            setLocalError(null)
          }}
          className="text-[12px] font-bold text-[#4b4396] dark:text-brand hover:underline disabled:opacity-50"
        >
          Back
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {currentReasons.map((reason) => {
          const isSelected = selectedReasons.includes(reason)
          return (
            <button
              key={reason}
              type="button"
              onClick={() => toggleReason(reason)}
              className={cn(
                'px-[14px] py-[7px] rounded-full text-[12px] font-bold transition-all border-[1.5px]',
                isSelected
                  ? rating === 'up'
                    ? 'bg-[#f0fdf4] border-[#0E9F6E] text-[#0E9F6E] dark:bg-success-subtle dark:border-success dark:text-success-subtle-foreground'
                    : 'bg-[#fef2f2] border-[#ef4444] text-[#ef4444] dark:bg-danger-subtle dark:border-danger dark:text-danger-subtle-foreground'
                  : 'bg-surface border-[#e9e9f3] text-[#62647d] hover:border-[#cbd5e1] dark:border-border dark:text-foreground-muted dark:hover:border-border-strong',
              )}
            >
              {reason}
            </button>
          )
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us more..."
        className="w-full bg-surface border border-[#e9e9f3] rounded-[10px] p-3 text-[13.5px] text-[#15162c] placeholder:text-[#9496ab] focus:outline-none focus:border-[#4b4396] dark:border-border dark:text-foreground dark:placeholder:text-foreground-subtle dark:focus:border-brand resize-none mb-4 h-[70px]"
      />

      {errorMessage && (
        <p className="mb-3 rounded-[10px] bg-[#fef2f2] px-3 py-2 text-[12.5px] font-medium text-[#b42318] dark:bg-danger-subtle dark:text-danger-subtle-foreground">
          {errorMessage}
        </p>
      )}

      {rating === 'up' ? (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleSubmit(false)}
          className="flex w-full items-center justify-center gap-2 p-[13px] rounded-[10px] font-bold text-[14px] text-white transition-all hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: gradientBg }}
        >
          {isSubmitting ? 'Submitting…' : 'Submit feedback'}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSubmit(false)}
            className="flex-[1.5] flex items-center justify-center p-[13px] rounded-[10px] font-bold text-[13.5px] text-white transition-all hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: gradientBg }}
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSubmit(true)}
            className="flex-1 flex items-center justify-center p-[13px] rounded-[10px] font-bold text-[13.5px] text-[#62647d] border-[1.5px] border-[#e3e3fb] bg-surface hover:bg-[#f0f0fd] dark:text-foreground-muted dark:border-border dark:hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Reopen & Escalate
          </button>
        </div>
      )}
    </div>
  )
}
