import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle } from '@phosphor-icons/react'

interface CallbackTimeSelectorProps {
  timeslots: Array<string>
  onSubmit: (time: string) => void
  isSubmitting?: boolean
}

export function CallbackTimeSelector({
  timeslots,
  onSubmit,
  isSubmitting,
}: CallbackTimeSelectorProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  // Themed per mode (purple light / red dark) — see --chat-cta-gradient in styles.css.
  const gradientBg = 'var(--chat-cta-gradient)'

  if (timeslots.length === 0) {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
        <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
          No time slots are available right now.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="grid grid-cols-3 gap-2 mb-6">
        {timeslots.map((slot) => {
          const isSelected = selectedTime === slot
          return (
            <button
              key={slot}
              type="button"
              onClick={() => setSelectedTime(slot)}
              className={cn(
                'flex flex-col items-center justify-center p-[12px_10px] rounded-[10px] border-[1.5px] transition-all duration-150 ease-out',
                isSelected
                  ? 'border-[#4b4396] dark:border-brand bg-[#f0f0fd] dark:bg-brand/15 shadow-sm'
                  : 'border-[#e9e9f3] dark:border-border bg-surface hover:border-[#4b4396]/40 dark:hover:border-brand/40 hover:bg-[#f6f6fb] dark:hover:bg-accent',
              )}
            >
              <span
                className={cn(
                  'text-[13.5px] font-extrabold text-center leading-tight',
                  isSelected
                    ? 'text-[#4b4396] dark:text-brand'
                    : 'text-[#15162c] dark:text-foreground',
                )}
              >
                {slot}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-auto">
        <button
          type="button"
          disabled={!selectedTime || isSubmitting}
          onClick={() => selectedTime && onSubmit(selectedTime)}
          className={cn(
            'flex w-full items-center justify-center p-[13px] rounded-[10px] font-bold text-[14px] transition-all',
            !selectedTime || isSubmitting
              ? 'bg-[#f1f1f7] dark:bg-muted text-[#9496ab] dark:text-foreground-subtle cursor-not-allowed'
              : 'text-white hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(75,67,150,0.25)] dark:shadow-[0_4px_12px_rgba(240,82,82,0.3)] active:scale-[0.98]',
          )}
          style={
            selectedTime && !isSubmitting ? { background: gradientBg } : {}
          }
        >
          {isSubmitting ? (
            'Confirming...'
          ) : (
            <>
              Confirm Slot{' '}
              <CheckCircle weight="fill" className="ml-1.5 size-[15px]" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
