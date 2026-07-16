import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveAgreementDetails } from '../saveAgreementDetails.service'

const hoisted = vi.hoisted(() => ({
  selectRows: [] as Array<Record<string, unknown>>,
  updateSet: vi.fn(),
  insertValues: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(hoisted.selectRows) }),
      }),
    }),
    update: () => ({
      set: (v: unknown) => {
        hoisted.updateSet(v)
        return { where: () => Promise.resolve() }
      },
    }),
    insert: () => ({
      values: (v: unknown) => {
        hoisted.insertValues(v)
        return Promise.resolve()
      },
    }),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.selectRows = []
})

describe('saveAgreementDetails', () => {
  it('merges values into an existing profile and stamps a reference number', async () => {
    hoisted.selectRows = [
      {
        id: 3,
        legalData: {
          agreements: { section_7: { formDetailCreateTime: 'earlier' } },
        },
      },
    ]

    const result = await saveAgreementDetails(1, 7, {
      name: 'Riya',
      panNumber: 'ABCDE1234F',
      junk: 'x',
    } as never)

    expect(result.referenceNumber).toBe('TC-1-section_7')
    expect(result.savedValues).toMatchObject({
      name: 'Riya',
      panNumber: 'ABCDE1234F',
    })
    expect(result.savedValues).not.toHaveProperty('junk') // whitelisted to known fields

    const written = hoisted.updateSet.mock.calls[0][0] as {
      legalData: { agreements: { section_7: Record<string, unknown> } }
    }
    const section = written.legalData.agreements.section_7
    expect(section.name).toBe('Riya')
    expect(section.referenceNumber).toBe('TC-1-section_7')
    expect(section.formDetailCreateTime).toBe('earlier') // preserved
    expect(section.formDetailUpdateTime).toBeTruthy() // refreshed
    expect(hoisted.insertValues).not.toHaveBeenCalled()
  })

  it('creates a profile row when none exists', async () => {
    hoisted.selectRows = []
    await saveAgreementDetails(1, 7, { name: 'Riya' })
    const inserted = hoisted.insertValues.mock.calls[0][0] as {
      userId: number
      legalData: { agreements: Record<string, unknown> }
    }
    expect(inserted.userId).toBe(1)
    expect(inserted.legalData.agreements).toHaveProperty('section_7')
  })
})
