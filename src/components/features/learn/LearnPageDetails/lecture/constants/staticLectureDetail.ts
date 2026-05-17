/** Static lecture detail payload until API-driven UI is ready. */
export const STATIC_LECTURE_HLS_URL =
  'https://cdn.masaischool.com/hls-videos/153463/6a097aa9e399fd3be6484552/master.m3u8'

export type StaticLectureHost = {
  name: string
  avatarUrl: string | null
}

export type StaticLectureDetail = {
  title: string
  host: StaticLectureHost
  scheduleStart: string
  scheduleEnd: string
  videoUrl: string
}

export const STATIC_LECTURE_DETAIL: StaticLectureDetail = {
  title: 'Introduction to Data Structures and Algorithms',
  host: {
    name: 'Ravindra Kumar',
    avatarUrl: null,
  },
  scheduleStart: '2026-05-10T10:00:00.000Z',
  scheduleEnd: '2026-05-10T12:00:00.000Z',
  videoUrl: STATIC_LECTURE_HLS_URL,
}
