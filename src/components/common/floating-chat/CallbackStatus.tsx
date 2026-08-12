import { CheckCircle, Info } from '@phosphor-icons/react'

interface CallbackStatusProps {
  status: 'success' | 'already_requested'
  preferredTimeslot?: string | null
  onClose: () => void
}

export function CallbackStatus({
  status,
  preferredTimeslot,
  onClose,
}: CallbackStatusProps) {
  // Themed per mode (purple light / red dark) — see --chat-cta-gradient in styles.css.
  const gradientBg = 'var(--chat-cta-gradient)'

  if (status === 'already_requested') {
    return (
      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="flex items-center justify-center size-[64px] rounded-full bg-[#f0f4ff] dark:bg-info-subtle text-[#2952cc] dark:text-info-subtle-foreground mb-5">
            <Info weight="fill" className="size-[32px]" />
          </div>

          <h3 className="text-[19px] font-extrabold text-[#15162c] dark:text-foreground mb-2 tracking-tight">
            Callback in progress
          </h3>

          <p className="text-[14px] text-[#62647d] dark:text-foreground-muted leading-[1.5] px-4">
            You've already requested a call. Our team will reach out within 48
            hours.
          </p>
        </div>

        <div className="shrink-0 mt-auto">
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center p-[14px] rounded-[12px] font-bold text-[15px] text-white hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(75,67,150,0.25)] dark:shadow-[0_4px_12px_rgba(240,82,82,0.3)] active:scale-[0.98] transition-all"
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
        <div className="flex items-center justify-center size-[64px] rounded-full bg-[#f0fdf4] dark:bg-success-subtle text-[#0E9F6E] dark:text-success-subtle-foreground mb-5">
          <CheckCircle weight="fill" className="size-[36px]" />
        </div>

        <h3 className="text-[19px] font-extrabold text-[#15162c] dark:text-foreground mb-2 tracking-tight">
          Call Scheduled!
        </h3>

        <p className="text-[14px] text-[#62647d] dark:text-foreground-muted leading-[1.5] px-4">
          {preferredTimeslot
            ? `Our team will reach out to you within 48 hours during ${preferredTimeslot}.`
            : "We'll reach out to you within 48 hours to help you out."}
        </p>
      </div>

      <div className="shrink-0 mt-auto">
        <button
          onClick={onClose}
          className="flex w-full items-center justify-center p-[14px] rounded-[12px] font-bold text-[15px] text-white hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(75,67,150,0.25)] dark:shadow-[0_4px_12px_rgba(240,82,82,0.3)] active:scale-[0.98] transition-all"
          style={{ background: gradientBg }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
