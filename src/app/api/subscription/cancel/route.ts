import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized, handleErr } from "@/lib/http";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const subscription = await db.subscription.findUnique({ where: { userId: user.id } });
    if (!subscription || subscription.status !== "ACTIVE") {
      return bad("Vous n'avez pas d'abonnement actif.");
    }

    await db.subscription.update({
      where: { userId: user.id },
      data: { status: "CANCELLED" },
    });
    // Retire le plan de l'utilisateur (retour au plan Découverte gratuit)
    await db.user.update({
      where: { id: user.id },
      data: { planId: null },
    });

    // Notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Abonnement annulé",
        body: "Votre abonnement a été annulé. Vous êtes maintenant au plan Découverte gratuit. Vous pouvez vous réabonner à tout moment.",
        type: "SUBSCRIPTION",
      },
    });

    return ok({ message: "Votre abonnement a été annulé. Vous êtes maintenant au plan gratuit." });
  } catch (e) {
    return handleErr(e);
  }
}
