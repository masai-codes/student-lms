import ResponsiveCardCarousel from '../home/ResponsiveCardCarousel'
import SectionHeader from '../home/SectionHeader'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'

type LearningTenureSectionProps = {
  club: MasaiverseV2ClubDetail
}

/**
 * "Learning Tenure" — a row of cards (emoji, heading, text, tag pills) sourced
 * from `clubs.meta.learningTenureData`, with the week label
 * (`meta.learningTenureDateText`) shown as a pill in the header. Hidden when
 * there are no entries.
 */
export default function LearningTenureSection({
  club,
}: LearningTenureSectionProps) {
  const { learningTenure, learningTenureDateText } = club
  if (learningTenure.length === 0) return null

  return (
    <section>
      <SectionHeader
        title="Learning Tenure"
        action={
          learningTenureDateText ? (
            <span className="text-[14px] font-semibold text-foreground-muted">
              {learningTenureDateText}
            </span>
          ) : undefined
        }
      />
      <ResponsiveCardCarousel
        items={learningTenure}
        getKey={(item, index) => `${item.heading}-${index}`}
        navKey="learning-tenure"
        navLabel="learning tenure cards"
        slidesPerView={1.15}
        breakpoints={{
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 3 },
        }}
        renderItem={(item) => (
          <div className="flex h-full flex-col rounded-[16px] border border-border bg-surface p-5">
            {item.emoji ? (
              <span className="flex size-12 items-center justify-center rounded-[14px] bg-accent-warm/10 text-[22px]">
                {item.emoji}
              </span>
            ) : null}
            <p className="mt-4 text-[16px] font-bold leading-5 text-foreground">
              {item.heading}
            </p>
            {item.text ? (
              <p className="mt-1.5 flex-1 text-[14px] leading-5 text-foreground-muted">
                {item.text}
              </p>
            ) : null}
            {item.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag, tagIndex) => (
                  <span
                    key={`${tag}-${tagIndex}`}
                    className="rounded-full bg-accent-warm/10 px-2.5 py-1 text-[12px] font-semibold text-accent-warm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}
      />
    </section>
  )
}
