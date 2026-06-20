import { db } from "@/lib/db";
import { ok, handleErr } from "@/lib/http";

export async function GET() {
  try {
    const platforms = await db.platform.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        logo: true,
        color: true,
        url: true,
        status: true,
        pairsCount: true,
        lastSyncAt: true,
        latencyMs: true,
        successRate: true,
        isActive: true,
      },
    });
    return ok({ platforms });
  } catch (e) {
    return handleErr(e);
  }
}
