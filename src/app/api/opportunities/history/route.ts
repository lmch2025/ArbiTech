import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, handleErr } from "@/lib/http";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 6;
const MAX_PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const url = new URL(req.url);
    const pageParam = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSizeParam = parseInt(
      url.searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE),
      10
    );

    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, isNaN(pageSizeParam) ? DEFAULT_PAGE_SIZE : pageSizeParam)
    );

    // L'utilisateur courant ne voit que son historique de vues.
    const where = { userId: user.id };

    // Le modèle OpportunityView est utilisé pour tracer les opportunités
    // consultées par l'utilisateur. On compte sur `db.opportunityView` qui
    // expose un findMany/count standard Prisma.
    // (Le modèle est ajouté au schéma Prisma à part.)
    const opportunityView = (db as any).opportunityView;

    const [total, items] = await Promise.all([
      opportunityView.count({ where }),
      opportunityView.findMany({
        where,
        orderBy: { viewedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return ok({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (e) {
    return handleErr(e);
  }
}
