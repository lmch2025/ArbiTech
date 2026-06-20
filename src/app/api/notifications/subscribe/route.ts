import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized, handleErr } from "@/lib/http";

// Enregistre un abonnement push pour l'utilisateur connecté
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const endpoint = body.endpoint as string | undefined;
    const keys = body.keys as { p256dh?: string; auth?: string } | undefined;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return bad("Subscription invalide : endpoint + keys.p256dh + keys.auth requis.");
    }

    // Upsert : si le couple (userId, endpoint) existe déjà, on met à jour les clés
    const sub = await db.pushSubscription.upsert({
      where: { userId_endpoint: { userId: user.id, endpoint } },
      update: { keysP256dh: keys.p256dh, keysAuth: keys.auth, userAgent: req.headers.get("user-agent") || null },
      create: {
        userId: user.id,
        endpoint,
        keysP256dh: keys.p256dh,
        keysAuth: keys.auth,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return ok({ subscriptionId: sub.id, message: "Abonnement push enregistré." });
  } catch (e) {
    return handleErr(e);
  }
}
