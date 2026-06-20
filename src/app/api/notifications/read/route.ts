import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, bad, handleErr } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "");
    if (!id) return bad("ID requis.");
    await db.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
    return ok({ ok: true });
  } catch (e) {
    return handleErr(e);
  }
}
