import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { floatingChatInboxQuery } from '@/query/support/supportQueries'
import { FloatingChatModal } from './FloatingChatModal'
import type { FloatingChatEntityLaunchIntent } from './floatingChatLaunchIntent'
import { navigateSupportReviewHref } from './navigateSupportReviewHref'

interface FloatingChatFullPageProps {
  /** Deep-link from `/support-page/context?category=…&entityId=…`. */
  initialEntityLaunchIntent?: FloatingChatEntityLaunchIntent | null
}

/** Full-viewport support experience for `/support-page` (linked from the old LMS). */
export function FloatingChatFullPage({
  initialEntityLaunchIntent = null,
}: FloatingChatFullPageProps = {}) {
  const navigate = useNavigate()
  const [entityLaunchIntent, setEntityLaunchIntent] = useState(
    initialEntityLaunchIntent,
  )
  const inboxQuery = useQuery(floatingChatInboxQuery())

  useEffect(() => {
    setEntityLaunchIntent(initialEntityLaunchIntent)
  }, [initialEntityLaunchIntent])

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    void navigate({ to: '/' })
  }

  return (
    <div
      className="min-h-dvh bg-white"
      data-testid="support-page-root"
    >
      <FloatingChatModal
        presentation="fullPage"
        isOpen
        onClose={handleClose}
        inbox={inboxQuery.data}
        isInboxLoading={inboxQuery.isLoading}
        isInboxError={inboxQuery.isError}
        onInboxRetry={() => void inboxQuery.refetch()}
        onReviewItem={(input) => navigateSupportReviewHref(navigate, input.href)}
        entityLaunchIntent={entityLaunchIntent}
        onEntityLaunchComplete={() => setEntityLaunchIntent(null)}
        onEntityLaunchFailed={() => {
          setEntityLaunchIntent(null)
          if (initialEntityLaunchIntent) {
            void navigate({ to: '/support-page', replace: true })
          }
        }}
      />
    </div>
  )
}
