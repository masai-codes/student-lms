// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CertificatesTab } from './CertificatesTab'
import type { CertificateItem } from '@/server/api/course/getCourseCertificates.service'

const hoisted = vi.hoisted(() => ({ fetchProfileCertificates: vi.fn() }))

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchProfileCertificates: hoisted.fetchProfileCertificates,
}))
vi.mock('@/components/certificate-card/CertificateCard', () => ({
  CertificateCard: ({
    certificate: item,
  }: {
    certificate: CertificateItem
  }) => <div data-testid="certificate-card-stub">{item.certificateTitle}</div>,
}))

function certificate(
  overrides: Partial<CertificateItem> = {},
): CertificateItem {
  return {
    certificateObjectId: 'obj-1',
    code: null,
    pdfUrl: null,
    verificationUrl: 'https://verify.example/1',
    certificateTitle: 'Full Stack Completion',
    certificateType: 'Completion',
    issuedDateIso: '2026-02-01T00:00:00.000Z',
    batchName: 'SDE Batch 42',
    ...overrides,
  }
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <CertificatesTab />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CertificatesTab', () => {
  it('shows a skeleton while loading', () => {
    hoisted.fetchProfileCertificates.mockReturnValue(new Promise(() => {}))
    renderTab()
    expect(screen.getByTestId('profile-certificates-skeleton')).toBeTruthy()
  })

  it('shows an error state when the request fails', async () => {
    hoisted.fetchProfileCertificates.mockRejectedValue(new Error('boom'))
    renderTab()
    await waitFor(() =>
      expect(screen.getByTestId('profile-certificates-error')).toBeTruthy(),
    )
  })

  it('shows an empty state rather than rendering nothing', async () => {
    hoisted.fetchProfileCertificates.mockResolvedValue([])
    renderTab()

    const empty = await waitFor(() =>
      screen.getByTestId('profile-certificates-empty'),
    )
    expect(empty.textContent).toContain('No certificates yet')
  })

  it('reuses the shared CertificateCard for each certificate', async () => {
    hoisted.fetchProfileCertificates.mockResolvedValue([
      certificate(),
      certificate({
        certificateObjectId: 'obj-2',
        certificateTitle: 'DS Completion',
        batchName: 'DS Batch 7',
      }),
    ])
    renderTab()

    await waitFor(() =>
      expect(screen.getAllByTestId('profile-certificate-item')).toHaveLength(2),
    )
    expect(screen.getAllByTestId('certificate-card-stub')).toHaveLength(2)
    expect(screen.getByText('Full Stack Completion')).toBeTruthy()
    expect(screen.getByText('DS Completion')).toBeTruthy()
  })

  it('renders certificates that share an object id across batches', async () => {
    hoisted.fetchProfileCertificates.mockResolvedValue([
      certificate(),
      certificate({ batchName: 'DS Batch 7' }),
    ])
    renderTab()

    await waitFor(() =>
      expect(screen.getAllByTestId('profile-certificate-item')).toHaveLength(2),
    )
  })
})
