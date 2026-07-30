import { createFileRoute } from '@tanstack/react-router'
import { FloatingChatFullPage } from '@/components/common/floating-chat/FloatingChatFullPage'

/**
 * `/support` — the full-viewport support experience.
 *
 * This is the single support page: it renders {@link FloatingChatFullPage}
 * (the Help / inbox floating-chat flow). The deep-link variant lives at
 * `/support/context`.
 */
export const Route = createFileRoute('/(protected)/_layout/support/')({
  component: FloatingChatFullPage,
})
