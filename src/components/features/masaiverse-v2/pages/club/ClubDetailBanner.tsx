import JoinClubButton from './JoinClubButton'
import ShareClubButton from './ShareClubButton'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'
import { getInitials } from '@/lib/initials'
import { formatMemberCount } from '@/lib/pluralize'

type ClubDetailBannerProps = {
  club: MasaiverseV2ClubDetail
}

type Pill = { label: string; accent: boolean }

/** Builds the banner pill row: first meta tag accented, live member count, rest. */
function buildPills(club: MasaiverseV2ClubDetail): Array<Pill> {
  const [first, ...rest] = club.bannerTags
  const pills: Array<Pill> = []
  if (first) pills.push({ label: first, accent: true })
  pills.push({
    label: formatMemberCount(club.memberCount),
    accent: false,
  })
  for (const tag of rest) pills.push({ label: tag, accent: false })
  return pills
}

/**
 * First section of the club page — the dark hero banner with the club image,
 * title, subtitle, configurable tag pills, and the Join / Share actions.
 */
export default function ClubDetailBanner({ club }: ClubDetailBannerProps) {
  const pills = buildPills(club)

  return (
    <section className="relative rounded-[20px] bg-[#1C1A19] p-6 sm:p-8">
      {/* Watermark gets its own clip so the section can let the Share popover overflow. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]">
        <span className="absolute -right-10 top-1/2 -translate-y-1/2 select-none text-[160px] font-black leading-none text-white/[0.03]">
          &lt;/&gt;
        </span>
      </div>

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-masaiverse-orange sm:size-[72px]">
            {club.imageUrl ? (
              <img
                src={club.imageUrl}
                alt={club.name}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[24px] font-bold text-white">
                {getInitials(club.name)}
              </span>
            )}
          </span>

          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-8 text-white sm:text-[34px] sm:leading-10">
              {club.name}
            </h1>
            {club.bannerSubtitle ? (
              <p className="mt-1.5 text-[15px] leading-5 text-white/55">
                {club.bannerSubtitle}
              </p>
            ) : null}

            {pills.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {pills.map((pill, index) => (
                  <span
                    key={`${pill.label}-${index}`}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                      pill.accent
                        ? 'bg-masaiverse-orange/20 text-masaiverse-orange'
                        : 'bg-white/[0.07] text-white/70'
                    }`}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-row gap-2.5 sm:flex-col sm:items-end">
          <JoinClubButton
            clubId={club.id}
            isJoined={club.isJoined}
            confirmationModalText={club.confirmationModalText}
          />
          <ShareClubButton />
        </div>
      </div>
    </section>
  )
}
