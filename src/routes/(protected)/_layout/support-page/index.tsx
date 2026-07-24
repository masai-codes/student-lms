import { createFileRoute } from '@tanstack/react-router'
import { FloatingChatFullPage } from '@/components/common/floating-chat/FloatingChatFullPage'

export const Route = createFileRoute('/(protected)/_layout/support-page/')({
  component: FloatingChatFullPage,
})
