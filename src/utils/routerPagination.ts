export function createPageSetter(navigate: any) {
  return (newPage: number) =>
    navigate({
      search: () => (newPage === 1 ? { page: undefined } : { page: newPage }),
    })
}
