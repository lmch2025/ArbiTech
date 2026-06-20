import { ok } from "@/lib/http";

// Renvoie la clé publique VAPID au client (nécessaire pour PushManager.subscribe)
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return ok({ publicKey: null, error: "VAPID non configuré" });
  }
  return ok({ publicKey });
}
