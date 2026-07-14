import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MasaiverseV2AdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import { setMasaiverseV2AdminMode } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import {
  MASAIVERSE_V2_ADMIN_MODE_KEY,
  masaiverseV2AdminModeQuery,
} from '@/query/masaiverse-v2/adminModeQuery'
import { Switch } from '@/components/ui/switch'
import { MASAIVERSE_EVENTS, trackMasaiverse } from './tracking'

/**
 * "Enable admin mode" toggle shown below the Masaiverse logo. Only rendered for
 * users whose DB role is admin; students never see it. The on/off state is
 * persisted to `users.meta` via the admin-mode API.
 */
export default function AdminModeToggle() {
  const queryClient = useQueryClient()
  const { data } = useQuery(masaiverseV2AdminModeQuery())

  const mutation = useMutation({
    mutationFn: (enabled: boolean) => setMasaiverseV2AdminMode(enabled),
    onSuccess: (state) => {
      queryClient.setQueryData<MasaiverseV2AdminModeState>(
        MASAIVERSE_V2_ADMIN_MODE_KEY,
        state,
      )
      // Admin mode changes what's visible across every page (drafts appear /
      // disappear), so reload once to refetch all data with the new visibility.
      window.location.reload()
    },
  })

  // Hidden entirely for non-admins (and until we know the role).
  if (!data?.isAdmin) return null

  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2.5">
      <span className="text-sm font-medium text-foreground">Admin mode</span>
      <Switch
        checked={data.enabled}
        disabled={mutation.isPending}
        onCheckedChange={(next) => {
          trackMasaiverse(MASAIVERSE_EVENTS.adminModeToggle, { enabled: next })
          mutation.mutate(next)
        }}
        aria-label="Enable admin mode"
      />
    </div>
  )
}
