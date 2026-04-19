import { createServerFn } from "@tanstack/react-start";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { batches } from "@/db/schema";
import { getBatchIdsForEnrolledUser } from "@/server/batches/getBatchIdsForEnrolledUser";

type BatchMeta = {
  show_masaiverse?: boolean;
};

function normalizeMeta(meta: unknown): BatchMeta {
  if (!meta) return {};
  if (typeof meta === "object") return meta as BatchMeta;
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta) as BatchMeta;
    } catch {
      return {};
    }
  }
  return {};
}

export const showMasaiversePage = createServerFn({ method: "GET" })
  .inputValidator((data: { userId: number }) => data)
  .handler(showMasaiversePageHandler);

export async function showMasaiversePageHandler({ data }: { data: { userId: number } }) {
  const batchIds = await getBatchIdsForEnrolledUser(data.userId);

  if (!batchIds.length) return false;
  const batchMetaRows = await db
    .select({ meta: batches.meta })
    .from(batches)
    .where(inArray(batches.id, batchIds));

  return batchMetaRows.some((row) => normalizeMeta(row.meta).show_masaiverse === true);
}
