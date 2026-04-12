import { Link } from '@tanstack/react-router'
import {
  BadgeCheckIcon,
  Book,
  Bookmark,
  BriefcaseBusiness,
  Bug,
  LogOutIcon,
  ToggleLeft,
  User,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getOldStudentUiUrl,
  redirectToOldStudentUi,
} from '@/utils/authRedirect'

export function DropdownMenuProfile() {
  const oldStudentUiUrl = getOldStudentUiUrl()

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
          <Link to="/profile">
            <DropdownMenuItem>
              <User />
              Profile
            </DropdownMenuItem>
          </Link>

          <Link to="/courses">
            <DropdownMenuItem>
              <Book />
              My Courses
            </DropdownMenuItem>
          </Link>

          <Link to="/bookmark" search={{ page: undefined, type: undefined }}>
            <DropdownMenuItem>
              <Bookmark />
              Bookmarks
            </DropdownMenuItem>
          </Link>

          <Link to="/masaiverse">
            <DropdownMenuItem>
              <Users />
              MasaiVerse
            </DropdownMenuItem>
          </Link>

          <Link to="/practice-interview">
            <DropdownMenuItem>
              <BriefcaseBusiness />
              Practice Interview
            </DropdownMenuItem>
          </Link>

          <a href="https://forms.gle/ZMRLA8rQ85CtSkWf8" target="_blank">
            <DropdownMenuItem>
              <Bug />
              Report a Bug
            </DropdownMenuItem>
          </a>

          <a href={oldStudentUiUrl ?? '#'}>
            <DropdownMenuItem>
              <ToggleLeft />
              Switch to Old LMS
            </DropdownMenuItem>
          </a>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* <DropdownMenuItem onClick={handleLogout}> */}
        <DropdownMenuItem onClick={redirectToOldStudentUi}>
          <LogOutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
