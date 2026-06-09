import { Link } from '@tanstack/react-router'
import SectionHeader from '../home/SectionHeader'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type ClubPhotosSectionProps = {
  club: MasaiverseV2ClubDetail
}

/** Number of photos shown in the mosaic before the "+N more" overlay. */
const MOSAIC_SIZE = 5

function PhotoTile({ src, className }: { src: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#7C3AED] to-[#EC4899] ${className ?? ''}`}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  )
}

/**
 * "Club Photos" — a mosaic of event highlights from `clubs.meta.galleryImages`:
 * one large tile plus a 2×2 grid, with the last tile overlaying "+N more photos"
 * when there are extras. "View gallery" opens the full gallery page. Hidden when
 * the club has no photos.
 */
export default function ClubPhotosSection({ club }: ClubPhotosSectionProps) {
  const photos = club.galleryImages
  if (photos.length === 0) return null

  const [first, ...rest] = photos
  const smallPhotos = rest.slice(0, MOSAIC_SIZE - 1)
  const remaining = photos.length - MOSAIC_SIZE

  return (
    <section>
      <SectionHeader
        title="Club Photos"
        subtitle="Event highlights"
        action={
          <Link
            to="/masaiverse/club/$clubId/gallery"
            params={{ clubId: club.id }}
            search={(prev) => prev}
            onClick={() =>
              trackMasaiverse(MASAIVERSE_EVENTS.clubGalleryOpen, {
                club_id: club.id,
                source: 'view_gallery_link',
              })
            }
            className="text-[14px] font-medium text-masaiverse-orange hover:underline"
          >
            View gallery →
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PhotoTile
          src={first}
          className="aspect-[16/10] sm:aspect-auto sm:h-full"
        />
        {smallPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {smallPhotos.map((src, index) => {
              const isLast = index === smallPhotos.length - 1
              const showOverlay = isLast && remaining > 0
              return (
                <div key={`${src}-${index}`} className="relative aspect-[4/3]">
                  <PhotoTile src={src} className="size-full" />
                  {showOverlay ? (
                    <Link
                      to="/masaiverse/club/$clubId/gallery"
                      params={{ clubId: club.id }}
                      search={(prev) => prev}
                      onClick={() =>
                        trackMasaiverse(MASAIVERSE_EVENTS.clubGalleryOpen, {
                          club_id: club.id,
                          source: 'photo_overlay',
                        })
                      }
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-[16px] bg-[#1C1A19]/80 text-white"
                    >
                      <span className="text-[26px] font-extrabold leading-none">
                        +{remaining}
                      </span>
                      <span className="mt-1 text-[14px] text-white/80">
                        more photos
                      </span>
                    </Link>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}
