import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  acceptUndertaking,
  getPendingUndertakings,
} from '@/server/api/profile/undertakings.service'

const select = vi.hoisted(() => vi.fn())
const set = vi.hoisted(() => vi.fn())
const values = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: {
    select: (...args: Array<unknown>) => select(...args),
    update: () => ({ set: (...args: Array<unknown>) => set(...args) }),
    insert: () => ({ values: (...args: Array<unknown>) => values(...args) }),
  },
}))

/**
 * Queues row-sets in call order. Each returned chain supports both
 * `where()`-terminal (list) and `where().limit()` (single-row) shapes.
 */
function queueRows(...rowSets: Array<Array<Record<string, unknown>>>) {
  let call = 0
  select.mockImplementation(() => {
    const rows = rowSets[call] ?? []
    call += 1
    const promise = Promise.resolve(rows)
    const where = () =>
      Object.assign(promise, { limit: () => Promise.resolve(rows) })
    return { from: () => ({ where, innerJoin: () => ({ where }) }) }
  })
}

const TEMPLATE = {
  undertaking_template: {
    shouldModalBeVisible: true,
    pdfUrl: 'https://cdn.example/undertaking.pdf',
    heading: 'Code of Conduct',
  },
}

const SECTION_ROW = {
  sectionId: 11,
  sectionName: 'DSA Section A',
  settings: TEMPLATE,
  batchId: 900,
  batchName: 'SDE Batch 42',
  program: 'SDE',
}

const writtenLegalData = () =>
  (set.mock.calls[0]?.[0]?.legalData ??
    values.mock.calls[0]?.[0]?.legalData) as Record<string, unknown> | undefined

beforeEach(() => {
  vi.clearAllMocks()
  set.mockReturnValue({ where: () => Promise.resolve(undefined) })
  values.mockReturnValue(Promise.resolve(undefined))
})

describe('getPendingUndertakings', () => {
  it('returns the pending acknowledgement for an enrolled section', async () => {
    queueRows([{ sectionId: 11 }], [{ legalData: null }], [SECTION_ROW])

    await expect(getPendingUndertakings(7)).resolves.toEqual([
      {
        sectionId: 11,
        sectionName: 'DSA Section A',
        batchId: 900,
        batchName: 'SDE Batch 42',
        program: 'SDE',
        heading: 'Code of Conduct',
        pdfUrl: 'https://cdn.example/undertaking.pdf',
      },
    ])
  })

  it('short-circuits with no enrolments', async () => {
    queueRows([])
    await expect(getPendingUndertakings(7)).resolves.toEqual([])
    expect(select).toHaveBeenCalledTimes(1)
  })

  it('excludes a section the student already accepted', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [{ legalData: { undertakings: { section_11: { accepted: true } } } }],
      [SECTION_ROW],
    )
    await expect(getPendingUndertakings(7)).resolves.toEqual([])
  })

  it('still lists a section whose stored entry is not accepted', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [{ legalData: { undertakings: { section_11: { accepted: false } } } }],
      [SECTION_ROW],
    )
    await expect(getPendingUndertakings(7)).resolves.toHaveLength(1)
  })

  it('ignores sections whose template is hidden or has no PDF', async () => {
    queueRows(
      [{ sectionId: 11 }, { sectionId: 12 }],
      [{ legalData: {} }],
      [
        {
          ...SECTION_ROW,
          settings: {
            undertaking_template: { shouldModalBeVisible: false, pdfUrl: 'x' },
          },
        },
        {
          ...SECTION_ROW,
          sectionId: 12,
          settings: {
            undertaking_template: { shouldModalBeVisible: true, pdfUrl: '  ' },
          },
        },
      ],
    )
    await expect(getPendingUndertakings(7)).resolves.toEqual([])
  })

  it('tolerates missing/garbage settings and legal_data', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [{ legalData: { undertakings: { section_11: 'corrupt' } } }],
      [{ ...SECTION_ROW, settings: null }],
    )
    await expect(getPendingUndertakings(7)).resolves.toEqual([])
  })

  it('defaults a blank heading to "Undertaking"', async () => {
    queueRows(
      [{ sectionId: 11 }],
      [{ legalData: null }],
      [
        {
          ...SECTION_ROW,
          settings: {
            undertaking_template: {
              shouldModalBeVisible: true,
              pdfUrl: 'https://cdn.example/u.pdf',
              heading: '  ',
            },
          },
        },
      ],
    )
    const [pending] = await getPendingUndertakings(7)
    expect(pending.heading).toBe('Undertaking')
  })

  it('de-duplicates repeated section enrolments', async () => {
    queueRows(
      [{ sectionId: 11 }, { sectionId: 11 }],
      [{ legalData: null }],
      [SECTION_ROW],
    )
    await expect(getPendingUndertakings(7)).resolves.toHaveLength(1)
  })
})

describe('acceptUndertaking', () => {
  const input = { sectionId: 11, ipAddress: '1.2.3.4', location: 'Bengaluru' }

  it('records acceptance with its provenance, preserving other legal data', async () => {
    queueRows(
      [{ id: 5 }],
      [{ settings: TEMPLATE }],
      [{ id: 3, legalData: { name: 'Riya', undertakings: { section_9: {} } } }],
    )

    await expect(acceptUndertaking(7, input)).resolves.toBeUndefined()

    const written = writtenLegalData()
    expect(written?.name).toBe('Riya')
    const undertakings = written?.undertakings as Record<string, any>
    expect(undertakings.section_9).toEqual({})
    expect(undertakings.section_11).toMatchObject({
      accepted: true,
      ipAddress: '1.2.3.4',
      location: 'Bengaluru',
      undertakingPdfUrl: 'https://cdn.example/undertaking.pdf',
    })
    expect(typeof undertakings.section_11.signTime).toBe('string')
  })

  it('creates the profile row when the student has none', async () => {
    queueRows([{ id: 5 }], [{ settings: TEMPLATE }], [])
    await acceptUndertaking(7, input)
    expect(values).toHaveBeenCalledTimes(1)
    expect(values.mock.calls[0][0]).toMatchObject({ userId: 7 })
  })

  it('rejects a non-positive or non-integer section id', async () => {
    for (const sectionId of [0, -1, 1.5, Number.NaN]) {
      await expect(
        acceptUndertaking(7, { ...input, sectionId }),
      ).rejects.toMatchObject({ status: 400, code: 'INVALID_SECTION_ID' })
    }
  })

  it('requires a location', async () => {
    await expect(
      acceptUndertaking(7, { ...input, location: '   ' }),
    ).rejects.toMatchObject({ status: 400, code: 'LOCATION_REQUIRED' })
  })

  it('refuses acceptance for a section the student is not enrolled in', async () => {
    queueRows([])
    await expect(acceptUndertaking(7, input)).rejects.toMatchObject({
      status: 403,
      code: 'NOT_ENROLLED_IN_SECTION',
    })
    expect(set).not.toHaveBeenCalled()
  })

  it('404s for an inactive or missing section', async () => {
    queueRows([{ id: 5 }], [])
    await expect(acceptUndertaking(7, input)).rejects.toMatchObject({
      status: 404,
      code: 'SECTION_NOT_FOUND',
    })
  })

  it('404s when the section carries no undertaking PDF', async () => {
    queueRows([{ id: 5 }], [{ settings: { undertaking_template: {} } }])
    await expect(acceptUndertaking(7, input)).rejects.toMatchObject({
      status: 404,
      code: 'UNDERTAKING_NOT_FOUND',
    })
  })
})
