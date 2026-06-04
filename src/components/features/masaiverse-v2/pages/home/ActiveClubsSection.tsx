import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import CarouselNavButtons from './CarouselNavButtons'
import HomeClubCard from './HomeClubCard'
import SectionHeader from './SectionHeader'
import { HomeClubCardSkeleton, repeat } from './skeletons'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'
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
            slidesPerView={1.1}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3 },
            }}
            className="[&_.swiper-slide]:!h-auto [&_.swiper-wrapper]:items-stretch"
          >
            {clubs.map((club) => (
              <SwiperSlide key={club.id} className="!h-auto">
                <HomeClubCard club={club} />
              </SwiperSlide>
            ))}
          </Swiper>

          {clubs.length > 1 ? (
            <CarouselNavButtons
              prevClassName="home-clubs-prev"
              nextClassName="home-clubs-next"
              label="clubs"
            />
          ) : null}
        </div>
      )}
    </section>
  )
}
