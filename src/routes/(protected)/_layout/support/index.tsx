import { createFileRoute } from '@tanstack/react-router'

import { SupportHome } from '@/components/features/support'

/**
 * `/support` — the support landing.
 *
 * Thin route: it renders {@link SupportHome}, which loads everything from the
 * single aggregated overview query (`/api/support/overview`) and manages search,
 * categories, FAQs, open tickets, create + callback flows. No loader here — the
 * page fetches client-side via React Query (matching the masaiverse-v2 pattern),
 * so navigation is instant and mutations refetch only what changed.
 */
export const Route = createFileRoute('/(protected)/_layout/support/')({
  component: SupportHome,
})
