import { cn } from '@/lib/utils'
import { useState } from 'react'
import { FloatingChatModal } from './FloatingChatModal'
import { X } from '@phosphor-icons/react'

interface FloatingChatSphereProps {
  onClick?: () => void
  className?: string
}

export function FloatingChatSphere({ onClick, className }: FloatingChatSphereProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <FloatingChatModal isOpen={isOpen} />
      
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          onClick?.()
        }}
        className={cn(
          'fixed bottom-6 right-6 flex size-14 items-center justify-center rounded-full shadow-[0_8px_24px_-8px_rgba(20,20,43,0.12)] transition-transform hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 z-[60]',
          className
        )}
        style={{
          background: 'linear-gradient(155deg, rgb(75, 67, 150), rgb(105, 98, 172))',
        }}
        aria-label="Open AI Chat"
      >
        <div className="relative flex items-center justify-center size-7">
          <img 
            src="/chat-ai.svg" 
            alt="Chat AI" 
            className={cn(
              "absolute inset-0 size-full transition-all duration-300 ease-in-out",
              isOpen ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"
            )}
          />
          <X 
            weight="bold" 
            className={cn(
              "absolute inset-0 size-full text-white transition-all duration-300 ease-in-out",
              isOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
            )}
          />
        </div>
      </button>
    </>
  )
}
