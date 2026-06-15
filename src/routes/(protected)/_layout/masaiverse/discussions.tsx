import { createFileRoute } from '@tanstack/react-router'
import DiscussionsPage from '@/components/features/masaiverse-v2/pages/DiscussionsPage'

export const Route = createFileRoute(
  '/(protected)/_layout/masaiverse/discussions',
)({
  // `tab` selects the active tab: `'public'` for the community feed, or a club
  // id for that club's feed. "View all" links from home / a club page deep-link
  // here; omitted means the page defaults to Public.
  validateSearch: (search: Record<string, unknown>): { tab?: string } =>
    typeof search.tab === 'string' && search.tab.length > 0
      ? { tab: search.tab }
      : {},
  component: DiscussionsPage,
})
