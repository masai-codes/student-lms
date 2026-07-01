import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FloatingChatModal } from './FloatingChatModal'
import { X } from '@phosphor-icons/react'
import { floatingChatInboxQuery } from '@/query/support/supportQueries'

interface FloatingChatSphereProps {
  onClick?: () => void
  className?: string
}

export function FloatingChatSphere({ onClick, className }: FloatingChatSphereProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false)

  useEffect(() => {
    if (isOpen) setHasOpenedOnce(true)
  }, [isOpen])

  const inboxQuery = useQuery({
    ...floatingChatInboxQuery(),
    enabled: hasOpenedOnce,
  })

  return (
    <>
      <FloatingChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        inbox={inboxQuery.data}
        isInboxLoading={inboxQuery.isLoading}
        isInboxError={inboxQuery.isError}
        onInboxRetry={() => void inboxQuery.refetch()}
      />

      <button
        onClick={() => {
          setIsOpen(!isOpen)
          onClick?.()
        }}
        className={cn(
          'fixed bottom-6 right-6 flex size-14 items-center justify-center rounded-full shadow-[0_8px_24px_-8px_rgba(20,20,43,0.12)] transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 z-[60]',
          isOpen ? '-translate-x-[520px]' : 'translate-x-0',
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
