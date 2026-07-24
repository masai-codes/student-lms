import { cn } from '@/lib/utils'

export interface FloatingChatRaiseReminderProps {
  className?: string
}

export function FloatingChatRaiseReminder({ className }: FloatingChatRaiseReminderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300',
        className,
      )}
    >
      <div className="relative max-w-[13.5rem]">
        <div className="rounded-[14px] border border-[#e3e3fb] bg-white px-3.5 py-2.5 shadow-[0_6px_20px_rgba(75,67,150,0.12)]">
          <p className="text-[12.5px] font-semibold leading-snug text-[#15162c]">
            Still want to raise a ticket?
          </p>
          <p className="mt-0.5 text-[11px] text-[#62647d]">Tap support when ready</p>
        </div>
        <div className="absolute -bottom-1.5 right-5 size-3 rotate-45 border-r border-b border-[#e3e3fb] bg-white" />
      </div>
    </div>
  )
}
