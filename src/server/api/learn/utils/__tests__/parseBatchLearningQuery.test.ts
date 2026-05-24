import { describe, expect, it } from 'vitest'

import { parseBatchLearningQuery } from '../parseBatchLearningQuery'

describe('parseBatchLearningQuery', () => {
  it('parses required query params', () => {
    const url = new URL(
      'http://localhost/api/learn/batch-data?batchId=133&learningType=lecture',
    )
    expect(parseBatchLearningQuery(url)).toEqual({
      batchId: 133,
      learningType: 'lecture',
    })
  })

  it('parses optional pagination and filters json', () => {
    const url = new URL(
      'http://localhost/api/learn/batch-data?batchId=1&learningType=assignment&page=2&pageSize=20&filters=' +
        encodeURIComponent(JSON.stringify({ modules: ['Module 1'] })),
    )
    expect(parseBatchLearningQuery(url)).toMatchObject({
      batchId: 1,
      learningType: 'assignment',
      page: 2,
      pageSize: 20,
      filters: { modules: ['Module 1'] },
    })
  })

  it('throws when batchId is missing', () => {
    const url = new URL('http://localhost/api/learn/batch-data?learningType=lecture')
    expect(() => parseBatchLearningQuery(url)).toThrow('MISSING_BATCH_ID')
  })
})
