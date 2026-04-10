# Masaiverse Discussion Sorting Algorithm

This document explains how the `Hot`, `Top`, and `New` discussion filters are computed for Masaiverse community posts.

## Data model used by sorting

Sorting is based on the existing discussion schema:

- `posts`
  - `id`, `club_id`, `user_id`, `content`, `created_at`, `updated_at`
- `replies`
  - `id`, `post_id`, `user_id`, `content`, `created_at`, `updated_at`
- `votes`
  - `id`, `user_id`, `post_id` or `reply_id`, `vote` (`upvote` or `downvote`), `created_at`
- `club_members`
  - used to scope discussions to the current user's joined club
- `club_post_bookmarks`
  - bookmark state only (not part of ranking score)

## Signals used in ranking

For each post, the backend computes:

- `upvotes`: number of `upvote` votes on the post
- `downvotes`: number of `downvote` votes on the post
- `netVotes = upvotes - downvotes`
- `replyCount`: number of replies on the post
- `totalInteractions = upvotes + downvotes + replyCount`
- `ageHours`: hours since the post was created
- `hoursSinceLastActivity`: hours since latest of:
  - post creation
  - latest reply creation on that post
  - latest vote creation on that post

## Sorting modes

### 1) `New`

Pure recency sort:

- Sort by `posts.created_at DESC`

Use this when users want the latest discussions first.

### 2) `Top`

Quality-weighted ranking:

- `topScore = netVotes + log10(totalInteractions + 1)`

Sort by:

1. `topScore DESC`
2. `netVotes DESC` (tie-breaker)

Why: net sentiment is primary; log term gives small confidence boost to posts with broader engagement.

### 3) `Hot`

Trending ranking with freshness decay:

- `hotScore = netVotes * 3.5 + replyCount * 2.5 + log10(totalInteractions + 1) * 4 - ageHours * 0.15 - hoursSinceLastActivity * 0.35`

Sort by:

1. `hotScore DESC`
2. `netVotes DESC` (tie-breaker)

Why:

- Rewards upvotes and active conversations (replies)
- Rewards broad engagement (log interaction factor)
- Penalizes old/stale threads so active discussions rise faster

## API contract

`fetchCommunityDiscussions` now accepts:

- `sortBy: 'hot' | 'top' | 'new'` (default fallback: `'new'`)

Response includes:

- `sortBy`: normalized mode used by backend
- `posts`: sorted list according to selected mode

## Frontend behavior

The discussions UI now renders three pill buttons above the discussion list:

- `Hot`
- `Top`
- `New`

Selecting a pill refetches discussions with corresponding `sortBy` and updates the list.

## Tuning guidance

To tune ranking behavior, edit constants in backend scoring:

- Increase `netVotes` multiplier to favor vote-driven ranking
- Increase `replyCount` multiplier to favor conversational threads
- Increase age/activity penalties to make feed more time-sensitive
- Reduce penalties for a more stable ranking over time
