'use client'

import { useNavigate } from '@tanstack/react-router'
import { Headphones } from 'lucide-react'

/**
 * Floating support button — a fixed round icon that navigates to the `/support`
 * page. Sits bottom-right, lifted above the mobile tab bar (and its safe-area
 * inset) so it never overlaps the primary navigation on small screens.
 */
export default function SupportChatButton() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => {
        void navigate({ to: '/support' })
      }}
      className="fixed right-4 md:right-6 z-[150] flex h-14 w-14 items-center justify-center rounded-full bg-[#9061F9] text-white shadow-lg transition-all hover:bg-[#7C4FEB] hover:shadow-xl dark:bg-brand dark:text-brand-foreground dark:hover:bg-brand/90"
      style={{
        bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))',
      }}
      aria-label="Open support"
    >
      <Headphones strokeWidth={1.75} className="size-7 shrink-0" />
    </button>
  )
}
