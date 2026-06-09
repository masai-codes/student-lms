import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MasaiverseV2Banner } from '@/server/api/masaiverse-v2/services/getBanners.service'
import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal'
import { RichTextEditor } from '@/components/discussion-post-card/rich-text-editor'
import { Switch } from '@/components/ui/switch'
import {
  deleteMasaiverseV2Banner,
  updateMasaiverseV2Banner,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { MASAIVERSE_V2_BANNERS_KEY } from '@/query/masaiverse-v2/bannersQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'

type BannerEditModalProps = {
  banner: MasaiverseV2Banner
  open: boolean
  onClose: () => void
}

const LABEL = 'mb-1 text-[12px] font-semibold text-[#6B7280]'
const INPUT =
  'w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#111928] outline-none'

/** Admin modal to edit (or delete) a single home banner. */
export default function BannerEditModal({
  banner,
  open,
  onClose,
}: BannerEditModalProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(banner.title)
  const [description, setDescription] = useState(banner.description ?? '')
  const [ctaText, setCtaText] = useState(banner.ctaText ?? '')
  const [ctaUrl, setCtaUrl] = useState(banner.ctaUrl ?? '')
  const [isPublished, setIsPublished] = useState(banner.isPublished)

  // Reseed whenever the modal (re)opens for a banner.
  useEffect(() => {
    if (!open) return
    setTitle(banner.title)
    setDescription(banner.description ?? '')
    setCtaText(banner.ctaText ?? '')
    setCtaUrl(banner.ctaUrl ?? '')
    setIsPublished(banner.isPublished)
  }, [open, banner])

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_BANNERS_KEY })

  const save = useMutation({
    mutationFn: () =>
      updateMasaiverseV2Banner(banner.id, {
        column: { title, description, ctaText, ctaUrl },
        meta: { isPublished },
      }),
    onSuccess: async () => {
      await invalidate()
      onClose()
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteMasaiverseV2Banner(banner.id),
    onSuccess: async () => {
      await invalidate()
      onClose()
    },
  })

  const isBusy = save.isPending || remove.isPending

  return (
    <Modal open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <ModalContent className="max-w-[560px]">
        <ModalTitle className="pr-8 text-[18px] font-bold text-[#111827]">
          Edit banner
        </ModalTitle>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-3 py-2.5">
            <div>
              <p className="text-[14px] font-semibold text-[#111827]">Published</p>
              <p className="text-[12px] text-[#6B7280]">
                Visible to students when on.
              </p>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={setIsPublished}
              aria-label="Published"
            />
          </div>

          <div>
            <p className={LABEL}>Title</p>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <p className={LABEL}>Description</p>
            <RichTextEditor value={description} onChange={setDescription} />
          </div>
          <div className="flex gap-3">
            <div className="w-1/2">
              <p className={LABEL}>CTA text</p>
              <input
                type="text"
                value={ctaText}
                onChange={(event) => setCtaText(event.target.value)}
                className={INPUT}
              />
            </div>
            <div className="w-1/2">
              <p className={LABEL}>CTA link</p>
              <input
                type="text"
                value={ctaUrl}
                onChange={(event) => setCtaUrl(event.target.value)}
                className={INPUT}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              trackMasaiverse(MASAIVERSE_EVENTS.bannerDelete, {
                banner_id: banner.id,
                banner_title: banner.title,
              })
              remove.mutate()
            }}
            disabled={isBusy}
            className="rounded-[12px] border border-[#FCA5A5] px-4 py-2.5 text-[14px] font-semibold text-[#DC2626] transition-colors hover:bg-[#FEF2F2] disabled:opacity-50"
          >
            {remove.isPending ? 'Deleting…' : 'Delete'}
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] border border-[#E5E7EB] px-5 py-2.5 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                trackMasaiverse(MASAIVERSE_EVENTS.bannerSave, {
                  banner_id: banner.id,
                  banner_title: title,
                  is_published: isPublished,
                })
                save.mutate()
              }}
              disabled={isBusy}
              className="rounded-[12px] bg-[#111827] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#1F2937] disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
