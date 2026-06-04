import CommunityDiscussionsSection from '../home/CommunityDiscussionsSection'

type ClubDiscussionsSectionProps = {
  clubId: string
}

/**
 * Club page discussions — reuses the home community-discussions feed, scoped
 * to this club so only its posts show and new posts are tied to it.
 */
export default function ClubDiscussionsSection({
  clubId,
}: ClubDiscussionsSectionProps) {
  return <CommunityDiscussionsSection clubId={clubId} title="Club Discussion" />
}
