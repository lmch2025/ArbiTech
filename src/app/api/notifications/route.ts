import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, handleErr } from "@/lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const unread = await db.notification.count({ where: { userId: user.id, read: false } });
    return ok({ notifications, unread });
  } catch (e) {
    return handleErr(e);
  }
}
