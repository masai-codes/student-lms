import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getCallbackAdmissionFlags: vi.fn(),
  getCallbackOptions: vi.fn(),
  listCallbacks: vi.fn(),
  getBatchContact: vi.fn(),
  getOneOnOneGroups: vi.fn(),
  getUserClient: vi.fn(),
  getUserSupportBatches: vi.fn(),
  countOpenTickets: vi.fn(),
  listTickets: vi.fn(),
}))

vi.mock('@/server/api/support/services/callback.service', () => ({
  getCallbackAdmissionFlags: hoisted.getCallbackAdmissionFlags,
  getCallbackOptions: hoisted.getCallbackOptions,
  listCallbacks: hoisted.listCallbacks,
}))
vi.mock('@/server/api/support/services/directory.service', () => ({
  getBatchContact: hoisted.getBatchContact,
  getOneOnOneGroups: hoisted.getOneOnOneGroups,
  getUserClient: hoisted.getUserClient,
  getUserSupportBatches: hoisted.getUserSupportBatches,
}))
vi.mock('@/server/api/support/services/tickets.read.service', () => ({
  countOpenTickets: hoisted.countOpenTickets,
  listTickets: hoisted.listTickets,
}))

describe('getFloatingChatInbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserSupportBatches.mockResolvedValue([])
    hoisted.listTickets.mockResolvedValue([])
    hoisted.listCallbacks.mockResolvedValue([])
    hoisted.countOpenTickets.mockResolvedValue(0)
    hoisted.getCallbackOptions.mockResolvedValue({
      reasons: [],
      timeslots: [],
    })
    hoisted.getCallbackAdmissionFlags.mockResolvedValue({
      isNewUserJourney: false,
      fullFeesPaidBatchIds: [],
    })
    hoisted.getOneOnOneGroups.mockResolvedValue([])
  })

  it('sets isIitj true when the student is on the iitj client', async () => {
    hoisted.getUserClient.mockResolvedValue('iitj')
    const { getFloatingChatInbox } =
      await import('../getFloatingChatInbox.service')

    const inbox = await getFloatingChatInbox(1)

    expect(inbox.isIitj).toBe(true)
    expect(hoisted.getUserClient).toHaveBeenCalledWith(1)
  })

  it('sets isIitj false for any other client', async () => {
    hoisted.getUserClient.mockResolvedValue('masai')
    const { getFloatingChatInbox } =
      await import('../getFloatingChatInbox.service')

    const inbox = await getFloatingChatInbox(1)

    expect(inbox.isIitj).toBe(false)
  })
})
