import type { DisplayMessage } from '@/components/features/chatbot/types'

export const USER_MESSAGE_MAX_VIEWPORT_RATIO = 0.3

export function getUserMessageMaxHeightPx(viewportHeightPx: number): number {
  return viewportHeightPx * USER_MESSAGE_MAX_VIEWPORT_RATIO
}

export function getScrollSpacerHeightPx(viewportHeightPx: number): number {
  return viewportHeightPx * (1 - USER_MESSAGE_MAX_VIEWPORT_RATIO)
}

export function findLatestUserMessage(
  messages: Array<DisplayMessage>,
): DisplayMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role === 'user') {
      return message
    }
  }
  return undefined
}

export function computeScrollTopToAlignMessageAtTop(
  container: HTMLElement,
  messageEl: HTMLElement,
): number {
  const containerRect = container.getBoundingClientRect()
  const messageRect = messageEl.getBoundingClientRect()
  const offset = messageRect.top - containerRect.top
  return container.scrollTop + offset
}

export const CHAT_USER_MESSAGE_ATTR = 'data-chat-user-message-id'
