import type { EventHost } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import { getInitials } from '@/lib/initials'

type EventHostsProps = {
  hosts: Array<EventHost>
}

/**
 * Luma-style "Hosted By" section — a label above a list of host rows, each with
 * a circular avatar (image, or initials fallback) and the host's name. Renders
 * nothing when there are no hosts.
 */
export default function EventHosts({ hosts }: EventHostsProps) {
  if (hosts.length === 0) return null

  return (
    <section className="border-t border-border pt-4">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-foreground-subtle">
        Hosted By
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {hosts.map((host, index) => (
          <li key={`${host.name}-${index}`} className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-warm/10 text-[13px] font-bold text-accent-warm">
              {host.imageUrl ? (
                <img
                  src={host.imageUrl}
                  alt={host.name}
                  className="size-full object-cover"
                />
              ) : (
                getInitials(host.name)
              )}
            </span>
            <span className="text-[14px] font-semibold leading-5 text-foreground">
              {host.name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
