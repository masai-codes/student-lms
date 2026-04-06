export function getLegacyStudentUiUrl() {
  return import.meta.env.VITE_OLD_STUDENT_UI_URL as string | undefined;
}

export function redirectToLegacyStudentUi() {
  const legacyUiUrl = getLegacyStudentUiUrl();

  if (!legacyUiUrl) {
    console.warn("VITE_OLD_STUDENT_UI_URL is not configured");
    return;
  }

  window.location.assign(legacyUiUrl);
}
