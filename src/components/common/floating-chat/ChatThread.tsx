import { cn } from '@/lib/utils'
import { Headset, Sparkle } from '@phosphor-icons/react'
import type { Message, Category } from './types'

interface ChatThreadProps {
  messages: Message[]
  isInitialBotGreeting?: boolean
  categoryObj?: Category
  selectedItemTitle?: string | null
}

export function ChatThread({ messages, isInitialBotGreeting, categoryObj, selectedItemTitle }: ChatThreadProps) {
  const primaryColor = '#4b4396'

  // If this is the initial greeting for step 3
  if (isInitialBotGreeting) {
    return (
      <div className="flex flex-col h-full pb-[6px]">
        <div className="flex gap-[9px] max-w-[92%] animate-in slide-in-from-bottom-2 duration-300 fade-in">
          <div 
            className="flex items-center justify-center shrink-0 size-[26px] rounded-full text-white"
            style={{ background: primaryColor }}
          >
            <Sparkle weight="fill" className="size-[13px]" />
          </div>
          <div className="text-[13.6px] leading-[1.45] p-[10px_13px] rounded-[14px_14px_14px_4px] bg-[#f1f1f7] text-[#15162c]">
            Hi! I'm here to help{categoryObj?.id !== 'general' && selectedItemTitle ? <span> with <strong>{selectedItemTitle}</strong></span> : ''}. Go ahead and type out what's going on — no need to explain the category, I've already got that.
          </div>
        </div>
      </div>
    )
  }

  // Regular ticket messages thread
  return (
    <div className="flex flex-col h-full gap-[12px] pb-[6px]">
      {messages.map((m, i) => {
        const isUser = m.role === 'user'
        const isAgent = m.role === 'agent'
        
        return (
          <div key={i} className={cn("flex gap-[9px] max-w-[92%] animate-in slide-in-from-bottom-2 duration-300 fade-in", isUser ? "self-end flex-row-reverse" : "self-start")}>
            {!isUser && (
              <div className={cn(
                "flex items-center justify-center shrink-0 size-[26px] rounded-full text-white",
                isAgent ? "bg-[#15162c]" : "bg-[#4b4396]"
              )}>
                {isAgent ? <Headset weight="fill" className="size-[13px]" /> : <Sparkle weight="fill" className="size-[13px]" />}
              </div>
            )}
            <div className="flex flex-col gap-1">
              {isAgent && m.name && <span className="text-[11px] font-bold text-[#62647d] ml-1">{m.name}</span>}
              <div className={cn(
                "text-[13.6px] leading-[1.45] p-[10px_13px]",
                isUser 
                  ? "bg-[#4b4396] text-white rounded-[14px_14px_4px_14px]" 
                  : "bg-[#f1f1f7] text-[#15162c] rounded-[14px_14px_14px_4px]"
              )}>
                {m.text}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
