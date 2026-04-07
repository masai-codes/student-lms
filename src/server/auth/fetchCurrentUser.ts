import { eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { clubMembers, users } from "@/db/schema";
import { getCurrentSessionUserId } from "@/server/auth/getCurrentSessionUserId";

export const fetchCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const sessionUserId = await getCurrentSessionUserId();
  if (!sessionUserId) return null;

  const userRecord = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1);

  const user = userRecord[0];

  const membershipRows = await db
    .select({ clubId: clubMembers.clubId })
    .from(clubMembers)
    .where(eq(clubMembers.userId, sessionUserId))
    .limit(1);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    joinedClubId: membershipRows[0]?.clubId ?? null,
  };
});
