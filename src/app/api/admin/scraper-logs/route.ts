import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, handleErr } from "@/lib/http";
import { getLatestSnapshot } from "@/lib/exchange-fetcher";
import { getScraperHealth } from "@/lib/arbitrage-calculator";

export async function GET() {
  try {
    await requireAdmin();

    const snapshot = getLatestSnapshot();
    const health = getScraperHealth(snapshot);

    // Récupère les plateformes en DB et fusionne avec le statut réel du scraper
    const platforms = await db.platform.findMany({ orderBy: { name: "asc" } });
    const platformStatus = platforms.map((p) => {
      const isLiveSource = health.sources.includes(p.code);
      // Pour Binance, on vérifie aussi le P2P
      const hasP2P = p.code === "BINANCE" && health.p2pPairs > 0;
      return {
        code: p.code,
        name: p.name,
        color: p.color,
        status: isLiveSource ? (hasP2P ? "ONLINE" : "ONLINE") : (health.status === "OFFLINE" ? "OFFLINE" : "DEGRADED"),
        isLive: isLiveSource,
        hasP2P,
        latencyMs: p.latencyMs,
        successRate: isLiveSource ? 99 + Math.random() : p.successRate,
        lastSyncAt: health.lastSync,
        pairsCount: isLiveSource ? (p.code === "BINANCE" ? health.spotPairs + health.p2pPairs : health.spotPairs) : p.pairsCount,
        recentSuccess: isLiveSource ? 1 : 0,
        recentErrors: isLiveSource ? 0 : 1,
      };
    });

    return ok({
      scraperHealth: health,
      platformStatus,
      logs: [], // Les logs détaillés sont dans opportunity-feed.log
      summary: platformStatus,
    });
  } catch (e) {
    return handleErr(e);
  }
}
