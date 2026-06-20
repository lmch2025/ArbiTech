import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, bad, handleErr } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const plans = await db.plan.findMany({ orderBy: { sortOrder: "asc" } });
    return ok({ plans: plans.map((p) => ({ ...p, features: JSON.parse(p.features) })) });
  } catch (e) {
    return handleErr(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { id } = body as { id?: string };
    if (!id) return bad("id requis.");
    const data: Record<string, unknown> = {};
    const fields = ["priceMonthly", "priceYearly", "delaySeconds"];
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = parseFloat(body[f]);
    }
    const boolFields = ["isRealTime", "hasP2PFiat", "hasPush", "hasVolume", "hasVipSupport", "hasAllPairs", "isPopular", "isActive"];
    for (const f of boolFields) {
      if (body[f] !== undefined) data[f] = !!body[f];
    }
    if (body.name !== undefined) data.name = String(body.name);
    if (body.tagline !== undefined) data.tagline = String(body.tagline);
    if (body.description !== undefined) data.description = String(body.description);
    if (body.features !== undefined) {
      data.features = JSON.stringify(Array.isArray(body.features) ? body.features : []);
    }

    const plan = await db.plan.update({ where: { id }, data });
    return ok({ plan: { ...plan, features: JSON.parse(plan.features) }, message: "Forfait mis à jour sans toucher au code." });
  } catch (e) {
    return handleErr(e);
  }
}
