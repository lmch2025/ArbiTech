import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, handleErr } from "@/lib/http";

// In a real app, store the push subscription (VAPID) in DB. Here we just ack.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await req.json().catch(() => ({}));
    // body.endpoint / body.keys — accepted but not persisted for the demo
    return ok({ ok: true, registered: !!body.endpoint });
  } catch (e) {
    return handleErr(e);
  }
}
