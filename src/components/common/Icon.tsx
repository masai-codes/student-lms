import { BookIcon, CirclePlayIcon, NotepadTextIcon } from 'lucide-react'
import { type CSSProperties } from 'react'

type SupportedIcons = 'lecture' | 'assignment' | 'resource'

const icons = {
  lecture: CirclePlayIcon,
  assignment: NotepadTextIcon,
  resource: BookIcon,
}

export function CommonIcon({
  name,
  className,
  style,
}: {
  name: SupportedIcons
  className?: string
  style?: CSSProperties
}) {
  const Icon = icons[name]

  return <Icon className={className} style={style} />
}
