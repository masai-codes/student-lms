'use client'

import { Modal, ModalContent, ModalDescription, ModalTitle } from '@/components/ui/modal'
import { DownloadAppContent } from '@/components/features/layout/DownloadAppContent'

export type DownloadAppModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  googlePlayQRUrl?: string
  appStoreQRUrl?: string
}

/** Same content as legacy `student-experience` `DownloadAppQRModal`. */
export function DownloadAppModal({
  open,
  onOpenChange,
  googlePlayQRUrl,
  appStoreQRUrl,
}: DownloadAppModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-[668px] md:p-10">
        {/* Visible heading/description live in DownloadAppContent; these
            screen-reader-only ones satisfy Radix Dialog's a11y requirement. */}
        <ModalTitle className="sr-only">Download the Masai Learn app</ModalTitle>
        <ModalDescription className="sr-only">
          Get your LMS on mobile and continue learning wherever you are.
        </ModalDescription>
        <DownloadAppContent googlePlayQRUrl={googlePlayQRUrl} appStoreQRUrl={appStoreQRUrl} />
      </ModalContent>
    </Modal>
  )
}
