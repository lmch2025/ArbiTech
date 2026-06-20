import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized, handleErr } from "@/lib/http";

// Supprime un abonnement push (désabonnement)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const endpoint = body.endpoint as string | undefined;
    if (!endpoint) return bad("endpoint requis.");

    await db.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint },
    });

    return ok({ message: "Abonnement push supprimé." });
  } catch (e) {
    return handleErr(e);
  }
}
