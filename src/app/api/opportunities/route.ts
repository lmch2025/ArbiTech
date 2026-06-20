import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, handleErr } from "@/lib/http";
import { generateOpportunity, ensureSeeded, getHistory, pruneExpired } from "@/lib/opportunity-engine";

// Plan hierarchy for gating
const PLAN_RANK: Record<string, number> = { DECOUVERTE: 1, PRO: 2, INSTITUTIONNEL: 3 };

function rankFor(code?: string | null) {
  return PLAN_RANK[code || "DECOUVERTE"] ?? 1;
}

export async function GET(req: NextRequest) {
  try {
    ensureSeeded();
    pruneExpired();

    const user = await getCurrentUser();
    const userPlan = user?.plan;
    const userRank = rankFor(userPlan?.code);
    const userDelay = userPlan?.delaySeconds ?? 300; // Découverte = 5 min par défaut

    const url = new URL(req.url);
    const filterPlatform = url.searchParams.get("platform");
    const filterPair = url.searchParams.get("pair");
    const filterType = url.searchParams.get("type"); // SPOT | P2P
    const minProfit = parseFloat(url.searchParams.get("minProfit") || "0");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "40", 10), 100);

    // Récupère les plateformes pour résoudre les codes
    const platforms = await db.platform.findMany();
    const platformMap = new Map(platforms.map((p) => [p.code, p]));

    // Snapshot depuis l'historique en mémoire
    const now = Date.now();
    let snapshot = getHistory().slice(0, 50).filter((op) => new Date(op.expiresAt).getTime() > now);

    // Génère des opportunités d'âges variés (certaines plus anciennes que le délai du plan)
    // pour garantir qu'il y ait toujours du contenu visible, même pour Découverte (5 min de retard).
    if (snapshot.length < 12) {
      const generated = [];
      for (let i = 0; i < 24; i++) {
        // âges échelonnés de 30s à ~14min
        const ageSec = 30 + i * 33 + Math.random() * 20;
        const createdAt = new Date(now - ageSec * 1000);
        const op = generateOpportunity(createdAt);
        // prolonge l'expiration pour les opportunités plus anciennes
        op.expiresAt = new Date(now + (90 + Math.random() * 300) * 1000).toISOString();
        // Pour les utilisateurs Découverte/anonymes, force certaines opportunités SPOT modérées
        // en Découverte-tier afin d'avoir un flux visible suffisant.
        if (userRank <= 1 && op.type === "SPOT" && op.profitPercent <= 2.5 && i % 2 === 0) {
          op.requiresPlan = "DECOUVERTE";
        }
        generated.push(op);
      }
      snapshot = [...generated, ...snapshot];
    }

    // Applique le délai du plan (Découverte = opportunités âgées d'au moins delaySeconds)
    snapshot = snapshot.filter((op) => {
      const ageSec = (now - new Date(op.createdAt).getTime()) / 1000;
      return ageSec >= userDelay;
    });

    // Filtre par capacités du plan
    snapshot = snapshot.filter((op) => {
      const opRank = rankFor(op.requiresPlan);
      // L'utilisateur ne voit que les opportunités accessibles à son rang
      if (opRank > userRank) return false;
      // P2P réservé au plan Pro+
      if (op.type === "P2P" && !userPlan?.hasP2PFiat) return false;
      return true;
    });

    // Filtres utilisateur
    if (filterPlatform) {
      snapshot = snapshot.filter(
        (op) => op.buyPlatformCode === filterPlatform || op.sellPlatformCode === filterPlatform
      );
    }
    if (filterPair) {
      snapshot = snapshot.filter((op) => op.pair.toLowerCase().includes(filterPair.toLowerCase()));
    }
    if (filterType) {
      snapshot = snapshot.filter((op) => op.type === filterType.toUpperCase());
    }
    if (minProfit > 0) {
      snapshot = snapshot.filter((op) => op.profitPercent >= minProfit);
    }

    // Map avec infos plateforme + gating des champs premium
    const data = snapshot.slice(0, limit).map((op) => {
      const buyP = platformMap.get(op.buyPlatformCode);
      const sellP = platformMap.get(op.sellPlatformCode);
      const showVolume = userPlan?.hasVolume === true;
      return {
        ...op,
        buyPlatform: buyP
          ? { code: buyP.code, name: buyP.name, color: buyP.color, logo: buyP.logo }
          : { code: op.buyPlatformCode, name: op.buyPlatformCode, color: "#7c3aed", logo: "?" },
        sellPlatform: sellP
          ? { code: sellP.code, name: sellP.name, color: sellP.color, logo: sellP.logo }
          : { code: op.sellPlatformCode, name: op.sellPlatformCode, color: "#c026d3", logo: "?" },
        // Volume réservé au plan Institutionnel
        volume: showVolume ? op.volume : null,
        lockedForHigherPlan: false,
      };
    });

    // Compte les opportunités "verrouillées" (pour inciter à upgrader)
    const allOps = getHistory();
    const lockedCount = allOps.filter((op) => {
      const opRank = rankFor(op.requiresPlan);
      return opRank > userRank || (op.type === "P2P" && !userPlan?.hasP2PFiat);
    }).length;

    return ok({
      opportunities: data,
      total: data.length,
      lockedCount,
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
