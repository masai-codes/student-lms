import {
  CalendarDays,
  Megaphone,
  Menu,
  MessagesSquare,
} from "lucide-react"
import { Link } from "@tanstack/react-router"
import { DropdownMenuProfile } from "@/components/features/profile"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const IMAGES = {
  MASAI_LOGO:
    "https://students.masaischool.com/static/media/masai-logo.e5c8801d4f26d2da036ec9e4b93cb202.svg",
} as const

export default function Header() {
  const courseId = "4294967295" // static for now

  return (
    <header className="sticky top-0 z-50 bg-background border-b rounded-b-3xl">
      <div className="flex items-center justify-between py-3 mx-[clamp(16px,6.25vw,80px)]">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={IMAGES.MASAI_LOGO} alt="Masai Logo" className="h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{
              className:
                "text-[#6962AC] underline underline-offset-8 decoration-2 decoration-[#6962AC]",
            }}
            className="text-[#6C7280] font-medium transition hover:text-[#6962AC]"
          >
            Home
          </Link>

          <Link
            to="/courses/$courseId/lectures"
            params={{ courseId }}
            search={{ page: undefined }}
            activeOptions={{ exact: false }}
            activeProps={{
              className:
                "text-[#6962AC] underline underline-offset-8 decoration-2 decoration-[#6962AC]",
            }}
            className="text-[#6C7280] font-medium transition hover:text-[#6962AC]"
          >
            Learn
          </Link>

          <Link
            to="/support"
            activeOptions={{ exact: false }}
            activeProps={{
              className:
                "text-[#6962AC] underline underline-offset-8 decoration-2 decoration-[#6962AC]",
            }}
            search={{ page: undefined }}
            className="text-[#6C7280] font-medium transition hover:text-[#6962AC]"
          >
            Support
          </Link>

          <Link
            to="/discussions"
            activeOptions={{ exact: false }}
            activeProps={{
              className:
                "text-[#6962AC] underline underline-offset-8 decoration-2 decoration-[#6962AC]",
            }}
            search={{ page: undefined, type: undefined }}
            className="text-[#6C7280] font-medium transition hover:text-[#6962AC]"
          >
            Discussions
          </Link>

          <Link
            to="/refer-and-earn"
            activeOptions={{ exact: false }}
            activeProps={{
              className:
                "text-[#6962AC] underline underline-offset-8 decoration-2 decoration-[#6962AC]",
            }}
            className="text-[#6C7280] font-medium transition hover:text-[#6962AC]"
          >
            Refer &amp; Earn
          </Link>

          <Link
            to="/masaiverse"
            activeOptions={{ exact: false }}
            activeProps={{
              className:
                "text-[#6962AC] underline underline-offset-8 decoration-2 decoration-[#6962AC]",
            }}
            className="text-[#6C7280] font-medium transition hover:text-[#6962AC]"
          >
            MasaiVerse
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <div className="flex items-center gap-2">

              {/* Calendar */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex rounded-full">
                    <CalendarDays className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Calendar</TooltipContent>
              </Tooltip>

              {/* Messages */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="relative rounded-full">
                    <Link to="/chat">
                      <MessagesSquare className="h-8 w-8" />
                      <NotificationBadge count={4} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Chat</TooltipContent>
              </Tooltip>

              {/* Announcements */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="relative rounded-full">
                    <Link to="/announcements" search={{ page: undefined }}>
                      <Megaphone className="h-8 w-8" />
                      <NotificationBadge count={2} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Announcements</TooltipContent>
              </Tooltip>

            </div>
          </TooltipProvider>

          <DropdownMenuProfile />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-6">
                <Link
                  to="/"
                  activeOptions={{ exact: true }}
                  activeProps={{
                    className:
                      "text-[#6962AC] underline underline-offset-6 decoration-[#6962AC]",
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-[#6962AC]"
                >
                  Home
                </Link>

                <Link
                  to="/courses/$courseId/lectures"
                  params={{ courseId }}
                  search={{ page: undefined }}
                  activeOptions={{ exact: false }}
                  activeProps={{
                    className:
                      "text-[#6962AC] underline underline-offset-6 decoration-[#6962AC]",
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-[#6962AC]"
                >
                  Learn
                </Link>

                <Link
                  to="/support"
                  activeOptions={{ exact: false }}
                  activeProps={{
                    className:
                      "text-[#6962AC] underline underline-offset-6 decoration-[#6962AC]",
                  }}
                  search={{ page: undefined }}
                  className="text-sm font-medium text-muted-foreground hover:text-[#6962AC]"
                >
                  Support
                </Link>

                <Link
                  to="/masaiverse"
                  activeOptions={{ exact: false }}
                  activeProps={{
                    className:
                      "text-[#6962AC] underline underline-offset-6 decoration-[#6962AC]",
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-[#6962AC]"
                >
                  MasaiVerse
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}






function NotificationBadge({ count }: { count?: number }) {
  if (!count || count <= 0) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
      {count}
    </span>
  )
}
