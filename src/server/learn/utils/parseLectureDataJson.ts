function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseLectureDataJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null
  if (isRecord(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw)
      return isRecord(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

export function readAssociatedLectureId(data: unknown): number | null {
  const record = parseLectureDataJson(data)
  if (!record) return null
  const associated = record.associatedLecture
  if (!isRecord(associated)) return null
  const id = associated.id
  const numeric = typeof id === 'number' ? id : typeof id === 'string' ? Number(id) : NaN
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

export function isAssignmentLinkedToLecture(
  assignmentData: unknown,
  lectureId: number,
): boolean {
  const record = parseLectureDataJson(assignmentData)
  if (!record) return false

  const associated = record.associatedLecture
  if (associated == null) return false

  if (Array.isArray(associated)) {
    return associated.some(item => {
      if (!isRecord(item)) return false
      const id = item.id
      const numeric =
        typeof id === 'number' ? id : typeof id === 'string' ? Number(id) : NaN
      return Number.isFinite(numeric) && numeric === lectureId
    })
  }

  if (!isRecord(associated)) return false
  const id = associated.id
  const numeric =
    typeof id === 'number' ? id : typeof id === 'string' ? Number(id) : NaN
  return Number.isFinite(numeric) && numeric === lectureId
}
