import { useCallback, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Book,
  Bookmark,
  BriefcaseBusiness,
  Bug,
  LogOutIcon,
  ToggleLeft,
  UserCircle,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LevelUpIcon } from '@/components/common/LevelUpIcon'
import { LEGACY_STUDENT_LMS_URL } from '@/constants/legacyStudentUi'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { getBugReportFormUrl } from '@/utils/bugReportFormUrl'
import { logout } from '@/server/auth/logout'
import { getOldStudentUiUrlForPath, getPostLogoutRedirectUrl } from '@/utils/authRedirect'
import { fetchLevelupSso } from '@/utils/levelupSso'

const menuItemClass =
  'flex cursor-pointer items-center gap-2 [&_svg]:pointer-events-none [&_svg]:size-4'

export function DropdownMenuProfile() {
  const [isLevelupLoading, setIsLevelupLoading] = useState(false)
  const levelupLoadingRef = useRef(false)
  const bookmarkHref = getOldStudentUiUrlForPath(OLD_STUDENT_UI_NAV_PATHS.bookmarks) ?? '#'

  const handleLevelupClick = useCallback(async () => {
    if (levelupLoadingRef.current) return
    levelupLoadingRef.current = true
    setIsLevelupLoading(true)
    try {
      const { url } = await fetchLevelupSso()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong while redirecting to Levelup'
      window.alert(message)
    } finally {
      levelupLoadingRef.current = false
      setIsLevelupLoading(false)
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className={menuItemClass}>
            <Link to="/profile">
              <UserCircle />
              My Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className={menuItemClass}>
            <Link to="/courses">
              <Book />
              My Courses
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className={menuItemClass}>
            <a
              href={bookmarkHref}
              onClick={(e) => {
                if (bookmarkHref === '#') e.preventDefault()
              }}
            >
              <Bookmark />
              Bookmark
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className={menuItemClass}>
            <Link to="/masaiverse" search={{ tab: 'home' }}>
              <Users />
              MasaiVerse Community
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className={menuItemClass}>
            <Link to="/practice-interview">
              <BriefcaseBusiness />
              Practice Interviews
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className={menuItemClass}>
            <a href={getBugReportFormUrl()} target="_blank" rel="noreferrer noopener">
              <Bug />
              Report a Bug
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={menuItemClass}
            disabled={isLevelupLoading}
            title="LevelUp - Is our placement platform. You can only access this if you are onboarded in Masai Placement Process"
            onSelect={(e) => {
              e.preventDefault()
              void handleLevelupClick()
            }}
          >
            <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
              <LevelUpIcon width={18} height={14} color="currentColor" />
            </span>
            {isLevelupLoading ? 'Opening Level up...' : 'Level up'}
          </DropdownMenuItem>

          <DropdownMenuItem asChild className={menuItemClass}>
            <a href={LEGACY_STUDENT_LMS_URL} target="_blank" rel="noreferrer noopener">
              <ToggleLeft />
              Switch to OLD LMS
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={menuItemClass}
            onSelect={async (e) => {
              e.preventDefault()
              try {
                await logout()
              } catch (err) {
                console.error('Logout failed', err)
                window.alert(err instanceof Error ? err.message : 'Sign out failed. Please try again.')
                return
              }
              window.location.assign(getPostLogoutRedirectUrl())
            }}
          >
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
