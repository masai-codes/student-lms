import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getWelcomeBanners: vi.fn(),
  getAnnouncementsFeed: vi.fn(),
  getProductUpdates: vi.fn(),
  getSupportSessions: vi.fn(),
  getDashboardSchedule: vi.fn(),
  getDashboardPendingTasks: vi.fn(),
  getWelcomeModalStatus: vi.fn(),
  getT0FlowStatus: vi.fn(),
  getT0FlowLectures: vi.fn(),
  getFeePaymentBanners: vi.fn(),
  getBatchStartBanners: vi.fn(),
  getBatchTransferPaymentBanners: vi.fn(),
}))

vi.mock('../banners/getWelcomeBanners.service', () => ({
  getWelcomeBanners: hoisted.getWelcomeBanners,
}))
vi.mock('../announcements/getAnnouncementsFeed.service', () => ({
  getAnnouncementsFeed: hoisted.getAnnouncementsFeed,
}))
vi.mock('../product-updates/getProductUpdates.service', () => ({
  getProductUpdates: hoisted.getProductUpdates,
  DASHBOARD_PRODUCT_UPDATES_LIMIT: 5,
}))
vi.mock('../support/getSupportSessions.service', () => ({
  getSupportSessions: hoisted.getSupportSessions,
}))
vi.mock('../schedule/getDashboardSchedule.service', () => ({
  getDashboardSchedule: hoisted.getDashboardSchedule,
}))
vi.mock('../pending/getDashboardPendingTasks.service', () => ({
  getDashboardPendingTasks: hoisted.getDashboardPendingTasks,
}))
vi.mock('../getWelcomeModalStatus.service', () => ({
  getWelcomeModalStatus: hoisted.getWelcomeModalStatus,
}))
vi.mock('../getT0FlowStatus.service', () => ({
  getT0FlowStatus: hoisted.getT0FlowStatus,
}))
vi.mock('../getT0FlowLectures.service', () => ({
  getT0FlowLectures: hoisted.getT0FlowLectures,
}))
vi.mock('../t0/getFeePaymentBanner.service', () => ({
  getFeePaymentBanners: hoisted.getFeePaymentBanners,
}))
vi.mock('../getBatchStartBanners.service', () => ({
  getBatchStartBanners: hoisted.getBatchStartBanners,
}))
vi.mock('../getBatchTransferPaymentBanners.service', () => ({
  getBatchTransferPaymentBanners: hoisted.getBatchTransferPaymentBanners,
}))

const banners = [
  { id: 1, title: 'B', description: null, imageUrl: null, ctaUrl: null },
]
const announcements = [
  {
    id: 2,
    source: 'a',
    title: 'A',
    body: '',
    authorName: null,
    isForYou: false,
    ctaName: null,
    ctaLink: null,
  },
]
const liveSession = {
  id: 3,
  title: 'Support',
  schedule: '2026-07-02T11:00:00+05:30',
  concludes: '2026-07-02T13:00:00+05:30',
  zoomLink: 'https://zoom.us/j/1',
  status: 'live',
}
const welcomeModal = { showWelcomeModal: false }
const t0FlowOff = {
  showT0Flow: false,
  batches: [],
  profilePhotoUrl: null,
  downloadAppCompleted: false,
  showGuidedTour: false,
}

describe('getDashboardOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getWelcomeBanners.mockResolvedValue(banners)
    hoisted.getAnnouncementsFeed.mockResolvedValue(announcements)
    hoisted.getSupportSessions.mockResolvedValue([liveSession])
    hoisted.getDashboardSchedule.mockResolvedValue([])
    hoisted.getDashboardPendingTasks.mockResolvedValue([])
    hoisted.getWelcomeModalStatus.mockResolvedValue(welcomeModal)
    hoisted.getT0FlowStatus.mockResolvedValue(t0FlowOff)
    hoisted.getFeePaymentBanners.mockResolvedValue([])
    hoisted.getBatchStartBanners.mockResolvedValue([])
    hoisted.getBatchTransferPaymentBanners.mockResolvedValue([])
  })

  it('composes every section and features the selected support session', async () => {
    const productUpdates = [{ id: 9, title: 'Update', imageUrl: null }]
    const schedule = [{ id: 4, learningType: 'lecture', title: 'Workshop' }]
    const pendingTasks = [
      { id: 5, learningType: 'assignment', title: 'Worksheet' },
    ]
    hoisted.getProductUpdates.mockResolvedValueOnce(productUpdates)
    hoisted.getDashboardSchedule.mockResolvedValueOnce(schedule)
    hoisted.getDashboardPendingTasks.mockResolvedValueOnce(pendingTasks)
    const { getDashboardOverview } =
      await import('../getDashboardOverview.service')

    const now = new Date('2026-07-02T00:00:00Z')
    const result = await getDashboardOverview(7, now)

    expect(hoisted.getWelcomeBanners).toHaveBeenCalledWith(7, now)
    expect(hoisted.getAnnouncementsFeed).toHaveBeenCalledWith(7, now)
    expect(hoisted.getProductUpdates).toHaveBeenCalledWith()
    expect(hoisted.getSupportSessions).toHaveBeenCalledWith(now)
    expect(hoisted.getDashboardSchedule).toHaveBeenCalledWith(7, now)
    expect(hoisted.getDashboardPendingTasks).toHaveBeenCalledWith(7, now)
    expect(result).toEqual({
      banners,
      announcements,
      productUpdates,
      supportSession: liveSession,
      schedule,
      pendingTasks,
      welcomeModal,
      t0Flow: t0FlowOff,
      feePaymentBanners: [],
      batchStartBanners: [],
      batchTransferPaymentBanners: [],
    })
    expect(hoisted.getFeePaymentBanners).toHaveBeenCalledWith(7, now)
    expect(hoisted.getBatchStartBanners).toHaveBeenCalledWith(7, now)
    // Non-T0 user: lectures are not computed.
    expect(hoisted.getT0FlowLectures).not.toHaveBeenCalled()
  })

  it('nests the primary batch guided-tour lectures under t0Flow.batches for a T0 user', async () => {
    const t0FlowOn = {
      showT0Flow: true,
      batches: [
        {
          batchId: 42,
          batchName: 'MERN',
          showProgramTab: false,
          lms: { completed: 0, total: 3, complete: false },
          program: null,
          lectures: null,
        },
        {
          batchId: 43,
          batchName: 'DA',
          showProgramTab: true,
          lms: { completed: 0, total: 2, complete: false },
          program: null,
          lectures: null,
        },
      ],
      profilePhotoUrl: null,
      downloadAppCompleted: false,
      showGuidedTour: true,
    }
    const lectures = {
      lmsLectures: [],
      programLectures: [],
      completedLectureIds: [],
      legalAgreementSections: [],
      isDocumentsRequired: false,
      isStudentKitApplicable: false,
      idCardUrl: null,
    }
    hoisted.getProductUpdates.mockResolvedValueOnce([])
    hoisted.getT0FlowStatus.mockResolvedValueOnce(t0FlowOn)
    hoisted.getT0FlowLectures.mockResolvedValueOnce(lectures)
    const { getDashboardOverview } =
      await import('../getDashboardOverview.service')

    const result = await getDashboardOverview(
      7,
      new Date('2026-07-02T00:00:00Z'),
    )

    // Computed for the primary (first) batch and nested onto it; others stay null.
    expect(hoisted.getT0FlowLectures).toHaveBeenCalledWith(7, 42, 'web')
    expect(result.t0Flow.batches[0].lectures).toEqual(lectures)
    expect(result.t0Flow.batches[1].lectures).toBeNull()
    // No top-level sibling field anymore.
    expect('t0FlowLectures' in result).toBe(false)
  })

  it('caps product updates at the dashboard limit of 5', async () => {
    hoisted.getProductUpdates.mockResolvedValueOnce(
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        title: `U${i}`,
        imageUrl: null,
      })),
    )
    const { getDashboardOverview } =
      await import('../getDashboardOverview.service')

    const result = await getDashboardOverview(
      7,
      new Date('2026-07-02T00:00:00Z'),
    )
    expect(result.productUpdates).toHaveLength(5)
    expect(result.productUpdates.map((u) => u.id)).toEqual([0, 1, 2, 3, 4])
  })
})
