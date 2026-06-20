import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, bad, handleErr } from "@/lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const [referrals, earnings, config, pendingPayouts] = await Promise.all([
      db.user.findMany({
        where: { referredById: user.id },
        select: { id: true, name: true, email: true, createdAt: true, planId: true, status: true },
        orderBy: { createdAt: "desc" },
      }),
      db.ambassadorEarning.findMany({
        where: { referrerId: user.id },
        include: { referred: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.ambassadorConfig.findFirst({ where: { isActive: true } }),
      db.ambassadorEarning.aggregate({
        where: { referrerId: user.id, status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);

    // Enrich referrals with plan info
    const planIds = [...new Set(referrals.map((r) => r.planId).filter(Boolean))] as string[];
    const plans = planIds.length
      ? await db.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, code: true, name: true } })
      : [];
    const planMap = new Map(plans.map((p) => [p.id, p]));

    const totalEarned = earnings.reduce((s, e) => s + e.amount, 0);
    const availablePayout = pendingPayouts._sum.amount ?? 0;

    return ok({
      referralCode: user.referralCode,
      referralLink: `/?ref=${user.referralCode}`,
      stats: {
        totalReferrals: referrals.length,
        activeReferrals: referrals.filter((r) => r.status === "ACTIVE").length,
        payingReferrals: referrals.filter((r) => r.planId).length,
        totalEarned,
        availablePayout,
        minPayout: config?.minPayout ?? 5000,
        commissionType: config?.commissionType ?? "PERCENT",
        commissionValue: config?.commissionValue ?? 20,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        createdAt: r.createdAt,
        status: r.status,
        plan: r.planId ? planMap.get(r.planId)?.name ?? null : null,
      })),
      earnings: earnings.map((e) => ({
        id: e.id,
        amount: e.amount,
        status: e.status,
        createdAt: e.createdAt,
        referredName: e.referred.name,
      })),
    });
  } catch (e) {
    return handleErr(e);
  }
}

// Claim a payout (marks pending earnings as PAID)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "claim");

    if (action !== "claim") return bad("Action inconnue.");

    const config = await db.ambassadorConfig.findFirst({ where: { isActive: true } });
    const minPayout = config?.minPayout ?? 5000;

    const pending = await db.ambassadorEarning.aggregate({
      where: { referrerId: user.id, status: "PENDING" },
      _sum: { amount: true },
    });
    const total = pending._sum.amount ?? 0;
    if (total < minPayout) {
      return bad(`Montant minimum de retrait : ${minPayout.toLocaleString("fr-FR")} FCFA. Vous avez ${total.toLocaleString("fr-FR")} FCFA.`);
    }

    await db.ambassadorEarning.updateMany({
      where: { referrerId: user.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });

    return ok({
      message: `Demande de paiement de ${total.toLocaleString("fr-FR")} FCFA enregistrée. Vous serez contacté sous 48h.`,
      paidAmount: total,
    });
  } catch (e) {
    return handleErr(e);
  }
}
