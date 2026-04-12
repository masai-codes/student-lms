export function getOldStudentUiUrl() {
  return (
    (import.meta.env.VITE_OLD_STUDENT_UI_URL as string | undefined)
  );
}

/** Full URL to a path on the legacy student app (`VITE_OLD_STUDENT_UI_URL`). Edit paths in `AppNavbar` as needed. */
export function getOldStudentUiUrlForPath(path: string): string | undefined {
  const base = getOldStudentUiUrl()?.trim();
  if (!base) return undefined;
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
export function redirectToOldStudentUi() {
  const studentUiUrl = getOldStudentUiUrl();

  if (!studentUiUrl) {
    console.warn("VITE_OLD_STUDENT_UI_URL is not configured");
    return;
  }

  window.location.assign(studentUiUrl);
}

