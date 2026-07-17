import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from '@phosphor-icons/react'
import {
  createMasaiverseV2Club,
  createMasaiverseV2Event,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { masaiverseV2AdminModeQuery } from '@/query/masaiverse-v2/adminModeQuery'
import { MASAIVERSE_V2_HOME_KEY } from '@/query/masaiverse-v2/homeQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from './tracking'

type CreateKind = 'event' | 'club'

const CONFIG: Record<
  CreateKind,
  {
    label: string
    create: () => Promise<{ id: string }>
    invalidate: Array<ReadonlyArray<string>>
  }
> = {
  // Events show on both the events page and the home "Live & Upcoming" section.
  event: {
    label: 'Add an event',
    create: createMasaiverseV2Event,
    invalidate: [['masaiverse-v2', 'events'], MASAIVERSE_V2_HOME_KEY],
  },
  // The clubs page reuses the home payload's clubs list.
  club: {
    label: 'Add a club',
    create: createMasaiverseV2Club,
    invalidate: [MASAIVERSE_V2_HOME_KEY],
  },
}

/**
 * "Add an event" / "Add a club" CTA shown on the events and clubs pages. Only
 * rendered for admins with admin mode enabled; students never see it. Clicking
 * creates a draft (unpublished) row server-side and refetches the affected
 * lists so the new draft appears for the admin.
 */
export default function AdminCreateButton({ kind }: { kind: CreateKind }) {
  const { data } = useQuery(masaiverseV2AdminModeQuery())
  const queryClient = useQueryClient()
  const config = CONFIG[kind]

  const mutation = useMutation({
    mutationFn: config.create,
    onSuccess: () => {
      config.invalidate.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey })
      })
    },
  })

  if (!data?.enabled) return null

  return (
    <button
      type="button"
      onClick={() => {
        trackMasaiverse(
          kind === 'club'
            ? MASAIVERSE_EVENTS.clubCreateClick
            : MASAIVERSE_EVENTS.eventCreateClick,
        )
        mutation.mutate()
      }}
      disabled={mutation.isPending}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
    >
      <Plus size={16} weight="bold" />
      {mutation.isPending ? 'Creating…' : config.label}
    </button>
  )
}
