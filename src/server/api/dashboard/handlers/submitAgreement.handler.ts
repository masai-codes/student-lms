import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { submitAgreement } from '@/server/api/dashboard/submitAgreement.service'
import type { AgreementFormData } from '@/server/api/dashboard/submitAgreement.service'

export async function handleSubmitAgreement(
  request: Request,
  sectionId: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const id = Number(sectionId)
    if (!Number.isInteger(id) || id <= 0) return jsonOk({ success: false })

    const body = await request.json() as { formData?: AgreementFormData }
    const fd = body?.formData
    const formData: AgreementFormData = {
      location: fd?.location ?? '',
      name: fd?.name ?? '',
      email: fd?.email ?? '',
      phone: fd?.phone ?? '',
      dob: fd?.dob ?? '',
      gender: fd?.gender ?? '',
      address: fd?.address ?? '',
      fatherName: fd?.fatherName ?? '',
      parentName: fd?.parentName ?? '',
      parentEmail: fd?.parentEmail ?? '',
      parentMobileCountry: fd?.parentMobileCountry ?? '',
      parentMobileNumber: fd?.parentMobileNumber ?? '',
      currentStatus: fd?.currentStatus ?? '',
      studyYear: fd?.studyYear ?? '',
      workDomain: fd?.workDomain ?? '',
      educationDetails: fd?.educationDetails ?? '',
      yearOfGraduation: fd?.yearOfGraduation ?? '',
      collegeName: fd?.collegeName ?? '',
      currentCompanyName: fd?.currentCompanyName ?? '',
      workExperience: fd?.workExperience ?? '',
      ctc: fd?.ctc ?? '',
      panNumber: fd?.panNumber ?? '',
      passportNumber: fd?.passportNumber ?? '',
      emergencyContactName: fd?.emergencyContactName ?? '',
      emergencyContactPhone: fd?.emergencyContactPhone ?? '',
      emergencyContactRelationship: fd?.emergencyContactRelationship ?? '',
    }

    await submitAgreement(id, userId, formData)
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) console.error('Failed to submit agreement', error)
    return mapThrownErrorToResponse(error)
  }
}
