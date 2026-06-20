import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, bad, handleErr } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status");

    const users = await db.user.findMany({
      where: {
        role: "USER",
        ...(q
          ? {
              OR: [
                { email: { contains: q } },
                { name: { contains: q } },
                { referralCode: { contains: q.toUpperCase() } },
              ],
            }
          : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
      },
      include: { plan: true, subscription: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        role: u.role,
        referralCode: u.referralCode,
        createdAt: u.createdAt,
        plan: u.plan ? { code: u.plan.code, name: u.plan.name } : null,
        subscription: u.subscription
          ? { status: u.subscription.status, endDate: u.subscription.endDate, amount: u.subscription.amount }
          : null,
      })),
    });
  } catch (e) {
    return handleErr(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { id, action } = body as { id?: string; action?: string };
    if (!id || !action) return bad("id et action requis.");

    let update: Record<string, unknown> = {};
    if (action === "ban") update = { status: "BANNED" };
    else if (action === "unban") update = { status: "ACTIVE" };
    else if (action === "activate") update = { status: "ACTIVE" };
    else return bad("Action inconnue (ban, unban, activate).");

    await db.user.update({ where: { id }, data: update });
    return ok({ ok: true, message: "Utilisateur mis à jour." });
  } catch (e) {
    return handleErr(e);
  }
}
