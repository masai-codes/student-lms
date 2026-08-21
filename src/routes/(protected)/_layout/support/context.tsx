import { createFileRoute, redirect } from '@tanstack/react-router'
import { FloatingChatFullPage } from '@/components/common/floating-chat/FloatingChatFullPage'
import { parseSupportPageContextSearch } from '@/components/common/floating-chat/supportPageSearch'

export const Route = createFileRoute('/(protected)/_layout/support/context')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = parseSupportPageContextSearch(search)
    if (!parsed) {
      throw redirect({ to: '/support' })
    }
    return parsed
  },
  component: SupportPageContextRoute,
})

function SupportPageContextRoute() {
  const { category, entityId } = Route.useSearch()

  return (
    <FloatingChatFullPage initialEntityLaunchIntent={{ category, entityId }} />
  )
}
