import { useState } from 'react'
import { ThumbsUp, ThumbsDown, CheckCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ResolvedTicketFeedbackProps {
  onEscalate: () => void
  onSubmit: () => void
}

export function ResolvedTicketFeedback({ onEscalate, onSubmit }: ResolvedTicketFeedbackProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (reopen: boolean) => {
    if (reopen) {
      onSubmit()
      onEscalate()
    } else {
      setIsSubmitted(true)
      onSubmit()
    }
  }

  const goodReasons = ["Quick resolution", "Clear explanation", "Helpful support", "Above & beyond"]
  const badReasons = ["Issue not solved", "Slow response", "Unclear explanation", "Rude support"]

  const currentReasons = rating === 'up' ? goodReasons : badReasons
  
  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    )
  }

  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  if (isSubmitted) {
    return (
      <div className="shrink-0 p-6 border-t border-[#e9e9f3] bg-[#f9f9fc] animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center size-[48px] rounded-full bg-[#f0fdf4] text-[#0E9F6E] mb-3">
          <CheckCircle weight="fill" className="size-[28px]" />
        </div>
        <div className="text-[14px] font-bold text-[#15162c] mb-1">Feedback Submitted</div>
        <div className="text-[12.5px] text-[#62647d] text-center">
          Thank you for helping us improve our support experience.
        </div>
      </div>
    )
  }

  if (!rating) {
    return (
      <div className="shrink-0 p-4 border-t border-[#e9e9f3] bg-[#f9f9fc] animate-in fade-in slide-in-from-bottom-2">
        <div className="text-[13px] font-bold text-[#62647d] text-center mb-3">
          This ticket has been marked as resolved
        </div>
        <div className="flex items-center justify-between bg-white border border-[#e9e9f3] rounded-[12px] p-[14px_16px] shadow-sm mb-3">
          <span className="text-[13.5px] font-bold text-[#15162c]">Did we solve your issue?</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setRating('up')}
              className="p-2 rounded-full hover:bg-[#f0fdf4] text-[#62647d] hover:text-[#0E9F6E] transition-colors"
            >
              <ThumbsUp weight="bold" className="size-[20px]" />
            </button>
            <button 
              onClick={() => setRating('down')}
              className="p-2 rounded-full hover:bg-[#fef2f2] text-[#62647d] hover:text-[#ef4444] transition-colors"
            >
              <ThumbsDown weight="bold" className="size-[20px]" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 p-4 border-t border-[#e9e9f3] bg-[#f9f9fc] animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13.5px] font-bold text-[#15162c]">
          {rating === 'up' ? "Great! What did you like?" : "Sorry about that. What went wrong?"}
        </div>
        <button 
          onClick={() => {
            setRating(null)
            setSelectedReasons([])
          }}
          className="text-[12px] font-bold text-[#4b4396] hover:underline"
        >
          Back
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {currentReasons.map(reason => {
          const isSelected = selectedReasons.includes(reason)
          return (
            <button
              key={reason}
              onClick={() => toggleReason(reason)}
              className={cn(
                "px-[14px] py-[7px] rounded-full text-[12px] font-bold transition-all border-[1.5px]",
                isSelected 
                  ? (rating === 'up' ? "bg-[#f0fdf4] border-[#0E9F6E] text-[#0E9F6E]" : "bg-[#fef2f2] border-[#ef4444] text-[#ef4444]")
                  : "bg-white border-[#e9e9f3] text-[#62647d] hover:border-[#cbd5e1]"
              )}
            >
              {reason}
            </button>
          )
        })}
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Tell us more..."
        className="w-full bg-white border border-[#e9e9f3] rounded-[10px] p-3 text-[13.5px] text-[#15162c] placeholder:text-[#9496ab] focus:outline-none focus:border-[#4b4396] resize-none mb-4 h-[70px]"
      />

      {rating === 'up' ? (
        <button
          onClick={() => handleSubmit(false)}
          className="flex w-full items-center justify-center gap-2 p-[13px] rounded-[10px] font-bold text-[14px] text-white transition-all hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.98]"
          style={{ background: gradientBg }}
        >
          Submit feedback
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit(false)}
            className="flex-1 flex items-center justify-center p-[13px] rounded-[10px] font-bold text-[13.5px] text-[#62647d] border-[1.5px] border-[#e3e3fb] bg-white hover:bg-[#f0f0fd] transition-colors"
          >
            Submit
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="flex-[1.5] flex items-center justify-center p-[13px] rounded-[10px] font-bold text-[13.5px] text-white transition-all hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.98]"
            style={{ background: gradientBg }}
          >
            Submit & Reopen
          </button>
        </div>
      )}
    </div>
  )
}
