import { sendTrackingEvent } from '@/utils/tracking'

/**
 * Central Google Analytics tracking for Masaiverse v2.
 *
 * All masaiverse funnel events are fired through `trackMasaiverse` so the data
 * team gets a consistent, snake_cased event namespace (`masaiverse_*`) with
 * predictable params. `user_id` is appended automatically by
 * `sendTrackingEvent`, so callers never need to pass it.
 *
 * Keep event names additive — renaming a name breaks any funnel built on top
 * of it in GA. Prefer adding a new param over renaming an event.
 */

export const MASAIVERSE_EVENTS = {
  // Navigation
  navClick: 'masaiverse_nav_click',
  backClick: 'masaiverse_back_click',

  // Generic content open (card / list item -> detail)
  clubCardClick: 'masaiverse_club_card_click',
  eventCardClick: 'masaiverse_event_card_click',
  seeAllClick: 'masaiverse_see_all_click',
  carouselNav: 'masaiverse_carousel_nav',

  // Clubs
  clubCreateClick: 'masaiverse_club_create_click',
  clubEditClick: 'masaiverse_club_edit_click',
  clubUpdate: 'masaiverse_club_update',
  clubJoinClick: 'masaiverse_club_join_click',
  clubJoinSuccess: 'masaiverse_club_join_success',
  clubShareClick: 'masaiverse_club_share_click',
  clubGalleryOpen: 'masaiverse_club_gallery_open',

  // Events
  eventCreateClick: 'masaiverse_event_create_click',
  eventEditClick: 'masaiverse_event_edit_click',
  eventUpdate: 'masaiverse_event_update',
  eventsTabChange: 'masaiverse_events_tab_change',
  eventsScopeChange: 'masaiverse_events_scope_change',
  eventsSearch: 'masaiverse_events_search',
  eventRegisterClick: 'masaiverse_event_register_click',
  eventRegisterSuccess: 'masaiverse_event_register_success',
  eventExternalLinkClick: 'masaiverse_event_external_link_click',
  eventRatingSubmit: 'masaiverse_event_rating_submit',

  // Discussions
  discussionsTabChange: 'masaiverse_discussions_tab_change',
  discussionComposeOpen: 'masaiverse_discussion_compose_open',
  discussionCreate: 'masaiverse_discussion_create',
  discussionSearch: 'masaiverse_discussion_search',
  discussionRepliesToggle: 'masaiverse_discussion_replies_toggle',
  discussionReplyCreate: 'masaiverse_discussion_reply_create',
  discussionVote: 'masaiverse_discussion_vote',
  discussionExpandToggle: 'masaiverse_discussion_expand_toggle',
  discussionLoadMore: 'masaiverse_discussion_load_more',

  // Leaderboard
  leaderboardTabChange: 'masaiverse_leaderboard_tab_change',
  leaderboardPeriodChange: 'masaiverse_leaderboard_period_change',
  pointsAssignClick: 'masaiverse_points_assign_click',
  pointsAssign: 'masaiverse_points_assign',

  // Calendar
  calendarOpen: 'masaiverse_calendar_open',
  calendarClose: 'masaiverse_calendar_close',
  calendarMonthNav: 'masaiverse_calendar_month_nav',
  calendarDaySelect: 'masaiverse_calendar_day_select',

  // Banners (home announcements)
  bannerCreateClick: 'masaiverse_banner_create_click',
  bannerEditClick: 'masaiverse_banner_edit_click',
  bannerSave: 'masaiverse_banner_save',
  bannerDelete: 'masaiverse_banner_delete',
  bannerCtaClick: 'masaiverse_banner_cta_click',
  bannerExpandToggle: 'masaiverse_banner_expand_toggle',

  // Admin
  adminModeToggle: 'masaiverse_admin_mode_toggle',
} as const

export type MasaiverseEventName =
  (typeof MASAIVERSE_EVENTS)[keyof typeof MASAIVERSE_EVENTS]

type TrackingValue = string | number | boolean | null | undefined

export function trackMasaiverse(
  event: MasaiverseEventName,
  params: Record<string, TrackingValue> = {},
) {
  const payload: Record<string, string> = { event }
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    payload[key] = String(value)
  }
  sendTrackingEvent(payload)
}
