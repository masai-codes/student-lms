/** Server-computed copy for assignment/resource phase panels. */
export type LearnPhaseContent = {
  title: string
  description: string
  /** Full sentence suffix for locked states, e.g. "Opens 20 May, 10:00 AM." */
  scheduleHint: string | null
}
