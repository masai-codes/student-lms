import MasaiverseSidebar from "./MasaiverseSidebar/MasaiverseSidebar"
import type { ReactNode } from "react"

type MasaiverseHomepageProps = {
  children: ReactNode
}

const MasaiverseHomepage = ({ children }: MasaiverseHomepageProps) => {
  return (
    <div className="m-[24px] flex gap-[24px]">
      <MasaiverseSidebar />
      {children}
    </div>
  )
}

export default MasaiverseHomepage