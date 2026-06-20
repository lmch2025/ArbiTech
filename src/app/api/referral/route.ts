import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, bad, handleErr } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.referralCode || "").trim().toUpperCase();
    if (!code) return bad("Code de parrainage requis.");

    const referrer = await db.user.findUnique({
      where: { referralCode: code },
      select: { id: true, name: true, referralCode: true, planId: true },
    });
    if (!referrer) return bad("Ce code de parrainage n'existe pas.");

    return ok({
      valid: true,
      referrer: { name: referrer.name, referralCode: referrer.referralCode },
    });
  } catch (e) {
    return handleErr(e);
  }
}
