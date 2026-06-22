import { NextRequest } from "next/server";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TABLES_TO_DROP = [
  "PushSubscription", "OpportunityView", "CacheEntry", "ScraperLog",
  "AmbassadorEarning", "AmbassadorConfig", "Notification", "Subscription",
  "Opportunity", "ShareText", "Platform", "Session", "Plan", "User",
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const confirm = url.searchParams.get("confirm");

  if (confirm !== "yes") {
    return Response.json({
      error: "Ajoutez ?confirm=yes pour confirmer.",
      url: `${url.origin}/api/setup-db?confirm=yes`,
    }, { status: 400 });
  }

  let pool: Pool | null = null;
  try {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      return Response.json({ ok: false, error: "DATABASE_URL non configurée" }, { status: 500 });
    }

    // SSL TOUJOURS activé pour Neon (requis)
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    const client = await pool.connect();
    try {
      // 1. Drop toutes les tables existantes (CASCADE)
      const dropSql = TABLES_TO_DROP.map((t) => `DROP TABLE IF EXISTS "${t}" CASCADE;`).join("\n");
      await client.query(dropSql);

      // 2. Lit et exécute le SQL complet (multi-statements natif avec pg)
      const sqlPath = join(process.cwd(), "neon-init.sql");
      let sql: string;
      try {
        sql = readFileSync(sqlPath, "utf8");
      } catch {
        return Response.json({ ok: false, error: "neon-init.sql introuvable" }, { status: 500 });
      }

      // pg supporte nativement les multi-statements avec query()
      await client.query(sql);

      // 3. Vérifie les tables réellement créées
      const tablesRes = await client.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
      );
      const tableNames = tablesRes.rows.map((r: any) => r.tablename);

      // 4. Compte les lignes dans les tables principales
      const rowCount: Record<string, number> = {};
      for (const t of ["User", "Plan", "Platform", "ShareText", "AmbassadorConfig"]) {
        try {
          const r = await client.query(`SELECT COUNT(*)::int as c FROM "${t}";`);
          rowCount[t] = r.rows[0]?.c ?? 0;
        } catch { rowCount[t] = -1; }
      }

      return Response.json({
        ok: true,
        message: "Base initialisée avec succès ! Vous pouvez maintenant vous connecter.",
        tablesCreated: tableNames.length,
        tableNames,
        rowCount,
        nextStep: "Rechargez la page et connectez-vous avec demo@arbitech.app / Demo2025!",
      });
    } finally {
      client.release();
    }
  } catch (e: any) {
    return Response.json({
      ok: false,
      error: String(e?.message || e).slice(0, 400),
    }, { status: 500 });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
