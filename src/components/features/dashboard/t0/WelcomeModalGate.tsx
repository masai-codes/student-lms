import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WelcomeModal } from './WelcomeModal'
import { dismissWelcomeModalApi } from '@/lib/api/dashboard/dashboardApi'

interface WelcomeModalGateProps {
  /** From the consolidated overview payload (`overview.welcomeModal`). */
  showWelcomeModal: boolean
}

/**
 * Decides whether the T0 welcome modal should appear and owns its dismissal.
 * Eligibility (`showWelcomeModal`) comes from the consolidated dashboard
 * overview — true only for a freshly-admitted user who hasn't seen it. On any
 * exit path we optimistically hide the modal and persist the "seen" flag
 * (refetching the overview) so it never returns, even across reloads.
 */
export function WelcomeModalGate({ showWelcomeModal }: WelcomeModalGateProps) {
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)

  const dismissMutation = useMutation({
    mutationFn: dismissWelcomeModalApi,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    },
  })

  const open = showWelcomeModal && !dismissed

  const handleDismiss = () => {
    if (dismissed) return
    setDismissed(true)
    dismissMutation.mutate()
  }

  if (!open) return null

  return (
    <WelcomeModal open={open} onDismiss={handleDismiss} isDismissing={dismissMutation.isPending} />
  )
}
