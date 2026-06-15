import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from '@phosphor-icons/react'
import PhotoLightbox from './club/PhotoLightbox'
import { ApiClientError } from '@/lib/api/apiClientError'
import { masaiverseV2ClubDetailQuery } from '@/query/masaiverse-v2/clubsQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'

type ClubGalleryPageProps = {
  clubId: string
}

function BackToClubLink({ clubId }: { clubId: string }) {
  return (
    <Link
      to="/masaiverse/club/$clubId"
      params={{ clubId }}
      search={(prev) => prev}
      onClick={() =>
        trackMasaiverse(MASAIVERSE_EVENTS.backClick, {
          to: 'club',
          club_id: clubId,
        })
      }
      className="inline-flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]"
    >
      <ArrowLeft size={16} />
      Back to club
    </Link>
  )
}

/** Full photo gallery for a club — every `clubs.meta.galleryImages` entry. */
export default function ClubGalleryPage({ clubId }: ClubGalleryPageProps) {
  const { data: club, isPending, error } = useQuery(
    masaiverseV2ClubDetailQuery(clubId),
  )
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <BackToClubLink clubId={clubId} />
        <div
          role="status"
          aria-label="Loading gallery"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          <span className="sr-only">Loading gallery…</span>
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-[16px] bg-[#ECE7E2]"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    const notFound = error instanceof ApiClientError && error.status === 404
    return (
      <div>
        <BackToClubLink clubId={clubId} />
        <h2 className="mt-4 text-[20px] font-bold leading-7 text-[#111827]">
          {notFound ? 'Club not found' : 'Something went wrong'}
        </h2>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <BackToClubLink clubId={clubId} />
      <div>
        <h1 className="text-[24px] font-extrabold leading-8 text-[#111827]">
          {club.name} — Photos
        </h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          {club.galleryImages.length} photo
          {club.galleryImages.length === 1 ? '' : 's'}
        </p>
      </div>

      {club.galleryImages.length === 0 ? (
        <p className="text-[14px] text-[#6B7280]">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {club.galleryImages.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActivePhoto(src)}
              aria-label={`Open photo ${index + 1}`}
              className="relative aspect-square overflow-hidden rounded-[16px] bg-gradient-to-br from-[#7C3AED] to-[#EC4899] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-masaiverse-orange"
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <PhotoLightbox
        open={activePhoto !== null}
        onOpenChange={(open) => {
          if (!open) setActivePhoto(null)
        }}
        src={activePhoto}
      />
    </div>
  )
}
