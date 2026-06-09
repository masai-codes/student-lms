/**
 * Single source of truth for masaiverse leaderboard scoring.
 *
 * `LeaderboardReason` values are stored verbatim in
 * `masaiverse_leaderboard.reason`, and `LEADERBOARD_POINTS` is the fixed number
 * of points each reason awards. Keep the two in lockstep.
 */
export enum LeaderboardReason {
  /** A user created a post. */
  POST_CREATION = 'post_creation',
  /** Someone upvoted the user's post. */
  UPVOTE_RECEIVE_ON_POST = 'upvote_receive_on_post',
  /** Someone upvoted the user's reply. */
  UPVOTE_RECEIVE_ON_REPLY = 'upvote_receive_on_reply',
  /** The user upvoted someone else's post. */
  UPVOTE_GIVEN_ON_POST = 'upvote_given_on_post',
  /** The user upvoted someone else's reply. */
  UPVOTE_GIVEN_ON_REPLY = 'upvote_given_on_reply',
  /** The user replied on someone's post. */
  REPLY_GIVEN = 'reply_given',
  /** The user received a reply on their post. */
  REPLY_RECEIVED = 'reply_received',
  /** The user registered for an event. */
  EVENT_REGISTRATION = 'event_registration',
}

/**
 * Reason stored for points an admin assigns by hand. Unlike `LeaderboardReason`
 * the amount is not fixed — the admin supplies it — so it lives outside
 * `LEADERBOARD_POINTS`.
 */
export const MANUAL_LEADERBOARD_REASON = 'manual'

/** Points awarded per reason. */
export const LEADERBOARD_POINTS: Record<LeaderboardReason, number> = {
  [LeaderboardReason.POST_CREATION]: 10,
  [LeaderboardReason.UPVOTE_RECEIVE_ON_POST]: 1,
  [LeaderboardReason.UPVOTE_RECEIVE_ON_REPLY]: 1,
  [LeaderboardReason.UPVOTE_GIVEN_ON_POST]: 1,
  [LeaderboardReason.UPVOTE_GIVEN_ON_REPLY]: 1,
  [LeaderboardReason.REPLY_GIVEN]: 5,
  [LeaderboardReason.REPLY_RECEIVED]: 5,
  [LeaderboardReason.EVENT_REGISTRATION]: 5,
}
