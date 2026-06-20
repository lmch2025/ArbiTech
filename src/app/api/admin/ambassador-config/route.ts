import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, bad, handleErr } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const config = await db.ambassadorConfig.findFirst({ where: { isActive: true } });
    return ok({ config });
  } catch (e) {
    return handleErr(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const commissionType = body.commissionType === "FIXED" ? "FIXED" : "PERCENT";
    const commissionValue = parseFloat(body.commissionValue);
    const minPayout = parseFloat(body.minPayout);
    if (isNaN(commissionValue) || commissionValue < 0) return bad("Commission invalide.");
    if (isNaN(minPayout) || minPayout < 0) return bad("Paiement minimum invalide.");

    const existing = await db.ambassadorConfig.findFirst({ where: { isActive: true } });
    const config = await db.ambassadorConfig.upsert({
      where: { id: existing?.id || "default" },
      update: { commissionType, commissionValue, minPayout, isActive: true },
      create: { id: "default", commissionType, commissionValue, minPayout, isActive: true },
    });
    return ok({ config, message: "Configuration ambassadeur mise à jour." });
  } catch (e) {
    return handleErr(e);
  }
}
