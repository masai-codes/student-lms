import { useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperClass } from 'swiper/types'
import { CaretLeft, CaretRight, PencilSimple, Plus } from '@phosphor-icons/react'
import BannerEditModal from './BannerEditModal'
import type { MasaiverseV2Banner } from '@/server/api/masaiverse-v2/services/getBanners.service'
import { RichContent } from '@/components/event-card/rich-content'
import { createMasaiverseV2Banner } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import {
  MASAIVERSE_V2_BANNERS_KEY,
  masaiverseV2BannersQuery,
} from '@/query/masaiverse-v2/bannersQuery'
import { masaiverseV2AdminModeQuery } from '@/query/masaiverse-v2/adminModeQuery'
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
  const [expanded, setExpanded] = useState(false)
  // Whether the clamped description actually overflows — only then do we show
  // the "View more" toggle. Measured while collapsed so it stays true once
  // expanded (otherwise "View less" would vanish as soon as it's shown).
  const [canExpand, setCanExpand] = useState(false)
  const descRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = descRef.current
    if (!el || expanded) return
    setCanExpand(el.scrollHeight > el.clientHeight + 1)
  }, [banner.description, expanded])

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
            onClick={onEdit}
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
            className={`mt-1 text-[14px] leading-5 text-white/90 [&_a]:underline ${
              expanded ? '' : 'line-clamp-3'
            }`}
          >
            <RichContent value={banner.description} />
          </div>
          {canExpand || expanded ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[13px] font-semibold text-white underline"
            >
              {expanded ? 'View less' : 'View more'}
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
            className="inline-flex items-center rounded-lg bg-white px-3.5 py-1.5 text-[13px] font-bold text-masaiverse-orange"
          >
            {banner.ctaText}
          </a>
        </div>
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
        {canManage ? (
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#111827] px-3 py-1.5 text-[13px] font-semibold text-[#111827] transition-colors hover:bg-[#111827] hover:text-white disabled:opacity-50"
          >
            <Plus size={14} weight="bold" />
            {create.isPending ? 'Adding…' : 'Add banner'}
          </button>
        ) : null}
      </div>

      {banners.length === 0 ? (
        <p className="mt-3 rounded-[16px] border border-dashed border-[#E0D9D3] bg-white px-4 py-6 text-center text-[13px] text-[#9CA3AF]">
          No banners yet. Click “Add banner” to create one.
        </p>
      ) : (
        <div className="relative mt-3">
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

          {showArrows ? (
            <>
              {/* Vertically centered on the current card. The -16px nudge offsets
                  the slide's pb-8 (pagination strip) so arrows sit on the card's
                  true center; autoHeight re-centers them when a taller/shorter
                  card slides in. */}
              <button
                type="button"
                onClick={() => swiper?.slidePrev()}
                disabled={navState.isBeginning}
                aria-label="Previous banner"
                className="absolute left-0 top-1/2 z-10 inline-flex size-7 -translate-x-1/2 -translate-y-[calc(50%+16px)] items-center justify-center rounded-full bg-white/90 text-masaiverse-orange shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => swiper?.slideNext()}
                disabled={navState.isEnd}
                aria-label="Next banner"
                className="absolute right-0 top-1/2 z-10 inline-flex size-7 translate-x-1/2 -translate-y-[calc(50%+16px)] items-center justify-center rounded-full bg-white/90 text-masaiverse-orange shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </>
          ) : null}
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
