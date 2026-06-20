import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchMarketSnapshot, getLatestSnapshot } from "@/lib/exchange-fetcher";
import { computeRealOpportunities, getScraperHealth } from "@/lib/arbitrage-calculator";
import { broadcastPush } from "@/lib/web-push-server";

// Vercel Cron Job — réchauffe le cache des prix de marché toutes les minutes
// ET envoie des notifications push aux utilisateurs abonnés sur les opportunités chaudes.

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel serverless function timeout (push broadcast peut prendre du temps)

// Garde en mémoire les IDs d'opportunités déjà notifiées (pour éviter le spam)
const notifiedOpIds = new Set<string>();

export async function GET(req: NextRequest) {
  // Vérifie le secret pour empêcher l'abus (configuré dans Vercel env vars)
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET || "CHANGE_ME_IN_VERCEL_ENV";

  // Vercel Cron envoie un header Authorization: Bearer <CRON_SECRET>
  const providedSecret = authHeader?.replace("Bearer ", "") || secret;
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const snapshot = getLatestSnapshot();
    const now = Date.now();
    const isStale = !snapshot || now - snapshot.fetchedAt > 30000;

    let freshSnapshot = snapshot;
    if (isStale) {
      freshSnapshot = await fetchMarketSnapshot();
    }
    if (!freshSnapshot) {
      return NextResponse.json({ ok: false, error: "No snapshot available" }, { status: 500 });
    }

    const health = getScraperHealth(freshSnapshot);
    const allOps = computeRealOpportunities(freshSnapshot);

    // ===== Envoi de notifications push sur les opportunités chaudes nouvelles =====
    let pushSent = 0;
    let pushFailed = 0;
    let expiredRemoved = 0;

    // Opportunités chaudes (≥3% de profit) ET pas encore notifiées
    const hotNewOps = allOps.filter((op) => op.profitPercent >= 3 && !notifiedOpIds.has(op.id));
    // Plafonne la mémoire des IDs notifiés
    for (const op of allOps) notifiedOpIds.add(op.id);
    if (notifiedOpIds.size > 100) {
      const keep = Array.from(notifiedOpIds).slice(-50);
      notifiedOpIds.clear();
      keep.forEach((id) => notifiedOpIds.add(id));
    }

    if (hotNewOps.length > 0) {
      try {
        // Récupère tous les abonnements push actifs (tous utilisateurs confondus)
        const subs = await db.pushSubscription.findMany({
          select: { id: true, endpoint: true, keysP256dh: true, keysAuth: true },
        });

        if (subs.length > 0) {
          // Notifie sur l'opportunité la plus chaude (pour éviter le spam)
          const hottest = hotNewOps[0];
          const payload = {
            title: `🔥 Opportunité chaude : ${hottest.pair}`,
            body: `${hottest.buyPlatformCode} → ${hottest.sellPlatformCode} · +${hottest.profitPercent.toFixed(2)}% de profit`,
            url: "/?view=dashboard",
            tag: "arbitech-hot-opportunity",
          };

          const result = await broadcastPush(subs, payload);
          pushSent = result.sent;
          pushFailed = result.failed;

          // Supprime les abonnements expirés (404/410)
          if (result.expiredEndpoints.length > 0) {
            const del = await db.pushSubscription.deleteMany({
              where: { endpoint: { in: result.expiredEndpoints } },
            });
            expiredRemoved = del.count;
          }
        }
      } catch (pushErr) {
        // Le push peut échouer si VAPID n'est pas configuré — on ne casse pas le cron pour ça
        console.error("[cron] push error:", String(pushErr).slice(0, 120));
      }
    }

    return NextResponse.json({
      ok: true,
      action: isStale ? "fetched" : "cache_hit",
      sources: freshSnapshot.sources,
      opportunityCount: health.opportunityCount,
      hotNewOps: hotNewOps.length,
      push: { sent: pushSent, failed: pushFailed, expiredRemoved },
      errors: freshSnapshot.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e).slice(0, 200) },
      { status: 500 }
    );
  }
}
