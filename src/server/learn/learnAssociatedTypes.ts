export type LearnAssociatedListItem = {
  id: number
  kind: 'lecture' | 'assignment' | 'resource'
  title: string
  meta: string | null
}
