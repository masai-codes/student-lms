import { cn } from '@/lib/utils'
import { PaperPlaneRight } from '@phosphor-icons/react'

interface ChatComposerProps {
  message: string
  onChange: (val: string) => void
  placeholder?: string
}

export function ChatComposer({ message, onChange, placeholder = "Describe your issue..." }: ChatComposerProps) {
  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  return (
    <div className="shrink-0 flex items-end gap-2 p-[12px_14px] border-t border-[#e9e9f3] bg-white animate-in slide-in-from-bottom-2 fade-in duration-200">
      <textarea
        value={message}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none border border-[#e9e9f3] rounded-[14px] p-[10px_13px] text-[13.6px] leading-[1.4] max-h-[90px] outline-none text-[#15162c] transition-colors focus:border-[#4b4396] font-[inherit]"
      />
      <button 
        disabled={!message.trim()}
        className={cn(
          "flex items-center justify-center shrink-0 size-[38px] rounded-full transition-all duration-150",
          message.trim() 
            ? "text-white hover:scale-105 active:scale-95 cursor-pointer" 
            : "bg-[#f1f1f7] text-[#9496ab] cursor-not-allowed"
        )}
        style={message.trim() ? { background: gradientBg } : {}}
      >
        <PaperPlaneRight weight="regular" className="size-[17px] -translate-x-[1px] translate-y-[1px]" />
      </button>
    </div>
  )
}
