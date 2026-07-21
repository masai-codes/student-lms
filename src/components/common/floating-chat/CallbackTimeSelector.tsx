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
  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  if (timeslots.length === 0) {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
        <p className="text-[13px] text-[#62647d]">No time slots are available right now.</p>
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
                  ? 'border-[#4b4396] bg-[#f0f0fd] shadow-sm'
                  : 'border-[#e9e9f3] bg-white hover:border-[#4b4396]/40 hover:bg-[#f6f6fb]',
              )}
            >
              <span
                className={cn(
                  'text-[13.5px] font-extrabold text-center leading-tight',
                  isSelected ? 'text-[#4b4396]' : 'text-[#15162c]',
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
              ? 'bg-[#f1f1f7] text-[#9496ab] cursor-not-allowed'
              : 'text-white hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(75,67,150,0.25)] active:scale-[0.98]',
          )}
          style={selectedTime && !isSubmitting ? { background: gradientBg } : {}}
        >
          {isSubmitting ? (
            'Confirming...'
          ) : (
            <>
              Confirm Slot <CheckCircle weight="fill" className="ml-1.5 size-[15px]" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
