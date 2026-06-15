import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ChatbotSlideContainerProps = {
  isSecondaryOpen: boolean
  primary: ReactNode
  secondary: ReactNode
}

export function ChatbotSlideContainer({
  isSecondaryOpen,
  primary,
  secondary,
}: ChatbotSlideContainerProps) {
  return (
    <div className="relative h-full min-h-0 flex-1 overflow-hidden">
      <div
        className={cn(
          'flex h-full w-[200%] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
          isSecondaryOpen && '-translate-x-1/2',
        )}
        aria-hidden={false}
      >
        <div
          className="flex h-full w-1/2 shrink-0 flex-col"
          aria-hidden={isSecondaryOpen}
          inert={isSecondaryOpen ? true : undefined}
        >
          {primary}
        </div>
        <div
          className="flex h-full w-1/2 shrink-0 flex-col"
          aria-hidden={!isSecondaryOpen}
          inert={!isSecondaryOpen ? true : undefined}
        >
          {secondary}
        </div>
      </div>
    </div>
  )
}
