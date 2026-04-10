export function getStudentUiUrl() {
  return (
    (import.meta.env.VITE_STUDENT_UI_URL as string | undefined) ||
    (import.meta.env.VITE_OLD_STUDENT_UI_URL as string | undefined)
  );
}

export function getLegacyStudentUiUrl() {
  return getStudentUiUrl();
}

export function redirectToStudentUi() {
  const studentUiUrl = getStudentUiUrl();

  if (!studentUiUrl) {
    console.warn("VITE_STUDENT_UI_URL is not configured");
    return;
  }

  window.location.assign(studentUiUrl);
}

export function redirectToLegacyStudentUi() {
  redirectToStudentUi();
}
