'use client'

import { LectureAiChatBar } from './LectureAiChatBar'
import { useLectureChatDock } from '../hooks/useLectureChatDock'

import { lectureDetailContentClasses } from '@/lib/layout'
import { cn } from '@/lib/utils'

type LectureAiChatDockProps = {
  className?: string
  onDockedChange?: (isDocked: boolean) => void
}

/**
 * Inline above tabs on load; fixed to bottom once the user scrolls past the anchor.
 */
export function LectureAiChatDock({
  className,
  onDockedChange,
}: LectureAiChatDockProps) {
  const { anchorRef, isDocked, chatBarBlockPx } = useLectureChatDock(onDockedChange)

  return (
    <>
      <div
        ref={anchorRef}
        className={cn('shrink-0 px-0 pb-2 pt-3', className)}
        style={isDocked ? { minHeight: chatBarBlockPx } : undefined}
      >
        {!isDocked ? <LectureAiChatBar /> : null}
      </div>

      {isDocked ? (
        <div
          className={cn(
            'fixed inset-x-0 z-[220]',
            'border-t border-gray-200/80 bg-[#FAF9F9]/95 backdrop-blur-md',
            'bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            'max-md:bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
            'max-md:pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          )}
        >
          <div className={cn(lectureDetailContentClasses, 'py-3')}>
            <LectureAiChatBar />
          </div>
        </div>
      ) : null}
    </>
  )
}
