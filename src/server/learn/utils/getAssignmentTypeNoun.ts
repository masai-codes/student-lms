import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'

/**
 * Display noun for an assignment kind. The new LMS keeps the old LMS copy and
 * conditions verbatim but never calls a practice/evaluation item a generic
 * "assignment" — it uses the right term per type instead.
 */
const ASSIGNMENT_TYPE_NOUNS: Record<AssignmentKind, string> = {
  practice: 'Practice Assignment',
  assignment: 'Assignment',
  evaluation: 'Evaluation',
}

export function getAssignmentTypeNoun(kind: AssignmentKind): string {
  return ASSIGNMENT_TYPE_NOUNS[kind]
}
