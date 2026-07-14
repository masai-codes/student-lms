import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ImageUploadField from './ImageUploadField'
import GalleryImagesEditor from './clubEditors/GalleryImagesEditor'
import KeyValueListEditor from './clubEditors/KeyValueListEditor'
import LearningTenureEditor from './clubEditors/LearningTenureEditor'
import StringListEditor from './clubEditors/StringListEditor'
import { toClubFormState, toClubPatch } from './clubEditors/clubFormState'
import type { ClubFormState } from './clubEditors/clubFormState'
import { RichTextEditor } from '@/components/discussion-post-card/rich-text-editor'
import { Switch } from '@/components/ui/switch'
import { updateMasaiverseV2Club } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import {
  masaiverseV2ClubDetailQuery,
  masaiverseV2ClubEditDataQuery,
} from '@/query/masaiverse-v2/clubsQuery'
import { MASAIVERSE_V2_HOME_KEY } from '@/query/masaiverse-v2/homeQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'

type ClubEditFormProps = {
  clubId: string
  onClose: () => void
}

const LABEL = 'mb-1 text-[12px] font-semibold text-foreground-muted'
const INPUT =
  'w-full rounded-lg border border-border px-3 py-2 text-[14px] text-foreground outline-none'

/** The admin club edit form, rendered inside the right drawer. */
export default function ClubEditForm({ clubId, onClose }: ClubEditFormProps) {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery(masaiverseV2ClubEditDataQuery(clubId))
  const [form, setForm] = useState<ClubFormState | null>(null)

  useEffect(() => {
    if (data && !form) setForm(toClubFormState(data))
  }, [data, form])

  const mutation = useMutation({
    mutationFn: () =>
      updateMasaiverseV2Club(clubId, toClubPatch(form as ClubFormState)),
    onSuccess: async () => {
      trackMasaiverse(MASAIVERSE_EVENTS.clubUpdate, {
        club_id: clubId,
        is_published: form?.isPublished,
      })
      await queryClient.invalidateQueries({
        queryKey: masaiverseV2ClubDetailQuery(clubId).queryKey,
      })
      void queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_HOME_KEY })
      onClose()
    },
  })

  if (isPending || !form) {
    return (
      <p role="status" className="text-[13px] text-foreground-subtle">
        Loading club…
      </p>
    )
  }

  const set = <TKey extends keyof ClubFormState>(
    key: TKey,
    value: ClubFormState[TKey],
  ) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="flex flex-col gap-5 pb-20"
    >
      <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2.5">
        <div>
          <p className="text-[14px] font-semibold text-foreground">Published</p>
          <p className="text-[12px] text-foreground-muted">
            Visible to students when on.
          </p>
        </div>
        <Switch
          checked={form.isPublished}
          onCheckedChange={(next) => set('isPublished', next)}
          aria-label="Published"
        />
      </div>

      <div>
        <p className={LABEL}>Club name</p>
        <input
          type="text"
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          className={INPUT}
        />
      </div>

      <ImageUploadField
        label="Card / banner image"
        value={form.cardImageLink}
        onChange={(url) => set('cardImageLink', url)}
      />

      <div>
        <p className={LABEL}>Below-title card text</p>
        <input
          type="text"
          value={form.belowTitleCardText}
          onChange={(event) => set('belowTitleCardText', event.target.value)}
          className={INPUT}
        />
      </div>

      <div>
        <p className={LABEL}>Card description</p>
        <textarea
          value={form.cardDescription}
          onChange={(event) => set('cardDescription', event.target.value)}
          className={`${INPUT} min-h-16 resize-y`}
        />
      </div>

      <div>
        <p className={LABEL}>About the club (description)</p>
        <RichTextEditor
          value={form.description}
          onChange={(value) => set('description', value)}
        />
      </div>

      <StringListEditor
        label="Banner tags"
        value={form.clubDetailBannerTags}
        onChange={(value) => set('clubDetailBannerTags', value)}
        placeholder="e.g. Code · DSA"
      />

      <KeyValueListEditor
        label="About card details"
        value={form.aboutCardDetails}
        onChange={(value) => set('aboutCardDetails', value)}
      />

      <div>
        <p className={LABEL}>Learning tenure date text</p>
        <input
          type="text"
          value={form.learningTenureDateText}
          onChange={(event) =>
            set('learningTenureDateText', event.target.value)
          }
          className={INPUT}
        />
      </div>

      <LearningTenureEditor
        label="Learning tenure cards"
        value={form.learningTenureData}
        onChange={(value) => set('learningTenureData', value)}
      />

      <div>
        <p className={LABEL}>Projects built</p>
        <input
          type="number"
          value={form.projectsBuild}
          onChange={(event) => set('projectsBuild', event.target.value)}
          className={INPUT}
        />
      </div>

      <GalleryImagesEditor
        label="Gallery images"
        value={form.galleryImages}
        onChange={(value) => set('galleryImages', value)}
      />

      <div>
        <p className={LABEL}>Join confirmation text</p>
        <RichTextEditor
          value={form.confirmationModalText}
          onChange={(value) => set('confirmationModalText', value)}
        />
      </div>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-border bg-surface px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[12px] border border-border px-5 py-2.5 text-[14px] font-semibold text-foreground hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-[12px] bg-foreground px-5 py-2.5 text-[14px] font-bold text-background hover:bg-foreground/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
