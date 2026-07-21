import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { FloatingChatModal } from './FloatingChatModal'
import { FloatingChatRaiseReminder } from './FloatingChatRaiseReminder'
import { navigateSupportReviewHref } from './navigateSupportReviewHref'
import { X } from '@phosphor-icons/react'
import { floatingChatInboxQuery } from '@/query/support/supportQueries'

interface FloatingChatSphereProps {
  onClick?: () => void
  className?: string
}

interface RaiseReminderState {
  categoryLabel: string
  itemTitle: string
  reviewPathname: string
}

export function FloatingChatSphere({ onClick, className }: FloatingChatSphereProps) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const [isOpen, setIsOpen] = useState(false)
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false)
  const [raiseReminder, setRaiseReminder] = useState<RaiseReminderState | null>(null)
  const hasReachedReviewPageRef = useRef(false)

  useEffect(() => {
    if (isOpen) setHasOpenedOnce(true)
  }, [isOpen])

  useEffect(() => {
    if (!raiseReminder) {
      hasReachedReviewPageRef.current = false
      return
    }
    if (pathname === raiseReminder.reviewPathname) {
      hasReachedReviewPageRef.current = true
      return
    }
    if (hasReachedReviewPageRef.current) {
      setRaiseReminder(null)
    }
  }, [pathname, raiseReminder])

  const inboxQuery = useQuery({
    ...floatingChatInboxQuery(),
    enabled: hasOpenedOnce,
  })

  const handleReviewItem = (input: {
    href: string
    categoryLabel: string
    itemTitle: string
  }) => {
    setRaiseReminder({
      categoryLabel: input.categoryLabel,
      itemTitle: input.itemTitle,
      reviewPathname: input.href,
    })
    setIsOpen(false)
    navigateSupportReviewHref(navigate, input.href)
  }

  const handleSphereClick = () => {
    setRaiseReminder(null)
    setIsOpen((open) => !open)
    onClick?.()
  }

  const showRaiseReminder = raiseReminder != null && !isOpen

  return (
    <>
      <FloatingChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        inbox={inboxQuery.data}
        isInboxLoading={inboxQuery.isLoading}
        isInboxError={inboxQuery.isError}
        onInboxRetry={() => void inboxQuery.refetch()}
        onReviewItem={handleReviewItem}
      />

      {showRaiseReminder && (
        <FloatingChatRaiseReminder
          className={cn(
            'fixed z-[219]',
            'bottom-[calc(4.5rem+env(safe-area-inset-bottom)+5rem)] right-3',
            'lg:bottom-[5.5rem] lg:right-[5rem]',
          )}
        />
      )}

      <button
        onClick={handleSphereClick}
        className={cn(
          'fixed flex size-14 items-center justify-center rounded-full shadow-[0_8px_24px_-8px_rgba(20,20,43,0.12)] transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 z-[220]',
          // Mobile: lower above tab bar; hidden while the panel is open (close via header X).
          'bottom-[calc(4.5rem+env(safe-area-inset-bottom)+1.75rem)] right-3',
          isOpen && 'max-lg:hidden',
          // Desktop: unchanged — sphere stays visible and slides beside the panel.
          'lg:bottom-6 lg:right-6',
          isOpen ? 'lg:-translate-x-[520px]' : 'translate-x-0',
          className,
        )}
        style={{
          background: 'linear-gradient(155deg, rgb(75, 67, 150), rgb(105, 98, 172))',
        }}
        aria-label={isOpen ? 'Close support' : 'Open support'}
      >
        <div className="relative flex items-center justify-center size-7">
          <img
            src="/chat-ai.svg"
            alt="Chat AI"
            className={cn(
              'absolute inset-0 size-full transition-all duration-300 ease-in-out',
              isOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0',
            )}
          />
          <X
            weight="bold"
            className={cn(
              'absolute inset-0 size-full text-white transition-all duration-300 ease-in-out',
              isOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90',
            )}
          />
        </div>
      </button>
    </>
  )
}
