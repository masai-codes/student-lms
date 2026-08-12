import { LinkedinLogo, Lock } from '@phosphor-icons/react'
import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal'
import { MasaiButton } from '@/components/ui/masai-button'
import { ConfettiOverlay } from '@/components/ui/confetti-overlay'
import { buildBadgeShareUrl } from '@/components/features/profile/achievements/groupAchievements'
import { pushProfileEntityEvent } from '@/components/features/profile/shared/profileAnalytics'
import type { AchievementItem } from '@/server/api/profile/profile.types'

function formatUnlockedOn(releaseDate: string | null): string | null {
  if (!releaseDate) return null
  const date = new Date(releaseDate)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function buildShareText(
  item: AchievementItem,
  shareUrl: string | null,
): string {
  const base =
    item.badge.linkedinShareText?.trim() ||
    `I earned the "${item.badge.title}" badge at Masai.`
  return shareUrl ? `${base} ${shareUrl}` : base
}

/**
 * Badge detail. Earned badges celebrate (confetti) and offer a LinkedIn share;
 * locked ones explain what unlocks them instead of dead-ending.
 */
export function AchievementDialog({
  item,
  shareBaseUrl,
  onClose,
}: {
  item: AchievementItem | null
  shareBaseUrl: string | null
  onClose: () => void
}) {
  const shareUrl = buildBadgeShareUrl(shareBaseUrl, item?.shareKey ?? null)
  const unlockedOn = formatUnlockedOn(item?.releaseDate ?? null)

  function share() {
    if (!item) return
    const text = buildShareText(item, shareUrl)
    pushProfileEntityEvent('share', 'badge', item.badgeConfigId, {
      title: item.badge.title,
    })
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite?text=${encodeURIComponent(text)}`
    void navigator.clipboard
      .writeText(text)
      .catch(() => undefined)
      .finally(() => window.open(linkedInUrl, '_blank', 'noopener,noreferrer'))
  }

  return (
    <Modal
      open={item !== null}
      onOpenChange={(next) => (next ? null : onClose())}
    >
      <ModalContent
        data-testid="profile-achievement-dialog"
        className="max-w-md"
      >
        {item && !item.isLocked ? <ConfettiOverlay active /> : null}

        <div className="relative z-20 flex flex-col items-center gap-3 text-center">
          <span className="relative">
            <img
              src={item?.badge.image}
              alt=""
              aria-hidden
              className={`size-28 object-contain ${item?.isLocked ? 'opacity-40 grayscale' : ''}`}
            />
            {item?.isLocked ? (
              <span
                aria-hidden
                className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-surface-muted text-foreground-subtle"
              >
                <Lock size={16} weight="fill" />
              </span>
            ) : null}
          </span>

          <ModalTitle className="type-h6 pr-8">{item?.badge.title}</ModalTitle>

          <p
            data-testid="profile-achievement-description"
            className="type-b2-regular text-foreground-muted"
          >
            {item?.isLocked
              ? (item.badge.lockedDescription ?? item.badge.description)
              : item?.badge.description}
          </p>

          {item?.isLocked ? (
            <p className="type-caption text-foreground-subtle">
              Not earned yet — keep going.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {unlockedOn ? (
                <p
                  data-testid="profile-achievement-unlocked-on"
                  className="type-caption text-foreground-subtle"
                >
                  Earned on {unlockedOn}
                </p>
              ) : null}
              {item && item.count > 1 ? (
                <p className="type-caption text-foreground-subtle">
                  Earned {item.count} times
                </p>
              ) : null}
            </div>
          )}

          {item && !item.isLocked ? (
            <MasaiButton
              ctaText="Share on LinkedIn"
              icon={<LinkedinLogo size={18} weight="fill" aria-hidden />}
              iconDirection="left"
              data-testid="profile-achievement-share"
              className="mt-2"
              onClick={share}
            />
          ) : null}
        </div>
      </ModalContent>
    </Modal>
  )
}
