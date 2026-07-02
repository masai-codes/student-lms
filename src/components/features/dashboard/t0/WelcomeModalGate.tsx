import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { WelcomeModal } from './WelcomeModal'
import {
  dismissWelcomeModalApi,
  fetchWelcomeModalStatus,
} from '@/lib/api/dashboard/dashboardApi'

const WELCOME_STATUS_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Decides whether the T0 welcome modal should appear and owns its dismissal.
 * The backend returns `showWelcomeModal` (true only for a freshly-admitted user
 * who hasn't seen it). On any exit path we optimistically hide the modal and
 * persist the "seen" flag so it never returns, even across reloads.
 */
export function WelcomeModalGate() {
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)

  const { data } = useQuery({
    queryKey: ['dashboard', 'welcome-modal-status'],
    queryFn: fetchWelcomeModalStatus,
    staleTime: WELCOME_STATUS_STALE_TIME_MS,
  })

  const dismissMutation = useMutation({
    mutationFn: dismissWelcomeModalApi,
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['dashboard', 'welcome-modal-status'],
      })
    },
  })

  const open = (data?.showWelcomeModal ?? false) && !dismissed

  const handleDismiss = () => {
    if (dismissed) return
    setDismissed(true)
    dismissMutation.mutate()
  }

  if (!open) return null

  return (
    <WelcomeModal
      open={open}
      onDismiss={handleDismiss}
      isDismissing={dismissMutation.isPending}
    />
  )
}
