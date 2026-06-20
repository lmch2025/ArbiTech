import webpush from "web-push";

/**
 * Initialise web-push avec les clés VAPID (une seule fois).
 * Les clés sont lues depuis les variables d'environnement.
 */
let initialized = false;

export function initWebPush() {
  if (initialized) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@arbitech.app";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys manquantes. Générez-les avec `npx web-push generate-vapid-keys` et ajoutez-les au .env (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)."
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  keysP256dh: string;
  keysAuth: string;
};

/**
 * Convertit une ligne DB en objet subscription compréhensible par web-push.
 */
export function toPushSubscription(row: PushSubscriptionRow) {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.keysP256dh,
      auth: row.keysAuth,
    },
  } as webpush.PushSubscription;
}

/**
 * Envoie une notification push à UN abonné.
 * Retourne true si succès, false si échec (ex: subscription expirée).
 */
export async function sendPushToOne(
  sub: PushSubscriptionRow,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<boolean> {
  try {
    initWebPush();
    await webpush.sendNotification(
      toPushSubscription(sub),
      JSON.stringify(payload),
      {
        TTL: 60 * 60, // 1 heure
        urgency: "high",
        topic: payload.tag || "arbitech-opportunity",
      }
    );
    return true;
  } catch (err: any) {
    // 404 / 410 = subscription expirée ou désabonnée → on devra la supprimer côté appelant
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      return false;
    }
    console.error("[web-push] send error:", err?.message?.slice(0, 120));
    return false;
  }
}

/**
 * Envoie une notification push à PLUSIEURS abonnés (tous les utilisateurs abonnés).
 * Retourne le nombre de succès et la liste des endpoints à supprimer (expirés).
 */
export async function broadcastPush(
  subs: PushSubscriptionRow[],
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<{ sent: number; failed: number; expiredEndpoints: string[] }> {
  const expiredEndpoints: string[] = [];
  let sent = 0;
  let failed = 0;

  const results = await Promise.all(
    subs.map(async (sub) => {
      const ok = await sendPushToOne(sub, payload);
      return { sub, ok };
    })
  );

  for (const { sub, ok } of results) {
    if (ok) sent++;
    else {
      failed++;
      expiredEndpoints.push(sub.endpoint);
    }
  }

  return { sent, failed, expiredEndpoints };
}
