import { db } from "@/lib/db";
import type { MarketSnapshot } from "@/lib/exchange-fetcher";

const CACHE_KEY = "market_snapshot";
const STALE_MS = 60_000; // 60 secondes

export async function getCachedSnapshot(maxAgeMs: number = STALE_MS): Promise<MarketSnapshot | null> {
  try {
    const entry = await db.cacheEntry.findUnique({ where: { key: CACHE_KEY } });
    if (!entry) return null;
    const age = Date.now() - entry.updatedAt.getTime();
    if (age > maxAgeMs) return null;
    return JSON.parse(entry.value) as MarketSnapshot;
  } catch {
    return null;
  }
}

export async function setCachedSnapshot(snapshot: MarketSnapshot): Promise<void> {
  try {
    await db.cacheEntry.upsert({
      where: { key: CACHE_KEY },
      update: { value: JSON.stringify(snapshot) },
      create: { key: CACHE_KEY, value: JSON.stringify(snapshot) },
    });
  } catch (e) {
    console.error("[cache] setCachedSnapshot error:", String(e).slice(0, 100));
  }
}

export async function getFreshSnapshot(): Promise<MarketSnapshot | null> {
  const cached = await getCachedSnapshot(STALE_MS);
  if (cached) return cached;
  try {
    const { fetchMarketSnapshot } = await import("@/lib/exchange-fetcher");
    const fresh = await fetchMarketSnapshot();
    await setCachedSnapshot(fresh);
    return fresh;
  } catch {
    const stale = await getCachedSnapshot(Infinity);
    return stale;
  }
}
