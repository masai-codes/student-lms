import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'
import { RichContent } from '@/components/event-card/rich-content'

type AboutClubSectionProps = {
  club: MasaiverseV2ClubDetail
}

/**
 * "About the Club" section — a markdown/HTML description paragraph (rendered
 * with the shared `RichContent` renderer) followed by a grid of labelled facts
 * (Founded, Current Tenure, …). Hidden when there's nothing to show. Editing
 * happens in the admin "Edit club" drawer, not inline.
 */
export default function AboutClubSection({ club }: AboutClubSectionProps) {
  const { aboutDescription, aboutDetails } = club
  if (!aboutDescription && aboutDetails.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 text-[20px] font-bold leading-7 text-foreground">
        About the Club
      </h2>
      <div className="rounded-[20px] border border-border bg-surface p-6 sm:p-8">
        {aboutDescription ? (
          <RichContent
            value={aboutDescription}
            className="text-[16px] leading-7 text-foreground-muted"
          />
        ) : null}

        {aboutDetails.length > 0 ? (
          <>
            {aboutDescription ? (
              <hr className="my-6 border-t border-border" />
            ) : null}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-3">
              {aboutDetails.map((detail, index) => (
                <div key={`${detail.heading}-${index}`}>
                  <dt className="text-[12px] font-semibold uppercase tracking-wide text-foreground-subtle">
                    {detail.heading}
                  </dt>
                  <dd className="mt-1 text-[16px] font-bold text-foreground">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
      </div>
    </section>
  )
}
