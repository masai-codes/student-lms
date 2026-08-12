import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getAchievements } from '@/server/api/profile/getAchievements.service'
import { getProfileCertificates } from '@/server/api/profile/getProfileCertificates.service'
import {
  getInvoices,
  getStudentKit,
} from '@/server/api/profile/studentStatus.service'
import { resolveBadgeLandingBaseUrl } from '@/server/api/profile/badgeLandingUrl'

export async function handleGetAchievements(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const achievements = await getAchievements(userId)
    // The share landing page is served by experience-api, so the base URL has to
    // travel with the payload — the client cannot read server env.
    return jsonOk({
      achievements,
      shareBaseUrl: resolveBadgeLandingBaseUrl(),
    })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch achievements', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_ACHIEVEMENTS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleGetProfileCertificates(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const certificates = await getProfileCertificates(userId)
    return jsonOk({ certificates })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch profile certificates', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_PROFILE_CERTIFICATES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleGetStudentKit(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const kit = await getStudentKit(userId)
    return jsonOk({ kit })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch student kit', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_STUDENT_KIT'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleGetInvoices(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const invoices = await getInvoices(userId)
    return jsonOk({ invoices })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch invoices', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_INVOICES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
