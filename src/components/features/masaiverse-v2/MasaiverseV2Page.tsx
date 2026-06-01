import MasaiverseV2LeftSection from './MasaiverseV2LeftSection'
import MasaiverseV2RightSection from './MasaiverseV2RightSection'

/**
 * Masaiverse v2 home page.
 *
 * Fresh, empty canvas that replaces the legacy home-tab UI. A centered
 * container (same max width as the old masaiverse) gives horizontal breathing
 * room on the left/right, with no top/bottom margin. The left and right
 * sections sit flush against each other, separated only by a divider border.
 */
export default function MasaiverseV2Page() {
  return (
    <div className="mx-auto -mt-6 w-full max-w-[1440px] px-4 md:-mt-[24px] md:px-6">
      <div className="flex w-full items-stretch">
        <MasaiverseV2LeftSection />
        <MasaiverseV2RightSection />
      </div>
    </div>
  )
}
