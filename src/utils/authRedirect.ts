export function getOldStudentUiUrl() {
  return (
    (import.meta.env.VITE_OLD_STUDENT_UI_URL as string | undefined)
  );
}

type RedirectDebugContext = {
  source: string;
  reason: string;
  extra?: Record<string, unknown>;
};

/** Full URL to a path on the legacy student app (`VITE_OLD_STUDENT_UI_URL`). Edit paths in `AppNavbar` as needed. */
export function getOldStudentUiUrlForPath(path: string): string | undefined {
  const base = getOldStudentUiUrl()?.trim();
  if (!base) return undefined;
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function redirectToOldStudentUi(context?: RedirectDebugContext) {
  const studentUiUrl = getOldStudentUiUrl();
  const debugInfo = {
    timestamp: new Date().toISOString(),
    source: context?.source ?? "unknown",
    reason: context?.reason ?? "unspecified",
    targetUrl: studentUiUrl ?? null,
    currentUrl: typeof window !== "undefined" ? window.location.href : null,
    pathname: typeof window !== "undefined" ? window.location.pathname : null,
    search: typeof window !== "undefined" ? window.location.search : null,
    hash: typeof window !== "undefined" ? window.location.hash : null,
    referrer: typeof document !== "undefined" ? document.referrer : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    historyLength: typeof window !== "undefined" ? window.history.length : null,
    legacyUiConfigured: Boolean(studentUiUrl),
    envLegacyUiUrl: import.meta.env.VITE_OLD_STUDENT_UI_URL ?? null,
    extra: context?.extra ?? null,
  };

  console.info("[redirectToOldStudentUi] Redirect requested", debugInfo);

  if (!studentUiUrl) {
    console.warn("[redirectToOldStudentUi] Missing VITE_OLD_STUDENT_UI_URL", debugInfo);
    return;
  }

  // window.location.assign(studentUiUrl);
}

/** After server logout: send the user to legacy student app, or `/login` here if unset. */
export function getPostLogoutRedirectUrl(): string {
  const base = getOldStudentUiUrl()?.trim().replace(/\/$/, '')
  if (base) return `${base}/`
  return '/login'
}

