import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { PLAN_LABELS } from "@/lib/constants";

// SSR: pré-charge les données pour le référencement (Google voit le HTML complet)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const [plans, platforms, user] = await Promise.all([
    db.plan
      .findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
      .then((ps) => ps.map((p) => ({ ...p, features: JSON.parse(p.features) })))
      .catch(() => []),
    db.platform
      .findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
      .catch(() => []),
    getCurrentUser().catch(() => null),
  ]);

  const initialCatalog = {
    plans,
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
    planLabels: PLAN_LABELS,
  };

  const initialUser = user
    ? {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role as "USER" | "ADMIN",
        status: user.status,
        referralCode: user.referralCode,
        plan: user.plan
          ? {
              id: user.plan.id,
              code: user.plan.code as "DECOUVERTE" | "PRO" | "INSTITUTIONNEL",
              name: user.plan.name,
              isRealTime: user.plan.isRealTime,
              delaySeconds: user.plan.delaySeconds,
              hasP2PFiat: user.plan.hasP2PFiat,
              hasPush: user.plan.hasPush,
              hasVolume: user.plan.hasVolume,
              hasVipSupport: user.plan.hasVipSupport,
              hasAllPairs: user.plan.hasAllPairs,
            }
          : null,
      }
    : null;

  return <AppShell initialCatalog={initialCatalog} initialUser={initialUser} />;
}
