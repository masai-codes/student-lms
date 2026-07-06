import { describe, expect, it } from 'vitest'
import { expandLectures } from '../lectureExpansion'
import type { LectureRow } from '../lectureExpansion'

const row = (over: Partial<LectureRow> = {}): LectureRow => ({
  id: 1,
  title: 'Intro',
  type: 'video',
  videos: null,
  zoom_link: null,
  ...over,
})

describe('expandLectures', () => {
  it('uses the first video URL when videos are present', () => {
    const items = expandLectures([row({ videos: JSON.stringify(['https://cdn/v1.mp4', 'https://cdn/v2.mp4']) })])
    expect(items).toHaveLength(1)
    expect(items[0].videoUrl).toBe('https://cdn/v1.mp4')
  })

  it('falls back to the zoom_link backup when videos are empty (adaptive / interactive lectures)', () => {
    const items = expandLectures([
      row({
        id: 42,
        type: 'interactive-video',
        videos: '[]',
        zoom_link: 'https://experience-api.test/api/adaptive-lecture/mtg-9/join',
      }),
    ])
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      lectureId: 42,
      videoUrl: 'https://experience-api.test/api/adaptive-lecture/mtg-9/join',
    })
  })

  it('prefers videos over the zoom_link when both exist', () => {
    const items = expandLectures([row({ videos: JSON.stringify(['https://cdn/v1.mp4']), zoom_link: 'https://zoom/backup' })])
    expect(items[0].videoUrl).toBe('https://cdn/v1.mp4')
  })

  it('still drops lectures with neither a video nor a zoom_link', () => {
    expect(expandLectures([row({ videos: null, zoom_link: null })])).toEqual([])
    expect(expandLectures([row({ videos: '[]', zoom_link: '   ' })])).toEqual([])
  })

  it('ignores malformed videos JSON but keeps the zoom_link backup', () => {
    const items = expandLectures([row({ videos: 'not-json', zoom_link: 'https://zoom/backup' })])
    expect(items[0].videoUrl).toBe('https://zoom/backup')
  })
})
