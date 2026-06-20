import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized, handleErr } from "@/lib/http";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return bad("Le nom ne peut pas être vide.");
      data.name = name;
    }
    if (body.phone !== undefined) {
      data.phone = body.phone ? String(body.phone).trim() : null;
    }
    if (body.pushEnabled !== undefined) {
      // Stocké côté client (localStorage) ; ici on accepte juste pour compat
    }

    if (Object.keys(data).length === 0) return bad("Aucune donnée à mettre à jour.");

    const updated = await db.user.update({
      where: { id: user.id },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true, status: true, referralCode: true },
    });

    return ok({
      user: updated,
      message: "Votre profil a été mis à jour.",
    });
  } catch (e) {
    return handleErr(e);
  }
}
