/**
 * Masaiverse-branded loading indicator.
 *
 * Shows the Masai logo with a soft pulse plus a sweeping accent progress bar,
 * so route/data transitions feel intentional instead of flashing a bare
 * "Loading…" string. The logo asset matches the one used in the sidebar
 * (`public/Masaiverse.svg`).
 */
type MasaiverseLoaderProps = {
  /** Optional helper text shown under the logo. */
  label?: string
  /** Fill the parent height and center within it. Defaults to true. */
  fullHeight?: boolean
}

export default function MasaiverseLoader({
  label = 'Loading your community…',
  fullHeight = true,
}: MasaiverseLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex w-full flex-col items-center justify-center gap-5 ${
        fullHeight ? 'min-h-[60vh]' : 'py-16'
      }`}
    >
      <img
        src="/Masaiverse.svg"
        alt="Masaiverse"
        className="h-14 w-auto animate-pulse"
      />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-masaiverse-orange/15">
        <div className="h-full w-1/2 animate-masaiverse-sweep rounded-full bg-masaiverse-orange" />
      </div>
      <span className="text-[13px] font-medium leading-5 text-[#6B7280]">
        {label}
      </span>
    </div>
  )
}
