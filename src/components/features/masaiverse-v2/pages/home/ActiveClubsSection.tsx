import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import CarouselNavButtons from './CarouselNavButtons'
import HomeClubCard from './HomeClubCard'
import SectionHeader from './SectionHeader'
import { HomeClubCardSkeleton, repeat } from './skeletons'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'
import 'swiper/css'
import 'swiper/css/navigation'

export default function ActiveClubsSection() {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const clubs = data?.clubs ?? []

  return (
    <section>
      <SectionHeader
        title="Active Clubs"
        subtitle="join the conversation"
        action={
          <Link
            to="/masaiverse/clubs"
            search={(prev) => prev}
            onClick={() =>
              trackMasaiverse(MASAIVERSE_EVENTS.seeAllClick, {
                section: 'home_active_clubs',
                to: 'clubs',
              })
            }
            className="text-[14px] font-medium text-masaiverse-orange hover:underline"
          >
            All clubs →
          </Link>
        }
      />
      {isPending ? (
        <div
          role="status"
          aria-label="Loading clubs"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <span className="sr-only">Loading clubs…</span>
          {repeat(3, (key) => (
            <HomeClubCardSkeleton key={key} />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <p className="text-[14px] text-[#6B7280]">No clubs yet.</p>
      ) : (
        <div className="relative">
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: '.home-clubs-prev',
              nextEl: '.home-clubs-next',
            }}
            spaceBetween={16}
            // Fixed-width cards (capped) so they don't sprawl on wide screens;
            // the track packs in as many as fit and scrolls the rest.
            // `watchOverflow` (default) hides the nav when everything fits.
            slidesPerView="auto"
            className="[&_.swiper-slide]:!h-auto [&_.swiper-slide]:!w-[300px] sm:[&_.swiper-slide]:!w-[320px] [&_.swiper-wrapper]:items-stretch"
          >
            {clubs.map((club) => (
              <SwiperSlide key={club.id} className="!h-auto">
                <Link
                  to="/masaiverse/club/$clubId"
                  params={{ clubId: club.id }}
                  search={(prev) => prev}
                  onClick={() =>
                    trackMasaiverse(MASAIVERSE_EVENTS.clubCardClick, {
                      club_id: club.id,
                      source: 'home_active_clubs',
                    })
                  }
                  className="flex h-full rounded-[14px] transition-shadow hover:shadow-[0_4px_16px_rgba(17,24,39,0.06)] [&>div]:w-full"
                >
                  <HomeClubCard club={club} />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {clubs.length > 1 ? (
            <CarouselNavButtons
              prevClassName="home-clubs-prev"
              nextClassName="home-clubs-next"
              label="clubs"
              trackingId="home_clubs"
            />
          ) : null}
        </div>
      )}
    </section>
  )
}
