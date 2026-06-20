import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { ok, bad, unauthorized, handleErr } from "@/lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ok({ subscription: null });
    const sub = await db.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });
    if (!sub) return ok({ subscription: null });
    const active = sub.status === "ACTIVE" && sub.endDate > new Date();
    return ok({
      subscription: {
        id: sub.id,
        status: active ? "ACTIVE" : "EXPIRED",
        plan: { code: sub.plan.code, name: sub.plan.name },
        billingCycle: sub.billingCycle,
        amount: sub.amount,
        startDate: sub.startDate,
        endDate: sub.endDate,
      },
    });
  } catch (e) {
    return handleErr(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const planCode = String(body.planCode || "").toUpperCase();
    const billingCycle = (String(body.billingCycle || "MONTHLY").toUpperCase() === "YEARLY" ? "YEARLY" : "MONTHLY");

    const plan = await db.plan.findUnique({ where: { code: planCode } });
    if (!plan || !plan.isActive) return bad("Ce forfait n'existe pas ou n'est plus disponible.");

    if (user.status === "BANNED") return unauthorized("Votre compte est suspendu.");

    const amount = billingCycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly;
    const now = new Date();
    const endDate = new Date(now.getTime() + (billingCycle === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000);

    // Simule un paiement réussi (Stripe serait branché ici en prod)
    const sub = await db.subscription.upsert({
      where: { userId: user.id },
      update: { planId: plan.id, status: "ACTIVE", billingCycle, amount, startDate: now, endDate },
      create: { userId: user.id, planId: plan.id, status: "ACTIVE", billingCycle, amount, startDate: now, endDate },
    });

    // Update user.planId
    await db.user.update({ where: { id: user.id }, data: { planId: plan.id } });

    // Si l'utilisateur a été parrainé, crédite le parrain
    if (user.referredById) {
      const config = await db.ambassadorConfig.findFirst({ where: { isActive: true } });
      if (config) {
        const commission =
          config.commissionType === "PERCENT"
            ? (amount * config.commissionValue) / 100
            : config.commissionValue;
        await db.ambassadorEarning.create({
          data: {
            referrerId: user.referredById,
            referredId: user.id,
            amount: commission,
            status: "PENDING",
          },
        });
      }
    }

    // Notification de bienvenue
    await db.notification.create({
      data: {
        userId: user.id,
        title: `Bienvenue dans le plan ${plan.name} ! 🎉`,
        body: `Votre abonnement est actif jusqu'au ${endDate.toLocaleDateString("fr-FR")}. Profitez à fond des opportunités.`,
        type: "SUBSCRIPTION",
      },
    });

    return ok({
      subscription: {
        id: sub.id,
        status: "ACTIVE",
        plan: { code: plan.code, name: plan.name },
        billingCycle,
        amount,
        endDate,
      },
      message: `Paiement réussi ! Vous êtes maintenant au plan ${plan.name}.`,
    });
  } catch (e) {
    return handleErr(e);
  }
}
