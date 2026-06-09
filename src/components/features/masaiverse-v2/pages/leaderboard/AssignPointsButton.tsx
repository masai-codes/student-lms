import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from '@phosphor-icons/react'
import AssignPointsForm from './AssignPointsForm'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import { masaiverseV2AdminModeQuery } from '@/query/masaiverse-v2/adminModeQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

/**
 * "Assign points" CTA on the leaderboard page. Rendered only for admins with
 * admin mode enabled; opens a modal to hand-assign leaderboard points to a
 * member (the server re-checks the admin role).
 */
export default function AssignPointsButton() {
  const { data } = useQuery(masaiverseV2AdminModeQuery())
  const [open, setOpen] = useState(false)

  if (!data?.enabled) return null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          trackMasaiverse(MASAIVERSE_EVENTS.pointsAssignClick)
          setOpen(true)
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#111827] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1F2937]"
      >
        <Plus size={16} weight="bold" />
        Assign points
      </button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalTitle>Assign points</ModalTitle>
          <ModalDescription className="mt-1">
            Manually credit a member&apos;s leaderboard score.
          </ModalDescription>
          <div className="mt-4">
            <AssignPointsForm onDone={() => setOpen(false)} />
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}
