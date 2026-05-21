export type LectureAssociatedListItem = {
  id: number
  kind: 'lecture' | 'assignment'
  title: string
  meta: string | null
}
