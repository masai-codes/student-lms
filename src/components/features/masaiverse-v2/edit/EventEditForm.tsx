import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ImageUploadField from './ImageUploadField'
import HostedByEditor from './eventEditors/HostedByEditor'
import {
  
  toEventFormState,
  toEventPatch
} from './eventEditors/eventFormState'
import { istLocalInputToUtcIso, utcIsoToIstLocalInput } from './editDateTime'
import type {EventFormState} from './eventEditors/eventFormState';
import { RichTextEditor } from '@/components/discussion-post-card/rich-text-editor'
import { Switch } from '@/components/ui/switch'
import { updateMasaiverseV2Event } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { masaiverseV2EventEditDataQuery } from '@/query/masaiverse-v2/eventsQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'

type EventEditFormProps = {
  eventId: string
  onClose: () => void
}

const LABEL = 'mb-1 text-[12px] font-semibold text-[#6B7280]'
const INPUT =
  'w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#111928] outline-none'

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-3 py-2.5">
      <div>
        <p className="text-[14px] font-semibold text-[#111827]">{label}</p>
        <p className="text-[12px] text-[#6B7280]">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}

/** The admin event edit form, rendered inside the right drawer. */
export default function EventEditForm({ eventId, onClose }: EventEditFormProps) {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery(masaiverseV2EventEditDataQuery(eventId))
  const [form, setForm] = useState<EventFormState | null>(null)

  useEffect(() => {
    if (data && !form) setForm(toEventFormState(data))
  }, [data, form])

  const mutation = useMutation({
    mutationFn: () =>
      updateMasaiverseV2Event(eventId, toEventPatch(form as EventFormState)),
    onSuccess: async () => {
      trackMasaiverse(MASAIVERSE_EVENTS.eventUpdate, {
        event_id: eventId,
        is_published: form?.isPublished,
      })
      await queryClient.invalidateQueries({
        queryKey: ['masaiverse-v2', 'event', eventId],
      })
      void queryClient.invalidateQueries({ queryKey: ['masaiverse-v2', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['masaiverse-v2', 'home'] })
      onClose()
    },
  })

  if (isPending || !form) {
    return (
      <p role="status" className="text-[13px] text-[#9CA3AF]">
        Loading event…
      </p>
    )
  }

  const set = <TKey extends keyof EventFormState>(
    key: TKey,
    value: EventFormState[TKey],
  ) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  const isOffline = form.mode === 'offline'

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      className="flex flex-col gap-5 pb-20"
    >
      <ToggleRow
        label="Published"
        hint="Visible to students when on."
        checked={form.isPublished}
        onChange={(next) => set('isPublished', next)}
      />
      <ToggleRow
        label="Weekly connect"
        hint="Marks this as a recurring weekly session."
        checked={form.isWeeklyConnect}
        onChange={(next) => set('isWeeklyConnect', next)}
      />

      <div>
        <p className={LABEL}>Title</p>
        <input
          type="text"
          value={form.title}
          onChange={(event) => set('title', event.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <p className={LABEL}>Above title</p>
        <input
          type="text"
          value={form.aboveTitle}
          onChange={(event) => set('aboveTitle', event.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <p className={LABEL}>Below title</p>
        <input
          type="text"
          value={form.belowTitle}
          onChange={(event) => set('belowTitle', event.target.value)}
          className={INPUT}
        />
      </div>

      <ImageUploadField
        label="Banner image"
        value={form.imageLink}
        onChange={(url) => set('imageLink', url)}
      />

      <div className="flex gap-3">
        <div className="w-1/2">
          <p className={LABEL}>Category</p>
          <select
            value={form.category}
            onChange={(event) => set('category', event.target.value)}
            className={INPUT}
          >
            <option value="">—</option>
            <option value="hackathon">Hackathon</option>
            <option value="meetup">Meetup</option>
            <option value="webinar">Webinar</option>
            <option value="session">Session</option>
            <option value="challenge">Challenge</option>
            <option value="contest">Contest</option>
            <option value="offline_meetup">Offline Meetup</option>
          </select>
        </div>
        <div className="w-1/2">
          <p className={LABEL}>Mode</p>
          <select
            value={form.mode}
            onChange={(event) => set('mode', event.target.value)}
            className={INPUT}
          >
            <option value="">—</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div>
        <p className={LABEL}>Host club</p>
        <select
          value={form.clubId}
          onChange={(event) => set('clubId', event.target.value)}
          className={INPUT}
        >
          <option value="">None (community-wide)</option>
          {(data?.clubs ?? []).map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="w-1/2">
          <p className={LABEL}>Start time (IST)</p>
          <input
            type="datetime-local"
            value={utcIsoToIstLocalInput(form.startTime)}
            onChange={(event) =>
              set('startTime', istLocalInputToUtcIso(event.target.value) ?? '')
            }
            className={INPUT}
          />
        </div>
        <div className="w-1/2">
          <p className={LABEL}>End time (IST)</p>
          <input
            type="datetime-local"
            value={utcIsoToIstLocalInput(form.endTime)}
            onChange={(event) =>
              set('endTime', istLocalInputToUtcIso(event.target.value) ?? '')
            }
            className={INPUT}
          />
        </div>
      </div>

      {/* Online events show a join link + platform; offline events show a
          venue + map link. */}
      {isOffline ? (
        <>
          <div>
            <p className={LABEL}>Location title</p>
            <input
              type="text"
              value={form.locationTitle}
              onChange={(event) => set('locationTitle', event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <p className={LABEL}>Location map link</p>
            <input
              type="text"
              value={form.locationMapLink}
              onChange={(event) => set('locationMapLink', event.target.value)}
              className={INPUT}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <p className={LABEL}>Event link</p>
            <input
              type="text"
              value={form.eventLink}
              onChange={(event) => set('eventLink', event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <p className={LABEL}>Platform</p>
            <input
              type="text"
              value={form.platform}
              onChange={(event) => set('platform', event.target.value)}
              className={INPUT}
            />
          </div>
        </>
      )}

      <div>
        <p className={LABEL}>About this event</p>
        <RichTextEditor
          value={form.description}
          onChange={(value) => set('description', value)}
        />
      </div>
      <div>
        <p className={LABEL}>Event summary (post-event recap)</p>
        <RichTextEditor
          value={form.eventSummary}
          onChange={(value) => set('eventSummary', value)}
        />
      </div>
      <div>
        <p className={LABEL}>Registration confirmation text</p>
        <RichTextEditor
          value={form.confirmationModalText}
          onChange={(value) => set('confirmationModalText', value)}
        />
      </div>
      <div>
        <p className={LABEL}>Past-event emoji</p>
        <input
          type="text"
          value={form.pastEventEmojiValue}
          onChange={(event) => set('pastEventEmojiValue', event.target.value)}
          className={INPUT}
        />
      </div>

      <HostedByEditor
        label="Hosted by"
        value={form.hostedBy}
        onChange={(value) => set('hostedBy', value)}
      />

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-[#E5E7EB] bg-white px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[12px] border border-[#E5E7EB] px-5 py-2.5 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-[12px] bg-[#111827] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#1F2937] disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
