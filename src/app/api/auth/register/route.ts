import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, generateReferralCode, createSession, setSessionCookie } from "@/lib/auth";
import { ok, bad, handleErr } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const phone = body.phone ? String(body.phone) : undefined;
    const referralCode = body.referralCode ? String(body.referralCode).trim().toUpperCase() : undefined;

    if (!email || !password) return bad("Email et mot de passe requis.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Email invalide.");
    if (password.length < 6) return bad("Le mot de passe doit faire au moins 6 caractères.");
    if (!name) return bad("Veuillez entrer votre nom.");

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return bad("Un compte existe déjà avec cet email. Connectez-vous.");

    // Resolve referrer (works even if referrer has no plan — open to all)
    let referrerId: string | undefined;
    if (referralCode) {
      const referrer = await db.user.findUnique({ where: { referralCode } });
      if (referrer) referrerId = referrer.id;
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        phone,
        passwordHash: hashPassword(password),
        referralCode: generateReferralCode(name),
        referredById: referrerId,
      },
    });

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return ok({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, referralCode: user.referralCode },
      message: "Bienvenue sur ArbiTech ! Votre compte est prêt.",
    });
  } catch (e) {
    return handleErr(e);
  }
}
