export function getDiscussionRepliesToggleLabel(
  expanded: boolean,
  replyCount: number,
): string {
  if (expanded) return 'Hide replies'
  if (replyCount <= 0) return 'Reply'
  if (replyCount === 1) return 'View 1 reply'
  return `View ${replyCount} replies`
}
