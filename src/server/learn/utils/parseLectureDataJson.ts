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

function readPositiveId(value: unknown): number | null {
  const numeric =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

export function readAssociatedLectureId(data: unknown): number | null {
  const ids = readAssociatedLectureIds(data)
  return ids[0] ?? null
}

export function readAssociatedLectureIds(data: unknown): Array<number> {
  const record = parseLectureDataJson(data)
  if (!record) return []

  const associated = record.associatedLecture
  if (associated == null) return []

  if (Array.isArray(associated)) {
    const ids: Array<number> = []
    for (const item of associated) {
      if (!isRecord(item)) continue
      const id = readPositiveId(item.id)
      if (id != null) ids.push(id)
    }
    return ids
  }

  if (!isRecord(associated)) return []
  const id = readPositiveId(associated.id)
  return id != null ? [id] : []
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
