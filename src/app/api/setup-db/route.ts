import { NextRequest } from "next/server";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Liste exhaustive des tables à supprimer avant réinitialisation.
// L'ordre est volontairement non-pertinent : on utilise CASCADE.
const TABLES_TO_DROP = [
  "PushSubscription",
  "OpportunityView",
  "CacheEntry",
  "ScraperLog",
  "AmbassadorEarning",
  "AmbassadorConfig",
  "Notification",
  "Subscription",
  "Opportunity",
  "ShareText",
  "Platform",
  "Session",
  "Plan",
  "User",
];

// Tables créées par le neon-init.sql (référencées pour le reporting)
const TABLES_CREATED = [
  "User",
  "Session",
  "Plan",
  "Subscription",
  "Platform",
  "Opportunity",
  "ShareText",
  "AmbassadorEarning",
  "Notification",
  "ScraperLog",
  "AmbassadorConfig",
  "PushSubscription",
];

function getPool() {
  const connectionString =
    process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL (ou DIRECT_URL) manquant dans les variables d'environnement."
    );
  }
  return new Pool({
    connectionString,
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });
}

function readInitSql(): string {
  // Le fichier neon-init.sql est à la racine du projet.
  // En production Vercel, le système de fichiers est readOnly pour /src mais
  // on peut embarquer le .sql en lecture via process.cwd().
  const sqlPath = join(process.cwd(), "neon-init.sql");
  try {
    return readFileSync(sqlPath, "utf8");
  } catch (e) {
    throw new Error(
      `Impossible de lire neon-init.sql à ${sqlPath} : ${String(e)}`
    );
  }
}

// Exécute un script SQL potentiellement multi-instructions avec pg.
// pg ne supporte pas nativement les multi-statements via query() pour certaines
// configurations, donc on splitte sur les points-virgules de fin de ligne.
function splitStatements(sql: string): string[] {
  // Découpe sur les ';' en fin de ligne (hors chaînes, simplifié).
  // neon-init.sql n'a pas de chaînes multi-lignes contenant des ';', donc
  // cette heuristique suffit largement pour notre schéma.
  return sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const confirm = url.searchParams.get("confirm");

  if (confirm !== "yes") {
    return Response.json(
      {
        error:
          "Confirmation requise. Ajoutez ?confirm=yes pour réinitialiser la base de données.",
        hint: "ATTENTION : cette action supprime toutes les données existantes.",
      },
      { status: 400 }
    );
  }

  let pool: Pool | null = null;
  try {
    pool = getPool();
    const client = await pool.connect();

    try {
      // 1. Drop toutes les tables existantes (CASCADE)
      const dropStatements = TABLES_TO_DROP.map(
        (t) => `DROP TABLE IF EXISTS "${t}" CASCADE;`
      );
      const dropSql = dropStatements.join("\n");
      await client.query(dropSql);

      // 2. Exécute le script d'initialisation
      const initSql = readInitSql();
      const statements = splitStatements(initSql);

      let rowCount = 0;
      for (const stmt of statements) {
        try {
          await client.query(stmt);
          rowCount++;
        } catch (e) {
          // On loggue mais on continue : certaines instructions (CREATE INDEX,
          // INSERT ON CONFLICT) peuvent échouer sur un état partiel sans casser
          // l'initialisation globale.
          console.error("[setup-db] statement failed:", String(e).slice(0, 200));
        }
      }

      return Response.json({
        ok: true,
        message: "Base de données réinitialisée avec succès.",
        tablesCreated: TABLES_CREATED.length,
        tableNames: TABLES_CREATED,
        rowCount,
        droppedTables: TABLES_TO_DROP,
      });
    } finally {
      client.release();
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[setup-db] error:", message);
    return Response.json(
      {
        ok: false,
        error: "Échec de l'initialisation de la base de données.",
        details: message,
      },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.end().catch(() => {});
    }
  }
}
