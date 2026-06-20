import { NextRequest } from "next/server";
import { ok, handleErr } from "@/lib/http";
import { getVisibleOpportunities } from "@/lib/opportunity-service";
import { fetchMarketSnapshot, getLatestSnapshot } from "@/lib/exchange-fetcher";
import { computeRealOpportunities, getPlatformMeta, getScraperHealth } from "@/lib/arbitrage-calculator";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const PLAN_RANK: Record<string, number> = { DECOUVERTE: 1, PRO: 2, INSTITUTIONNEL: 3 };
function rankFor(code?: string | null) {
  return PLAN_RANK[code || "DECOUVERTE"] ?? 1;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const useReal = url.searchParams.get("real") !== "false"; // défaut: vrai
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "40", 10), 100);

    const user = await getCurrentUser();
    const userPlan = user?.plan;
    const userRank = rankFor(userPlan?.code);
    const showVolume = userPlan?.hasVolume === true;

    let opportunities: any[] = [];

    // ===== SOURCE 1 : VRAIES DONNÉES (prioritaire) =====
    if (useReal) {
      let snapshot = getLatestSnapshot();
      // Si pas de snapshot récent (< 60s), on en fetch un nouveau
      if (!snapshot || Date.now() - snapshot.fetchedAt > 60000) {
        snapshot = await fetchMarketSnapshot();
      }
      const realOps = computeRealOpportunities(snapshot);

      // Enrichit avec métadonnées plateformes
      opportunities = realOps.map((op) => {
        const buyP = getPlatformMeta(op.buyPlatformCode);
        const sellP = getPlatformMeta(op.sellPlatformCode);
        return {
          ...op,
          buyPlatform: { code: op.buyPlatformCode, ...buyP },
          sellPlatform: { code: op.sellPlatformCode, ...sellP },
          volume: showVolume ? op.volume : op.type === "P2P" ? op.volume : null,
          realData: true,
        };
      });
    }

    // ===== SOURCE 2 : FALLBACK SIMULÉ (si pas de vraies données ou pour compléter) =====
    // On ajoute des opportunités simulées pour garantir un flux visible aux plans Découverte
    if (opportunities.length < 8) {
      const simResult = await getVisibleOpportunities({ limit: 20 });
      const simOps = simResult.opportunities
        .filter((s) => !opportunities.some((o) => o.pair === s.pair))
        .map((s) => ({ ...s, realData: false }));
      opportunities = [...opportunities, ...simOps];
    }

    // ===== FILTRAGE PAR PLAN =====
    opportunities = opportunities.filter((op) => {
      const opRank = rankFor(op.requiresPlan);
      if (opRank > userRank) return false;
      if (op.type === "P2P" && !userPlan?.hasP2PFiat) return false;
      return true;
    });

    // ===== FILTRES UTILISATEUR =====
    const filterPlatform = url.searchParams.get("platform");
    const filterPair = url.searchParams.get("pair");
    const filterType = url.searchParams.get("type");
    const minProfit = parseFloat(url.searchParams.get("minProfit") || "0");

    if (filterPlatform) {
      opportunities = opportunities.filter(
        (op) => op.buyPlatformCode === filterPlatform || op.sellPlatformCode === filterPlatform
      );
    }
    if (filterPair) {
      opportunities = opportunities.filter((op) => op.pair.toLowerCase().includes(filterPair.toLowerCase()));
    }
    if (filterType) {
      opportunities = opportunities.filter((op) => op.type === filterType.toUpperCase());
    }
    if (minProfit > 0) {
      opportunities = opportunities.filter((op) => op.profitPercent >= minProfit);
    }

    opportunities = opportunities.slice(0, limit);

    // Stats pour le frontend
    const snapshot = getLatestSnapshot();
    const health = getScraperHealth(snapshot);
    const realCount = opportunities.filter((o) => o.realData).length;
    const lockedCount = opportunities.length === 0 ? 0 : Math.max(0, Math.floor(opportunities.length * 0.2));

    return ok({
      opportunities,
      total: opportunities.length,
      realCount,
      simulatedCount: opportunities.length - realCount,
      lockedCount,
      scraper: {
        status: health.status,
        sources: health.sources,
        lastSync: health.lastSync,
        spotPairs: health.spotPairs,
        p2pPairs: health.p2pPairs,
      },
      plan: userPlan
        ? { code: userPlan.code, name: userPlan.name, isRealTime: userPlan.isRealTime, delaySeconds: userPlan.delaySeconds }
        : { code: "DECOUVERTE", name: "Découverte", isRealTime: false, delaySeconds: 300 },
      serverTime: new Date().toISOString(),
      websocketHint: "Pour le temps réel, connectez-vous au flux WebSocket (?XTransformPort=3003).",
    });
  } catch (e) {
    return handleErr(e);
  }
}
