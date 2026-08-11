import { useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperClass } from 'swiper/types'
import {
  CaretLeft,
  CaretRight,
  Megaphone,
  PencilSimple,
  Plus,
} from '@phosphor-icons/react'
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
    <div className="relative overflow-hidden rounded-2xl border border-accent-warm/15 bg-gradient-to-br from-[#FFF8F3] via-white to-[#FFF6EE] p-5 shadow-[0_2px_16px_-6px_rgba(242,92,4,0.18)] dark:bg-none dark:bg-surface-muted">
      {/* Soft brand glow + left accent bar keep it warm without drowning the text in orange. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-accent-warm/10 blur-3xl"
      />
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent-warm to-[#FF8A3D]"
      />

      {canManage ? (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          {!banner.isPublished ? (
            <span className="rounded-full bg-accent-warm/12 px-2 py-0.5 text-[11px] font-semibold text-accent-warm">
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
            className="inline-flex size-7 items-center justify-center rounded-full bg-accent-warm/10 text-accent-warm transition-colors hover:bg-accent-warm/20"
          >
            <PencilSimple size={14} weight="bold" />
          </button>
        </div>
      ) : null}

      <div className="relative z-10 flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-warm/12 text-accent-warm">
          <Megaphone size={18} weight="fill" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="pr-16 text-[17px] font-bold leading-6 text-foreground">
            {banner.title}
          </h3>
          {banner.description ? (
            <>
              <div
                ref={descRef}
                className="mt-1.5 line-clamp-3 text-[14px] leading-[1.55]"
              >
                <RichContent
                  value={banner.description}
                  className="!text-foreground-muted [&_a]:!text-accent-warm [&_a]:underline [&_blockquote]:!text-foreground-muted [&_h1]:!text-foreground [&_h2]:!text-foreground [&_h3]:!text-foreground [&_h4]:!text-foreground [&_h5]:!text-foreground [&_h6]:!text-foreground [&_li]:!text-foreground-muted [&_p]:!text-foreground-muted [&_strong]:!text-foreground"
                />
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
                  className="mt-1 text-[13px] font-semibold text-accent-warm hover:underline"
                >
                  View more
                </button>
              ) : null}
            </>
          ) : null}
          {banner.ctaText && banner.ctaUrl ? (
            <div className="mt-3.5">
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
                className="inline-flex items-center rounded-lg bg-accent-warm px-4 py-2 text-[13px] font-bold text-accent-warm-foreground shadow-[0_4px_12px_-3px_rgba(242,92,4,0.5)] transition-transform hover:scale-[1.02] active:scale-95"
              >
                {banner.ctaText}
              </a>
            </div>
          ) : null}
        </div>
      </div>

      {banner.description ? (
        <Modal open={detailOpen} onOpenChange={setDetailOpen}>
          <ModalContent className="max-w-[560px]">
            <ModalTitle className="pr-8 text-[18px] font-bold text-foreground">
              {banner.title}
            </ModalTitle>
            <RichContent
              value={banner.description}
              className="mt-3 text-[14px] leading-6 text-foreground [&_a]:text-accent-warm [&_a]:underline"
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
                  className="inline-flex items-center rounded-lg bg-accent-warm px-4 py-2 text-[14px] font-bold text-accent-warm-foreground"
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
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-foreground-subtle">
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
                className="inline-flex size-7 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
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
                className="inline-flex size-7 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-foreground px-3 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              <Plus size={14} weight="bold" />
              {create.isPending ? 'Adding…' : 'Add banner'}
            </button>
          ) : null}
        </div>
      </div>

      {banners.length === 0 ? (
        <p className="mt-3 rounded-[16px] border border-dashed border-border bg-surface px-4 py-6 text-center text-[13px] text-foreground-subtle">
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
