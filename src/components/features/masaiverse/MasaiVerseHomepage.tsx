import MasaiverseSidebar from "./MasaiverseSidebar/MasaiverseSidebar"
import type { ReactNode } from "react"

type MasaiverseHomepageProps = {
  children: ReactNode
}

const MasaiverseHomepage = ({ children }: MasaiverseHomepageProps) => {
  return (
    <div className="m-[24px] flex w-[calc(100%-48px)] gap-[24px] overflow-x-hidden">
      <MasaiverseSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export default MasaiverseHomepage