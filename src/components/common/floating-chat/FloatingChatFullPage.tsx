import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { floatingChatInboxQuery } from '@/query/support/supportQueries'
import { FloatingChatModal } from './FloatingChatModal'
import type { FloatingChatEntityLaunchIntent } from './floatingChatLaunchIntent'
import { dispatchSupportNavigate } from './dispatchSupportNavigate'

interface FloatingChatFullPageProps {
  /** Deep-link from `/support/context?category=…&entityId=…`. */
  initialEntityLaunchIntent?: FloatingChatEntityLaunchIntent | null
}

/** Full-viewport support experience for `/support` (linked from the old LMS). */
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

  return (
    <div className="min-h-dvh bg-white" data-testid="support-page-root">
      <FloatingChatModal
        presentation="fullPage"
        isOpen
        inbox={inboxQuery.data}
        isInboxLoading={inboxQuery.isLoading}
        isInboxError={inboxQuery.isError}
        onInboxRetry={() => void inboxQuery.refetch()}
        onReviewItem={(input) =>
          dispatchSupportNavigate({
            category: input.category,
            entityId: input.entityId,
          })
        }
        entityLaunchIntent={entityLaunchIntent}
        onEntityLaunchComplete={() => setEntityLaunchIntent(null)}
        onEntityLaunchFailed={() => {
          setEntityLaunchIntent(null)
          if (initialEntityLaunchIntent) {
            void navigate({ to: '/support', replace: true })
          }
        }}
      />
    </div>
  )
}
