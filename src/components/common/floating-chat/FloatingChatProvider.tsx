import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { X } from '@phosphor-icons/react'
import { floatingChatInboxQuery } from '@/query/support/supportQueries'
import { FloatingChatModal } from './FloatingChatModal'
import { FloatingChatRaiseReminder } from './FloatingChatRaiseReminder'
import { navigateSupportReviewHref } from './navigateSupportReviewHref'
import type { FloatingChatEntityLaunchIntent } from './floatingChatLaunchIntent'

interface RaiseReminderState {
  categoryLabel: string
  itemTitle: string
  reviewPathname: string
}

interface FloatingChatContextValue {
  open: () => void
  openWithEntity: (intent: FloatingChatEntityLaunchIntent) => void
  close: () => void
}

const FloatingChatContext = createContext<FloatingChatContextValue | null>(null)

export function useFloatingChat(): FloatingChatContextValue {
  const value = useContext(FloatingChatContext)
  if (!value) {
    throw new Error('useFloatingChat must be used within FloatingChatProvider')
  }
  return value
}

interface FloatingChatProviderProps {
  children: ReactNode
  /** When false, only exposes context — no sphere (e.g. `/support` routes). */
  showSphere?: boolean
  className?: string
}

export function FloatingChatProvider({
  children,
  showSphere = true,
  className,
}: FloatingChatProviderProps) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const [isOpen, setIsOpen] = useState(false)
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false)
  const [entityLaunchIntent, setEntityLaunchIntent] =
    useState<FloatingChatEntityLaunchIntent | null>(null)
  const [raiseReminder, setRaiseReminder] = useState<RaiseReminderState | null>(
    null,
  )
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

  const open = useCallback(() => {
    setEntityLaunchIntent(null)
    setRaiseReminder(null)
    setIsOpen(true)
  }, [])

  const openWithEntity = useCallback(
    (intent: FloatingChatEntityLaunchIntent) => {
      setRaiseReminder(null)
      setEntityLaunchIntent(intent)
      setIsOpen(true)
    },
    [],
  )

  const close = useCallback(() => {
    setIsOpen(false)
    setEntityLaunchIntent(null)
  }, [])

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
    if (isOpen) {
      close()
      return
    }
    open()
  }

  const showRaiseReminder = raiseReminder != null && !isOpen

  return (
    <FloatingChatContext.Provider value={{ open, openWithEntity, close }}>
      {children}

      <FloatingChatModal
        isOpen={isOpen}
        onClose={close}
        inbox={inboxQuery.data}
        isInboxLoading={inboxQuery.isLoading}
        isInboxError={inboxQuery.isError}
        onInboxRetry={() => void inboxQuery.refetch()}
        onReviewItem={handleReviewItem}
        entityLaunchIntent={entityLaunchIntent}
        onEntityLaunchComplete={() => setEntityLaunchIntent(null)}
        onEntityLaunchFailed={() => setEntityLaunchIntent(null)}
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

      {showSphere ? (
        <button
          type="button"
          onClick={handleSphereClick}
          data-testid="floating-chat-sphere"
          className={cn(
            'fixed flex size-14 items-center justify-center rounded-full shadow-[0_8px_24px_-8px_rgba(20,20,43,0.12)] transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 z-[220]',
            'bottom-[calc(4.5rem+env(safe-area-inset-bottom)+1.75rem)] right-3',
            isOpen && 'max-lg:hidden',
            'lg:bottom-6 lg:right-6',
            isOpen ? 'lg:-translate-x-[520px]' : 'translate-x-0',
            className,
          )}
          style={{
            background:
              'linear-gradient(155deg, rgb(75, 67, 150), rgb(105, 98, 172))',
          }}
          aria-label={isOpen ? 'Close support' : 'Open support'}
        >
          <div className="relative flex items-center justify-center size-7">
            <img
              src="/chat-ai.svg"
              alt="Chat AI"
              className={cn(
                'absolute inset-0 size-full transition-all duration-300 ease-in-out',
                isOpen
                  ? 'opacity-0 scale-50 rotate-90'
                  : 'opacity-100 scale-100 rotate-0',
              )}
            />
            <X
              weight="bold"
              className={cn(
                'absolute inset-0 size-full text-white transition-all duration-300 ease-in-out',
                isOpen
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-50 -rotate-90',
              )}
            />
          </div>
        </button>
      ) : null}
    </FloatingChatContext.Provider>
  )
}

/** Wraps detail CTAs that may render outside the provider during tests. */
export function useFloatingChatOptional(): FloatingChatContextValue | null {
  return useContext(FloatingChatContext)
}
