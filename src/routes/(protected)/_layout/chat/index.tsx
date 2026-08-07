import { createFileRoute } from '@tanstack/react-router'
import { ChatPage } from '@/components/features/chat/ChatPage'

export const Route = createFileRoute('/(protected)/_layout/chat/')({
  component: ChatPage,
})
