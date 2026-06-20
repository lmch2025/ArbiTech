import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, handleErr } from "@/lib/http";
import { PLAN_LABELS } from "@/lib/constants";

export async function GET() {
  try {
    const [plans, platforms] = await Promise.all([
      db.plan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.platform.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const user = await getCurrentUser();

    return ok({
      plans: plans.map((p) => ({
        ...p,
        features: JSON.parse(p.features),
      })),
      platforms: platforms.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        logo: p.logo,
        color: p.color,
        url: p.url,
        status: p.status,
        pairsCount: p.pairsCount,
      })),
      currentPlan: user?.plan
        ? { code: user.plan.code, name: user.plan.name }
        : null,
      planLabels: PLAN_LABELS,
    });
  } catch (e) {
    return handleErr(e);
  }
}
