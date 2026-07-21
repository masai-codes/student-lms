import type { Course } from '@/types'

// ---- mock fetcher (replace with serverFn / API) ----
export async function fetchCourseById(
  _courseId: string,
): Promise<Array<Course>> {
  await new Promise((r) => setTimeout(r, 1200))
  return [
    {
      id: '1',
      title: 'Product Management with Generative & Agentic AI',
      org: 'BITSOM',
      progress: 49,
      cta: 'resume',
      image:
        'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/02d36cfe-3ecd-4bce-9953-6458747163bd/aRpFgjQxjivZqPmJ.jpg',
    },
  ]
}
