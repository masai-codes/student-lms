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

export const getMasaiverseAccessDebugServer = createServerFn({ method: "GET" })
  .inputValidator((data: { userId: number }) => data)
  .handler(async ({ data }) => getMasaiverseAccessDebug(data.userId));

export type MasaiverseAccessDebug = {
  canShowMasaiverse: boolean;
  reason:
    | "admin-user"
    | "no-enrolled-batches"
    | "enabled-in-batch-meta"
    | "disabled-in-batch-meta";
  userId: number;
  enrolledBatchIds: Array<number>;
  matchingBatchIds: Array<number>;
};

export async function getMasaiverseAccessDebug(
  userId: number,
): Promise<MasaiverseAccessDebug> {
  const batchIds = await getBatchIdsForEnrolledUser(userId);

  if (!batchIds.length) {
    return {
      canShowMasaiverse: false,
      reason: "no-enrolled-batches",
      userId,
      enrolledBatchIds: [],
      matchingBatchIds: [],
    };
  }

  const batchMetaRows = await db
    .select({ id: batches.id, meta: batches.meta })
    .from(batches)
    .where(inArray(batches.id, batchIds));

  const matchingBatchIds = batchMetaRows
    .filter((row) => normalizeMeta(row.meta).show_masaiverse === true)
    .map((row) => row.id);

  if (matchingBatchIds.length) {
    return {
      canShowMasaiverse: true,
      reason: "enabled-in-batch-meta",
      userId,
      enrolledBatchIds: batchIds,
      matchingBatchIds,
    };
  }

  return {
    canShowMasaiverse: false,
    reason: "disabled-in-batch-meta",
    userId,
    enrolledBatchIds: batchIds,
    matchingBatchIds: [],
  };
}

export async function showMasaiversePageHandler({ data }: { data: { userId: number } }) {
  const accessDebug = await getMasaiverseAccessDebug(data.userId);
  return accessDebug.canShowMasaiverse;
}
