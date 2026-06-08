import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Lock, X } from 'lucide-react'
import { fetchAchievements } from '@/lib/api/profile/profileApi'
import type { AchievementItem } from '@/server/api/profile/achievements.service'

// ── Badge Modal ───────────────────────────────────────────────────────────────

function BadgeModal({ item, onClose }: { item: AchievementItem; onClose: () => void }) {
  const { badge, isLocked, releaseDate, sectionModuleName, courseTitle } = item

  const formattedDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const handleLinkedIn = () => {
    if (!badge.image) return
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(badge.image)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Top gradient background */}
        <div
          className="flex justify-center pt-10 pb-6 px-6"
          style={{ background: 'linear-gradient(160deg, #e0f2fe 0%, #f0fdf4 50%, #faf5ff 100%)' }}
        >
          <div className={`size-40 overflow-hidden flex items-center justify-center ${isLocked ? 'opacity-50' : ''}`}>
            {badge.image ? (
              <img src={badge.image} alt={badge.title} className="size-full object-contain" />
            ) : (
              <div className="size-full bg-gray-100 flex items-center justify-center text-6xl rounded-xl">🏅</div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 flex flex-col items-center gap-3 text-center">
          <h3 className="text-xl font-bold text-gray-900">{badge.title}</h3>

          <p className="text-sm text-gray-500 leading-relaxed">
            {isLocked && badge.lockedBadgeDescription
              ? badge.lockedBadgeDescription
              : badge.description ?? ''}
          </p>

          {/* Unlocked date pill */}
          {!isLocked && formattedDate ? (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#6962AC] text-[#6962AC] text-sm font-medium">
              Unlocked on {formattedDate}
            </span>
          ) : null}

          {/* Module + course */}
          {(sectionModuleName || courseTitle) ? (
            <div className="w-full bg-gray-100 rounded-2xl px-6 py-4 flex flex-col items-center gap-2 mt-1">
              {sectionModuleName ? (
                <span className="inline-flex items-center px-4 py-1 rounded-full border border-teal-500 text-teal-600 text-sm font-medium">
                  {sectionModuleName}
                </span>
              ) : null}
              {courseTitle ? (
                <p className="text-sm font-medium text-gray-700">{courseTitle}</p>
              ) : null}
            </div>
          ) : null}

          {/* LinkedIn share — only for unlocked */}
          {!isLocked ? (
            <button
              type="button"
              onClick={handleLinkedIn}
              className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#6962AC] text-white text-sm font-semibold hover:bg-[#4B4396] transition-colors focus-visible:outline-none"
            >
              {/* LinkedIn icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share With Your Network
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── Badge Card ────────────────────────────────────────────────────────────────

function BadgeCard({ item, onClick }: { item: AchievementItem; onClick: () => void }) {
  const { badge, isLocked } = item

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6962AC] rounded-lg"
      aria-label={badge.title}
    >
      <div className={`relative size-28 rounded-lg overflow-visible shrink-0 ${isLocked ? 'opacity-50' : ''}`}>
        {badge.image ? (
          <img
            src={badge.image}
            alt={badge.title}
            className="size-full object-contain"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="size-full bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
            <span className="text-3xl">🏅</span>
          </div>
        )}

        {/* Lock icon */}
        {isLocked ? (
          <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-blue-500 text-white rounded-full p-1 shadow-md">
            <Lock size={11} strokeWidth={2.5} />
          </div>
        ) : null}
      </div>
    </button>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export function AchievementsSection() {
  const [selected, setSelected] = useState<AchievementItem | null>(null)

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: fetchAchievements,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Achievements</h2>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="size-28 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (achievements.length === 0) return null

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Achievements</h2>
        <div className="flex flex-wrap gap-4">
          {achievements.map((item) => (
            <BadgeCard
              key={item.badgeConfigId}
              item={item}
              onClick={() => setSelected(item)}
            />
          ))}
        </div>
      </div>

      {selected ? (
        <BadgeModal item={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  )
}
