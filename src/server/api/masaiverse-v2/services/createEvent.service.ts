import { db } from '@/db'
import { events } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import {
  LAST_EDITED_AT_META_KEY,
  LAST_EDITED_BY_META_KEY,
  PUBLISHED_META_KEY,
} from '@/server/api/masaiverse-v2/services/publishVisibility'
import { toMysqlUtc } from '@/lib/dateRanges'

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
/** Placeholder banner/avatar art for freshly created drafts. */
const DUMMY_AVATAR =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/a868b969-413c-40b1-9b91-cecbc74409aa/zgIlvdtQpualq2QM.png'

/**
 * Creates a brand-new event as an unpublished (draft) row owned by `userId`,
 * pre-filled with placeholder data the admin can edit later. Rejects non-admins
 * with a 403 — creating events is an admin-only capability.
 *
 * The draft is created with `meta.isPublished = false`, so it is visible only to
 * admins in admin mode until they publish it.
 */
export async function createMasaiverseEvent(
  userId: number,
  now: Date = new Date(),
): Promise<{ id: string }> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) {
    throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  }

  const seed = now.getTime()
  const nowUtc = toMysqlUtc(now)
  const startUtc = toMysqlUtc(new Date(seed + 7 * DAY_MS))
  const endUtc = toMysqlUtc(new Date(seed + 7 * DAY_MS + 2 * HOUR_MS))

  const meta = {
    aboveTitle: 'Above title',
    belowTitle: 'Below title',
    isWeeklyConnect: false,
    pastEventEmojiValue: '⚡',
    confirmationModalText:
      'By registering you confirm your spot for this event. <b>See you there!</b>',
    hostedBy: [{ host: 'Event Host', imageUrl: DUMMY_AVATAR }],
    eventSummary:
      'A quick recap of this event will appear here once it wraps. Edit this draft before publishing.',
    [PUBLISHED_META_KEY]: false,
    [LAST_EDITED_BY_META_KEY]: userId,
    [LAST_EDITED_AT_META_KEY]: now.toISOString(),
  }

  // Fill BOTH the online (eventLink/platform) and offline (locationTitle/
  // locationMapLink) columns even though the UI shows them conditionally by
  // `mode` — it's safe, and keeps every draft fully editable later.
  const [header] = await db.insert(events).values({
    clubId: null,
    title: 'New Event (Draft)',
    description:
      'Event description goes here. Edit this draft before publishing.',
    category: 'meetup',
    mode: 'online',
    locationTitle: 'Masai HQ, Bengaluru',
    locationMapLink: 'https://maps.google.com/?q=Masai+School+Bengaluru',
    eventLink: 'https://meet.google.com/abc-defg-hij',
    imageLink: `https://picsum.photos/seed/event-${seed}/800/400`,
    platform: 'Google Meet',
    startTime: startUtc,
    endTime: endUtc,
    meta,
    createdBy: userId,
    createdAt: nowUtc,
    updatedAt: nowUtc,
  })

  return { id: String(header.insertId) }
}
