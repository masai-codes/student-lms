import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getInvoices,
  getStudentKit,
} from '@/server/api/profile/studentStatus.service'

const select = vi.hoisted(() => vi.fn())
const resolveStudentCode = vi.hoisted(() => vi.fn())
const getAdmissionsStudentStatus = vi.hoisted(() => vi.fn())
const buildAdmissionsRedirectForUser = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: { select: (...args: Array<unknown>) => select(...args) },
}))

vi.mock('@/server/users/getStudentCode', () => ({
  resolveStudentCode: (...args: Array<unknown>) => resolveStudentCode(...args),
}))

vi.mock('@/server/admissions/getAdmissionsStudentStatus', () => ({
  getAdmissionsStudentStatus: (...args: Array<unknown>) =>
    getAdmissionsStudentStatus(...args),
}))

vi.mock('@/server/admissions/buildAdmissionsRedirectForUser', () => ({
  buildAdmissionsRedirectForUser: (...args: Array<unknown>) =>
    buildAdmissionsRedirectForUser(...args),
}))

function withAdmissionBatch(batchId: number | null) {
  select.mockReturnValue({
    from: () => ({
      where: () => ({
        orderBy: () => ({
          limit: () => Promise.resolve(batchId === null ? [] : [{ batchId }]),
        }),
      }),
    }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  withAdmissionBatch(900)
  resolveStudentCode.mockResolvedValue('SDE_1')
  buildAdmissionsRedirectForUser.mockResolvedValue('https://admissions/form')
})

afterEach(() => vi.unstubAllEnvs())

describe('getStudentKit', () => {
  it('returns the empty kit when the student has no code', async () => {
    resolveStudentCode.mockResolvedValue('')
    await expect(getStudentKit(7)).resolves.toEqual({
      showKit: false,
      detailsFilled: false,
      admissionsFormUrl: null,
      trackingId: null,
      trackingUrl: null,
    })
    expect(getAdmissionsStudentStatus).not.toHaveBeenCalled()
  })

  it('requests only the kit section, scoped to the admission batch', async () => {
    getAdmissionsStudentStatus.mockResolvedValue(null)
    await getStudentKit(7)
    expect(resolveStudentCode).toHaveBeenCalledWith(7, 900)
    expect(getAdmissionsStudentStatus).toHaveBeenCalledWith('SDE_1', 'kit')
  })

  it('still resolves when Admissions is unreachable', async () => {
    getAdmissionsStudentStatus.mockResolvedValue(null)
    await expect(getStudentKit(7)).resolves.toMatchObject({
      showKit: false,
      detailsFilled: false,
      trackingUrl: null,
    })
  })

  it('builds an admissions form URL only while details are unfilled', async () => {
    getAdmissionsStudentStatus.mockResolvedValue({
      kit: { showKit: true, detailsFilled: false },
    })
    await expect(getStudentKit(7)).resolves.toMatchObject({
      showKit: true,
      detailsFilled: false,
      admissionsFormUrl: 'https://admissions/form',
    })

    getAdmissionsStudentStatus.mockResolvedValue({
      kit: { showKit: true, detailsFilled: true },
    })
    await expect(getStudentKit(7)).resolves.toMatchObject({
      admissionsFormUrl: null,
    })
  })

  it('surfaces tracking details, trimming blanks to null', async () => {
    getAdmissionsStudentStatus.mockResolvedValue({
      kit: {
        showKit: true,
        detailsFilled: true,
        tracking: { trackingId: ' AWB123 ', trackingUrl: '   ' },
      },
    })
    await expect(getStudentKit(7)).resolves.toMatchObject({
      trackingId: 'AWB123',
      trackingUrl: null,
    })
  })

  it('degrades to null when the redirect cannot be built', async () => {
    buildAdmissionsRedirectForUser.mockResolvedValue(null)
    getAdmissionsStudentStatus.mockResolvedValue({
      kit: { showKit: true, detailsFilled: false },
    })
    await expect(getStudentKit(7)).resolves.toMatchObject({
      admissionsFormUrl: null,
    })
  })

  it('falls back to an unscoped student code with no admission row', async () => {
    withAdmissionBatch(null)
    getAdmissionsStudentStatus.mockResolvedValue(null)
    await getStudentKit(7)
    expect(resolveStudentCode).toHaveBeenCalledWith(7, null)
  })
})

describe('getInvoices', () => {
  it('returns nothing when the student has no code', async () => {
    resolveStudentCode.mockResolvedValue('')
    await expect(getInvoices(7)).resolves.toEqual([])
    expect(getAdmissionsStudentStatus).not.toHaveBeenCalled()
  })

  it('requests only the invoices section', async () => {
    getAdmissionsStudentStatus.mockResolvedValue({ invoices: [] })
    await getInvoices(7)
    expect(getAdmissionsStudentStatus).toHaveBeenCalledWith('SDE_1', 'invoices')
  })

  it('returns an empty list when Admissions is unreachable or sends junk', async () => {
    getAdmissionsStudentStatus.mockResolvedValue(null)
    await expect(getInvoices(7)).resolves.toEqual([])

    getAdmissionsStudentStatus.mockResolvedValue({ invoices: 'nope' })
    await expect(getInvoices(7)).resolves.toEqual([])
  })

  it('normalises numeric and string amounts', async () => {
    getAdmissionsStudentStatus.mockResolvedValue({
      invoices: [
        { paymentType: 'Full fees', amount: 125000, paidOn: '2026-01-05' },
        { paymentType: 'Seat blocking', amount: '1,25,000' },
        { paymentType: 'Odd', amount: 'not-a-number' },
        { paymentType: 'Missing', amount: null },
      ],
    })

    const invoices = await getInvoices(7)
    expect(invoices.map((invoice) => invoice.amount)).toEqual([
      125000,
      125000,
      null,
      null,
    ])
  })

  it('defaults a missing payment type and trims blank URLs to null', async () => {
    getAdmissionsStudentStatus.mockResolvedValue({
      invoices: [{ paymentType: '  ', invoiceUrl: '   ', paidOn: '  ' }],
    })
    await expect(getInvoices(7)).resolves.toEqual([
      {
        paymentType: 'Payment',
        amount: null,
        paidOn: null,
        invoiceUrl: null,
      },
    ])
  })
})
