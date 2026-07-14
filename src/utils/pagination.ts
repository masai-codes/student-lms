export function getCurrentPage(page?: number) {
  return page && page > 0 ? page : 1
}

export function getTotalPages(totalItems: number, pageSize: number) {
  return Math.ceil(totalItems / pageSize)
}

export function paginate<T>(
  items: Array<T>,
  currentPage: number,
  pageSize: number,
): Array<T> {
  const start = (currentPage - 1) * pageSize
  const end = currentPage * pageSize
  return items.slice(start, end)
}
