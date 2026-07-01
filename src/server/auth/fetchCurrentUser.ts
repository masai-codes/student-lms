import { createServerFn } from "@tanstack/react-start";
import { getCurrentSessionUserId } from "@/server/auth/getCurrentSessionUserId";
import { loadUserById } from "@/server/auth/loadUserById";

/**
 * Current session user for layouts and client calls.
 */
export const fetchCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const sessionUserId = await getCurrentSessionUserId();
  if (!sessionUserId) return null;
  return loadUserById(sessionUserId);
});

/** Same handler as {@link fetchCurrentUser}; use whichever name fits the caller. */
export const fetchMe = fetchCurrentUser;

export type { MeUser } from "@/server/auth/loadUserById";
