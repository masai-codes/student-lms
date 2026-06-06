import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'

type AboutClubSectionProps = {
  club: MasaiverseV2ClubDetail
}

/**
 * "About the Club" section — a description paragraph followed by a grid of
 * labelled facts (Founded, Current Tenure, …). Both come from `clubs.meta`
 * (`aboutCardDescription` + `aboutCardDetails`); the whole section is hidden
 * when neither is set.
 */
export default function AboutClubSection({ club }: AboutClubSectionProps) {
  const { aboutDescription, aboutDetails } = club
  if (!aboutDescription && aboutDetails.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 text-[20px] font-bold leading-7 text-[#111827]">
        About the Club
      </h2>
      <div className="rounded-[20px] border border-[#EDEAE8] bg-white p-6 sm:p-8">
        {aboutDescription ? (
          <p className="text-[16px] leading-7 text-[#4B5563]">
            {aboutDescription}
          </p>
        ) : null}

        {aboutDetails.length > 0 ? (
          <>
            {aboutDescription ? (
              <hr className="my-6 border-t border-[#EDEAE8]" />
            ) : null}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-3">
              {aboutDetails.map((detail, index) => (
                <div key={`${detail.heading}-${index}`}>
                  <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    {detail.heading}
                  </dt>
                  <dd className="mt-1 text-[16px] font-bold text-[#111827]">
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
