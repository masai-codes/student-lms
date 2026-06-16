import { CalendarCheck } from '@phosphor-icons/react'

import type { SupportCoordinator } from '@/server/api/support/support.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const KIND_LABEL: Record<SupportCoordinator['kind'], string> = {
  IA: 'Instructor Associate',
  EC: 'Education Coordinator',
  PC: 'Program Coordinator',
}

/**
 * CoordinatorCard — a 1:1 contact (IA / EC / PC) with a Calendly booking CTA.
 * Rendered only when the batch has 1:1 enabled and coordinators are configured.
 */
export function CoordinatorCard({ coordinator }: { coordinator: SupportCoordinator }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Avatar className="size-11 shrink-0">
        {coordinator.profilePhotoPath && (
          <AvatarImage src={coordinator.profilePhotoPath} alt={coordinator.name} />
        )}
        <AvatarFallback>{coordinator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{coordinator.name}</p>
        <p className="text-xs text-muted-foreground">{KIND_LABEL[coordinator.kind]}</p>
      </div>

      {coordinator.calendlyUrl && (
        <Button asChild size="sm" variant="outline">
          <a href={coordinator.calendlyUrl} target="_blank" rel="noopener noreferrer">
            <CalendarCheck className="size-4" />
            Book a slot
          </a>
        </Button>
      )}
    </div>
  )
}
