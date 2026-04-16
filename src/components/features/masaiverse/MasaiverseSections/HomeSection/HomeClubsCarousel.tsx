import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { ClubType } from '@/server/masaiverse/fetchClubs'
import { ClubCard } from '@/components/club-card'
import { Button } from '@/components/ui/button'
import { mapClubToCardProps } from '@/components/features/masaiverse/MasaiverseSections/cardDataMappers'
import {
  MASAIVERSE_DRAWER_SCROLL_BODY_PADDING,
  MASAIVERSE_MOBILE_TAB_DRAWER_CONTENT_INSET,
  MASAIVERSE_MOBILE_TAB_DRAWER_FOOTER_INSET,
} from '@/constants/masaiverseDrawerUi'

type HomeClubsCarouselProps = {
  isLoading: boolean
  clubsList: Array<ClubType>
  orderedClubsList: Array<ClubType>
  joinedClubId: string | null
  onClubJoin: (clubId: string) => void
}

type ClubSlideProps = {
  club: ClubType
  joinedClubId: string | null
  onClubJoin: (clubId: string) => void
}

const ClubSlide = ({ club, joinedClubId, onClubJoin }: ClubSlideProps) => {
  const clubCardProps = mapClubToCardProps(club)
  const clubId = String(club.id)
  const isJoinedClub = joinedClubId === clubId
  const hasJoinedAnotherClub = Boolean(joinedClubId && !isJoinedClub)
  const hasJoinedAtLeastOneClub = Boolean(joinedClubId)

  return (
    <div
      className={`flex w-full min-w-0 [&>div]:!max-w-none ${
        isJoinedClub || hasJoinedAnotherClub
          ? '[&_button]:pointer-events-none'
          : ''
      } [&>div]:flex [&>div]:h-full [&>div]:w-full [&>div]:flex-col`}
    >
      <ClubCard
        {...clubCardProps}
        drawerBottomInsetClassName={MASAIVERSE_MOBILE_TAB_DRAWER_CONTENT_INSET}
        drawerBodyClassName={MASAIVERSE_DRAWER_SCROLL_BODY_PADDING}
        drawerPinFooter
        drawerFooterClassName={MASAIVERSE_MOBILE_TAB_DRAWER_FOOTER_INSET}
        shouldCompress={hasJoinedAtLeastOneClub}
        showSuccessIcon={isJoinedClub}
        ctaText={isJoinedClub ? 'Joined' : clubCardProps.ctaText}
        cardCtaText={isJoinedClub ? 'Joined' : clubCardProps.ctaText}
        drawerCtaText={isJoinedClub ? 'Joined' : clubCardProps.ctaText}
        onCtaClick={
          isJoinedClub || hasJoinedAnotherClub
            ? undefined
            : () => {
                onClubJoin(clubId)
              }
        }
      />
    </div>
  )
}

const HomeClubsCarousel = ({
  isLoading,
  clubsList,
  orderedClubsList,
  joinedClubId,
  onClubJoin,
}: HomeClubsCarouselProps) => {
  return (
    <div className="mt-8">
      <h2 className="text-[18px] font-semibold text-[#111827]">
        Student Clubs
      </h2>

      {isLoading ? (
        <p className="mt-3 text-sm text-[#6B7280]">Loading clubs...</p>
      ) : clubsList.length === 0 ? (
        <p className="mt-3 text-sm text-[#6B7280]">
          No clubs available right now.
        </p>
      ) : (
        <div className="relative mt-4 overflow-hidden">
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: '.clubs-prev',
              nextEl: '.clubs-next',
            }}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              768: {
                slidesPerView: 2,
              },
            }}
            className="w-full px-2 [&_.swiper-wrapper]:items-stretch [&_.swiper-slide]:!h-auto"
          >
            {orderedClubsList.map((club) => (
              <SwiperSlide key={club.id} className="!flex !h-auto">
                <ClubSlide
                  club={club}
                  joinedClubId={joinedClubId}
                  onClubJoin={onClubJoin}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="mt-4 flex justify-end gap-2 pr-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="clubs-prev rounded-full bg-white"
              aria-label="Previous clubs"
            >
              <ChevronLeft className="h-4 w-4 text-[#EF8833]" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="clubs-next rounded-full bg-white"
              aria-label="Next clubs"
            >
              <ChevronRight className="h-4 w-4 text-[#EF8833]" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeClubsCarousel
