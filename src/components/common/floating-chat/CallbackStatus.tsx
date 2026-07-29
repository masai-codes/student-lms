import { CheckCircle, Info } from '@phosphor-icons/react'

interface CallbackStatusProps {
  status: 'success' | 'already_requested'
  preferredTimeslot?: string | null
  onClose: () => void
}

export function CallbackStatus({ status, preferredTimeslot, onClose }: CallbackStatusProps) {
  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  if (status === 'already_requested') {
    return (
      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="flex items-center justify-center size-[64px] rounded-full bg-[#f0f4ff] text-[#2952cc] mb-5">
            <Info weight="fill" className="size-[32px]" />
          </div>
          
          <h3 className="text-[19px] font-extrabold text-[#15162c] mb-2 tracking-tight">
            Callback in progress
          </h3>
          
          <p className="text-[14px] text-[#62647d] leading-[1.5] px-4">
            You've already requested a call. Our team will reach out within 48 hours.
          </p>
        </div>

        <div className="shrink-0 mt-auto">
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center p-[14px] rounded-[12px] font-bold text-[15px] text-white hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(75,67,150,0.25)] active:scale-[0.98] transition-all"
            style={{ background: gradientBg }}
          >
            Got it
          </button>
        </div>
      </div>
    )
  }

  // Success State
  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="flex items-center justify-center size-[64px] rounded-full bg-[#f0fdf4] text-[#0E9F6E] mb-5">
          <CheckCircle weight="fill" className="size-[36px]" />
        </div>
        
        <h3 className="text-[19px] font-extrabold text-[#15162c] mb-2 tracking-tight">
          Call Scheduled!
        </h3>
        
        <p className="text-[14px] text-[#62647d] leading-[1.5] px-4">
          {preferredTimeslot
            ? `Our team will reach out to you within 48 hours during ${preferredTimeslot}.`
            : "We'll reach out to you within 48 hours to help you out."}
        </p>
      </div>

      <div className="shrink-0 mt-auto">
        <button
          onClick={onClose}
          className="flex w-full items-center justify-center p-[14px] rounded-[12px] font-bold text-[15px] text-white hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(75,67,150,0.25)] active:scale-[0.98] transition-all"
          style={{ background: gradientBg }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
