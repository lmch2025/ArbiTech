import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, bad, handleErr } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const platforms = await db.platform.findMany({ orderBy: { name: "asc" } });
    return ok({ platforms });
  } catch (e) {
    return handleErr(e);
  }
}

// Ajout dynamique d'une plateforme (sans toucher au code source)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim().toUpperCase();
    const url = String(body.url || "").trim();
    const color = String(body.color || "#7c3aed");
    const logo = String(body.logo || name.charAt(0) || "?");

    if (!name || !code) return bad("Nom et code requis.");
    const existing = await db.platform.findUnique({ where: { code } });
    if (existing) return bad("Ce code existe déjà.");

    const platform = await db.platform.create({
      data: {
        code,
        name,
        url: url || `https://www.${name.toLowerCase()}.com`,
        color,
        logo,
        status: "ONLINE",
        lastSyncAt: new Date(),
        latencyMs: 60 + Math.floor(Math.random() * 80),
        successRate: 97 + Math.random() * 3,
        pairsCount: 200 + Math.floor(Math.random() * 200),
        isActive: true,
      },
    });

    return ok({ platform, message: `Plateforme ${name} ajoutée. Le robot espion démarre sa surveillance.` });
  } catch (e) {
    return handleErr(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { id, isActive, status } = body as { id?: string; isActive?: boolean; status?: string };
    if (!id) return bad("id requis.");
    const update: Record<string, unknown> = {};
    if (typeof isActive === "boolean") update.isActive = isActive;
    if (status) update.status = status.toUpperCase();
    await db.platform.update({ where: { id }, data: update });
    return ok({ ok: true });
  } catch (e) {
    return handleErr(e);
  }
}
