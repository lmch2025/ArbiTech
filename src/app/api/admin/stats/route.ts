import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, handleErr } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      activeSubscribers,
      totalRevenueAgg,
      monthRevenueAgg,
      lastMonthRevenueAgg,
      newUsersThisMonth,
      platforms,
      pendingPayoutsAgg,
      recentSignups,
    ] = await Promise.all([
      db.user.count({ where: { role: "USER" } }),
      db.subscription.count({ where: { status: "ACTIVE", endDate: { gt: now } } }),
      db.subscription.aggregate({ where: { status: "ACTIVE" }, _sum: { amount: true } }),
      db.subscription.aggregate({
        where: { status: "ACTIVE", startDate: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.subscription.aggregate({
        where: { status: "ACTIVE", startDate: { gte: startOfLastMonth, lt: startOfMonth } },
        _sum: { amount: true },
      }),
      db.user.count({ where: { role: "USER", createdAt: { gte: startOfMonth } } }),
      db.platform.findMany(),
      db.ambassadorEarning.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
      db.user.findMany({
        where: { role: "USER" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, email: true, createdAt: true, planId: true },
      }),
    ]);

    // Revenue by plan
    const subsByPlan = await db.subscription.groupBy({
      by: ["planId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
      _sum: { amount: true },
    });
    const plans = await db.plan.findMany();
    const planMap = new Map(plans.map((p) => [p.id, p]));
    const revenueByPlan = subsByPlan.map((s) => ({
      plan: planMap.get(s.planId)?.name ?? "—",
      code: planMap.get(s.planId)?.code ?? "—",
      subscribers: s._count._all,
      revenue: s._sum.amount ?? 0,
    }));

    const monthRevenue = monthRevenueAgg._sum.amount ?? 0;
    const lastMonthRevenue = lastMonthRevenueAgg._sum.amount ?? 0;
    const revenueGrowth = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 100;

    const conversionRate = totalUsers > 0 ? (activeSubscribers / totalUsers) * 100 : 0;

    // scraper status summary
    const platformStatus = platforms.map((p) => ({
      code: p.code,
      name: p.name,
      status: p.status,
      latencyMs: p.latencyMs,
      successRate: p.successRate,
      lastSyncAt: p.lastSyncAt,
      pairsCount: p.pairsCount,
    }));

    // recent signups enriched with plan
    const planIds = [...new Set(recentSignups.map((s) => s.planId).filter(Boolean))] as string[];
    const recentPlans = planIds.length
      ? await db.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, name: true } })
      : [];
    const recentPlanMap = new Map(recentPlans.map((p) => [p.id, p]));
    const recent = recentSignups.map((s) => ({
      ...s,
      plan: s.planId ? recentPlanMap.get(s.planId)?.name ?? null : null,
    }));

    return ok({
      kpis: {
        totalUsers,
        activeSubscribers,
        conversionRate: Math.round(conversionRate * 10) / 10,
        totalRevenue: totalRevenueAgg._sum.amount ?? 0,
        monthRevenue,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        newUsersThisMonth,
        pendingPayouts: pendingPayoutsAgg._sum.amount ?? 0,
      },
      revenueByPlan,
      platformStatus,
      recentSignups: recent,
    });
  } catch (e) {
    return handleErr(e);
  }
}
