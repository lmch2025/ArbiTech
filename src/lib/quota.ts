import { db } from "@/lib/db";
import type { QuotaInfo } from "@/lib/types";

export function opportunityFingerprint(op: {
  type: string;
  pair: string;
  buyPlatformCode: string;
  sellPlatformCode: string;
}): string {
  return `${op.type}:${op.pair}:${op.buyPlatformCode}:${op.sellPlatformCode}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function nextMidnightISO(): string {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.toISOString();
}

export type QuotaResult = {
  unlockedFingerprints: string[];
  dailyViewsCount: number;
  quotaReached: boolean;
  quota: QuotaInfo;
};

export async function computeQuota(userId: string, fingerprints: string[], limit: number): Promise<QuotaResult> {
  if (limit === 0 || limit === undefined) {
    return {
      unlockedFingerprints: fingerprints,
      dailyViewsCount: 0,
      quotaReached: false,
      quota: { used: 0, limit: 0, remaining: Infinity, resetAt: nextMidnightISO() },
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { dailyViewsCount: true, dailyViewsDate: true, dailySeenFingerprints: true },
  });

  const now = new Date();
  let count = user?.dailyViewsCount ?? 0;
  let seen: string[] = [];

  if (!user?.dailyViewsDate || !isSameDay(new Date(user.dailyViewsDate), now)) {
    count = 0;
    seen = [];
  } else {
    try { seen = JSON.parse(user?.dailySeenFingerprints || "[]"); } catch { seen = []; }
  }

  const newSeen: string[] = [...seen];
  const unlockedFingerprints: string[] = [];
  let quotaReached = false;

  for (const fp of fingerprints) {
    if (seen.includes(fp)) {
      unlockedFingerprints.push(fp);
    } else if (count < limit) {
      unlockedFingerprints.push(fp);
      newSeen.push(fp);
      count++;
    } else {
      quotaReached = true;
    }
  }

  return {
    unlockedFingerprints,
    dailyViewsCount: count,
    quotaReached,
    quota: { used: count, limit, remaining: Math.max(0, limit - count), resetAt: nextMidnightISO() },
  };
}

export async function saveQuota(userId: string, result: QuotaResult, limit: number): Promise<void> {
  if (limit === 0) return;
  const now = new Date();
  await db.user.update({
    where: { id: userId },
    data: {
      dailyViewsCount: result.dailyViewsCount,
      dailyViewsDate: now,
      dailySeenFingerprints: JSON.stringify(result.unlockedFingerprints.slice(-Math.max(limit, 50))),
    },
  });
}
