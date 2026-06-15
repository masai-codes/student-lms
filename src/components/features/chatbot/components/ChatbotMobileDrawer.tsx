import { Drawer } from 'vaul'
import type { ReactNode } from 'react'
import { getChatbotMobileDrawerSurfaceClass } from '@/components/features/chatbot/chatbotUi'
import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'

type ChatbotMobileDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function ChatbotMobileDrawer({
  open,
  onOpenChange,
  children,
}: ChatbotMobileDrawerProps) {
  const isApp = isMasaiverseApp()

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="bottom"
      modal
      shouldScaleBackground={false}
      dismissible
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[210] bg-black/50" />
        <Drawer.Content className={getChatbotMobileDrawerSurfaceClass(isApp)}>
          <div
            className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-gray-300"
            aria-hidden
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
