import { useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperClass } from 'swiper/types'
import { CaretLeft, CaretRight, PencilSimple, Plus } from '@phosphor-icons/react'
import BannerEditModal from './BannerEditModal'
import type { MasaiverseV2Banner } from '@/server/api/masaiverse-v2/services/getBanners.service'
import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal'
import { RichContent } from '@/components/event-card/rich-content'
import { createMasaiverseV2Banner } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import {
  MASAIVERSE_V2_BANNERS_KEY,
  masaiverseV2BannersQuery,
} from '@/query/masaiverse-v2/bannersQuery'
import { masaiverseV2AdminModeQuery } from '@/query/masaiverse-v2/adminModeQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'
import 'swiper/css'
import 'swiper/css/pagination'

function BannerCard({
  banner,
  canManage,
  onEdit,
}: {
  banner: MasaiverseV2Banner
  canManage: boolean
  onEdit: () => void
}) {
  const [detailOpen, setDetailOpen] = useState(false)
  // Whether the clamped description overflows — only then do we show "View
  // more", which opens the full content in a modal rather than expanding inline.
  const [canExpand, setCanExpand] = useState(false)
  const descRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = descRef.current
    if (!el) return
    setCanExpand(el.scrollHeight > el.clientHeight + 1)
  }, [banner.description])

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-r from-masaiverse-orange to-[#FF7A29] p-5 text-white">
      {canManage ? (
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {!banner.isPublished ? (
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-semibold">
              Draft
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              trackMasaiverse(MASAIVERSE_EVENTS.bannerEditClick, {
                banner_id: banner.id,
                banner_title: banner.title,
              })
              onEdit()
            }}
            aria-label={`Edit banner ${banner.title}`}
            className="inline-flex size-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <PencilSimple size={14} weight="bold" />
          </button>
        </div>
      ) : null}

      <h3 className="pr-16 text-[18px] font-bold leading-6">{banner.title}</h3>
      {banner.description ? (
        <>
          <div
            ref={descRef}
            className="mt-1 line-clamp-3 text-[14px] leading-5 text-white/90 [&_a]:underline [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white"
          >
            <RichContent value={banner.description} />
          </div>
          {canExpand ? (
            <button
              type="button"
              onClick={() => {
                trackMasaiverse(MASAIVERSE_EVENTS.bannerExpandToggle, {
                  banner_id: banner.id,
                  banner_title: banner.title,
                  expanded: true,
                })
                setDetailOpen(true)
              }}
              className="mt-1 text-[13px] font-semibold text-white underline"
            >
              View more
            </button>
          ) : null}
        </>
      ) : null}
      {banner.ctaText && banner.ctaUrl ? (
        <div className="mt-3">
          <a
            href={banner.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackMasaiverse(MASAIVERSE_EVENTS.bannerCtaClick, {
                banner_id: banner.id,
                banner_title: banner.title,
                cta_text: banner.ctaText,
                cta_url: banner.ctaUrl,
              })
            }
            className="inline-flex items-center rounded-lg bg-white px-3.5 py-1.5 text-[13px] font-bold text-masaiverse-orange"
          >
            {banner.ctaText}
          </a>
        </div>
      ) : null}

      {banner.description ? (
        <Modal open={detailOpen} onOpenChange={setDetailOpen}>
          <ModalContent className="max-w-[560px]">
            <ModalTitle className="pr-8 text-[18px] font-bold text-[#111827]">
              {banner.title}
            </ModalTitle>
            <RichContent
              value={banner.description}
              className="mt-3 text-[14px] leading-6 text-[#374151] [&_a]:text-masaiverse-orange [&_a]:underline"
            />
            {banner.ctaText && banner.ctaUrl ? (
              <div className="mt-5">
                <a
                  href={banner.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackMasaiverse(MASAIVERSE_EVENTS.bannerCtaClick, {
                      banner_id: banner.id,
                      banner_title: banner.title,
                      cta_text: banner.ctaText,
                      cta_url: banner.ctaUrl,
                    })
                  }
                  className="inline-flex items-center rounded-lg bg-masaiverse-orange px-4 py-2 text-[14px] font-bold text-white"
                >
                  {banner.ctaText}
                </a>
              </div>
            ) : null}
          </ModalContent>
        </Modal>
      ) : null}
    </div>
  )
}

/**
 * Home banners shown above the stats section. Multiple banners rotate in
 * a swiper. Admins in admin mode can add a banner and edit/publish/delete each;
 * students see only published banners (the section hides when there are none).
 */
export default function BannersSection() {
  const queryClient = useQueryClient()
  const { data: banners = [] } = useQuery(masaiverseV2BannersQuery())
  const { data: adminMode } = useQuery(masaiverseV2AdminModeQuery())
  const canManage = adminMode?.enabled ?? false
  const [editing, setEditing] = useState<MasaiverseV2Banner | null>(null)
  const [swiper, setSwiper] = useState<SwiperClass | null>(null)
  const [navState, setNavState] = useState({ isBeginning: true, isEnd: true })
  const showArrows = banners.length > 1

  const syncNavState = (instance: SwiperClass) =>
    setNavState({
      isBeginning: instance.isBeginning,
      isEnd: instance.isEnd,
    })

  const create = useMutation({
    mutationFn: createMasaiverseV2Banner,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_BANNERS_KEY }),
  })

  if (banners.length === 0 && !canManage) return null

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
          Announcements
        </h2>
        <div className="flex items-center gap-2">
          {showArrows ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  trackMasaiverse(MASAIVERSE_EVENTS.carouselNav, {
                    carousel: 'banners',
                    direction: 'prev',
                  })
                  swiper?.slidePrev()
                }}
                disabled={navState.isBeginning}
                aria-label="Previous banner"
                className="inline-flex size-7 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => {
                  trackMasaiverse(MASAIVERSE_EVENTS.carouselNav, {
                    carousel: 'banners',
                    direction: 'next',
                  })
                  swiper?.slideNext()
                }}
                disabled={navState.isEnd}
                aria-label="Next banner"
                className="inline-flex size-7 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          ) : null}
          {canManage ? (
            <button
              type="button"
              onClick={() => {
                trackMasaiverse(MASAIVERSE_EVENTS.bannerCreateClick)
                create.mutate()
              }}
              disabled={create.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#111827] px-3 py-1.5 text-[13px] font-semibold text-[#111827] transition-colors hover:bg-[#111827] hover:text-white disabled:opacity-50"
            >
              <Plus size={14} weight="bold" />
              {create.isPending ? 'Adding…' : 'Add banner'}
            </button>
          ) : null}
        </div>
      </div>

      {banners.length === 0 ? (
        <p className="mt-3 rounded-[16px] border border-dashed border-[#E0D9D3] bg-white px-4 py-6 text-center text-[13px] text-[#9CA3AF]">
          No banners yet. Click “Add banner” to create one.
        </p>
      ) : (
        <div className="mt-3">
          <Swiper
            modules={[Navigation, Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={16}
            slidesPerView={1}
            autoHeight
            onSwiper={(instance) => {
              setSwiper(instance)
              syncNavState(instance)
            }}
            onSlideChange={syncNavState}
          >
            {banners.map((banner) => (
              <SwiperSlide key={banner.id} className="pb-8">
                <BannerCard
                  banner={banner}
                  canManage={canManage}
                  onEdit={() => setEditing(banner)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {editing ? (
        <BannerEditModal
          banner={editing}
          open
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  )
}
