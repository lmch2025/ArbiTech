import { db } from "@/lib/db";
import { ok, handleErr } from "@/lib/http";

export async function GET() {
  try {
    const texts = await db.shareText.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return ok({
      texts: texts.map((t) => ({ id: t.id, text: t.text, category: t.category, channel: t.channel })),
    });
  } catch (e) {
    return handleErr(e);
  }
}
