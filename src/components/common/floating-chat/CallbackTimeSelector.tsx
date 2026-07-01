import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle } from '@phosphor-icons/react'

interface CallbackTimeSelectorProps {
  onSubmit: (time: string) => void
  isSubmitting?: boolean
}

export function CallbackTimeSelector({ onSubmit, isSubmitting }: CallbackTimeSelectorProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  const timeSlots = [
    { id: '11am', label: '11:00 AM' },
    { id: '12pm', label: '12:00 PM' },
    { id: '1pm', label: '01:00 PM' },
    { id: '2pm', label: '02:00 PM' },
    { id: '3pm', label: '03:00 PM' },
    { id: '4pm', label: '04:00 PM' },
    { id: '5pm', label: '05:00 PM' },
    { id: '6pm', label: '06:00 PM' },
    { id: '7pm', label: '07:00 PM' },
    { id: '8pm', label: '08:00 PM' }
  ]

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="grid grid-cols-3 gap-2 mb-6">
        {timeSlots.map(slot => {
          const isSelected = selectedTime === slot.id
          return (
            <button
              key={slot.id}
              onClick={() => setSelectedTime(slot.id)}
              className={cn(
                "flex flex-col items-center justify-center p-[12px_10px] rounded-[10px] border-[1.5px] transition-all duration-150 ease-out",
                isSelected 
                  ? "border-[#4b4396] bg-[#f0f0fd] shadow-sm" 
                  : "border-[#e9e9f3] bg-white hover:border-[#4b4396]/40 hover:bg-[#f6f6fb]"
              )}
            >
              <span className={cn("text-[13.5px] font-extrabold", isSelected ? "text-[#4b4396]" : "text-[#15162c]")}>{slot.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-auto">
        <button
          disabled={!selectedTime || isSubmitting}
          onClick={() => selectedTime && onSubmit(selectedTime)}
          className={cn(
            "flex w-full items-center justify-center p-[13px] rounded-[10px] font-bold text-[14px] transition-all",
            !selectedTime || isSubmitting
              ? "bg-[#f1f1f7] text-[#9496ab] cursor-not-allowed"
              : "text-white hover:-translate-y-[1px] shadow-[0_4px_12px_rgba(75,67,150,0.25)] active:scale-[0.98]"
          )}
          style={selectedTime && !isSubmitting ? { background: gradientBg } : {}}
        >
          {isSubmitting ? "Confirming..." : (
            <>
              Confirm Slot <CheckCircle weight="fill" className="ml-1.5 size-[15px]" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
