'use client'

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import { SwitchAccountFlow } from '@/components/features/sign-in/SwitchAccountFlow'

export type SwitchAccountModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SwitchAccountModal({
  open,
  onOpenChange,
}: SwitchAccountModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-[668px] md:p-10">
        {/* Visible heading/description live inside SwitchAccountFlow; these
            screen-reader-only ones satisfy Radix Dialog's a11y requirement. */}
        <ModalTitle className="sr-only">Switch account</ModalTitle>
        <ModalDescription className="sr-only">
          Choose which linked account to continue with.
        </ModalDescription>
        {/* A hard reload (not a client-side navigate) so every cache tied to
            the previous account — React Query, in-memory user context —
            gets thrown away rather than leaking into the new session. */}
        <SwitchAccountFlow
          onAccountSwitched={() => {
            window.location.reload()
          }}
        />
      </ModalContent>
    </Modal>
  )
}
