import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { ok, bad, handleErr } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) return bad("Email et mot de passe requis.");

    const user = await db.user.findUnique({ where: { email }, include: { plan: true } });
    if (!user) return bad("Email ou mot de passe incorrect.");
    if (!verifyPassword(password, user.passwordHash)) {
      return bad("Email ou mot de passe incorrect.");
    }
    if (user.status === "BANNED") {
      return bad("Votre compte a été suspendu. Contactez le support.");
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        plan: user.plan ? { code: user.plan.code, name: user.plan.name } : null,
      },
      message: `Bon retour, ${user.name || "ami"} !`,
    });
  } catch (e) {
    return handleErr(e);
  }
}
