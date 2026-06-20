import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { ok, bad, unauthorized, handleErr } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!currentPassword || !newPassword) return bad("Ancien et nouveau mot de passe requis.");
    if (newPassword.length < 6) return bad("Le nouveau mot de passe doit faire au moins 6 caractères.");

    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return unauthorized();
    if (!verifyPassword(currentPassword, fullUser.passwordHash)) {
      return bad("Votre ancien mot de passe est incorrect.");
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    return ok({ message: "Votre mot de passe a été changé avec succès." });
  } catch (e) {
    return handleErr(e);
  }
}
