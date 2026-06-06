import { describe, expect, it } from 'vitest'
import {
  LEADERBOARD_POINTS,
  LeaderboardReason,
} from '../services/leaderboardPoints'

describe('LEADERBOARD_POINTS', () => {
  it('matches the agreed scoring for every reason', () => {
    expect(LEADERBOARD_POINTS).toEqual({
      post_creation: 10,
      upvote_receive_on_post: 1,
      upvote_receive_on_reply: 1,
      upvote_given_on_post: 1,
      upvote_given_on_reply: 1,
      reply_given: 5,
      reply_received: 5,
    })
  })

  it('has a points value for every reason enum member', () => {
    for (const reason of Object.values(LeaderboardReason)) {
      expect(LEADERBOARD_POINTS[reason]).toBeGreaterThan(0)
    }
  })
})
