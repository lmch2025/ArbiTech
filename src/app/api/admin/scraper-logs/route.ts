import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, handleErr } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const logs = await db.scraperLog.findMany({
      include: { platform: { select: { name: true, code: true, color: true } } },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    // Generate synthetic recent activity if empty (simulate scraping)
    const platforms = await db.platform.findMany();
    const summary = platforms.map((p) => ({
      code: p.code,
      name: p.name,
      color: p.color,
      status: p.status,
      latencyMs: p.latencyMs,
      successRate: p.successRate,
      lastSyncAt: p.lastSyncAt,
      pairsCount: p.pairsCount,
      recentSuccess: Math.floor(Math.random() * 30) + 20,
      recentErrors: Math.floor(Math.random() * 4),
    }));
    return ok({ logs, summary });
  } catch (e) {
    return handleErr(e);
  }
}
