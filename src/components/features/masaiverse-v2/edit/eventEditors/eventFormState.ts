import type { HostedByItem } from './HostedByEditor'
import type {
  MasaiverseV2EntityPatch,
  MasaiverseV2EventEditData,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'

export type EventFormState = {
  // Columns
  title: string
  description: string
  category: string
  mode: string
  /** Hosting club id as a string ('' = community-wide). */
  clubId: string
  locationTitle: string
  locationMapLink: string
  eventLink: string
  imageLink: string
  platform: string
  /** UTC ISO (or '' when unset). */
  startTime: string
  endTime: string
  // Meta
  aboveTitle: string
  belowTitle: string
  pastEventEmojiValue: string
  eventSummary: string
  confirmationModalText: string
  isWeeklyConnect: boolean
  isPublished: boolean
  hostedBy: Array<HostedByItem>
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function hostedByList(value: unknown): Array<HostedByItem> {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> =>
      Boolean(entry && typeof entry === 'object'),
    )
    .map((entry) => ({ host: str(entry.host), imageUrl: str(entry.imageUrl) }))
}

/** Builds the editable form state from the raw event columns + meta. */
export function toEventFormState(data: MasaiverseV2EventEditData): EventFormState {
  const c = data.columns
  const meta = data.meta
  return {
    title: c.title,
    description: c.description ?? '',
    category: c.category ?? '',
    mode: c.mode ?? '',
    clubId: c.clubId ?? '',
    locationTitle: c.locationTitle ?? '',
    locationMapLink: c.locationMapLink ?? '',
    eventLink: c.eventLink ?? '',
    imageLink: c.imageLink ?? '',
    platform: c.platform ?? '',
    startTime: c.startTime ?? '',
    endTime: c.endTime ?? '',
    aboveTitle: str(meta.aboveTitle),
    belowTitle: str(meta.belowTitle),
    pastEventEmojiValue: str(meta.pastEventEmojiValue),
    eventSummary: str(meta.eventSummary),
    confirmationModalText: str(meta.confirmationModalText),
    isWeeklyConnect: meta.isWeeklyConnect === true,
    isPublished: meta.isPublished === true,
    hostedBy: hostedByList(meta.hostedBy),
  }
}

/** Builds the update patch (columns + meta) from the form state. */
export function toEventPatch(state: EventFormState): MasaiverseV2EntityPatch {
  return {
    column: {
      title: state.title,
      description: state.description,
      category: state.category || null,
      mode: state.mode || null,
      clubId: state.clubId ? Number(state.clubId) : null,
      locationTitle: state.locationTitle,
      locationMapLink: state.locationMapLink,
      eventLink: state.eventLink,
      imageLink: state.imageLink,
      platform: state.platform,
      startTime: state.startTime || null,
      endTime: state.endTime || null,
    },
    meta: {
      aboveTitle: state.aboveTitle,
      belowTitle: state.belowTitle,
      pastEventEmojiValue: state.pastEventEmojiValue,
      eventSummary: state.eventSummary,
      confirmationModalText: state.confirmationModalText,
      isWeeklyConnect: state.isWeeklyConnect,
      isPublished: state.isPublished,
      hostedBy: state.hostedBy,
    },
  }
}
