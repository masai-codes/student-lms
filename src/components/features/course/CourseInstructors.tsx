import type { CourseRoleGroup } from '@/server/api/course/getCourseBatchData.service'
import { PersonCard } from './PersonCard'

interface Props {
  groups: CourseRoleGroup[]
}

export function CourseInstructors({ groups }: Props) {
  if (groups.length === 0) return null

  return (
    <>
      {groups.map((group) => (
        <div key={group.role} className="flex flex-col gap-4">
          <h2 className="font-semibold text-xl leading-8 text-foreground">
            {group.role}
          </h2>
          <div className="flex flex-wrap gap-4">
            {group.people.map((p, i) => (
              <PersonCard
                key={i}
                name={p.name}
                role={p.designation}
                avatarUrl={p.avatarUrl}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
