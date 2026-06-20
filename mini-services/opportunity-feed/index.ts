import { createServer } from "http";
import { Server } from "socket.io";
import { pathToFileURL } from "url";
import { dirname, resolve } from "path";

const PORT = 3003;
const __dirname = dirname(new URL(import.meta.url).pathname);

// Import shared modules from the main app
const fetcherPath = resolve(__dirname, "../../src/lib/exchange-fetcher.ts");
const calcPath = resolve(__dirname, "../../src/lib/arbitrage-calculator.ts");

const exchangeFetcher = await import(pathToFileURL(fetcherPath).href);
const arbitrageCalc = await import(pathToFileURL(calcPath).href);

const { fetchMarketSnapshot, getLatestSnapshot } = exchangeFetcher;
const { computeRealOpportunities, getScraperHealth } = arbitrageCalc;

// Import simulation fallback (for when network is down)
const enginePath = resolve(__dirname, "../../src/lib/opportunity-engine.ts");
const { generateOpportunity } = await import(pathToFileURL(enginePath).href);

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    const snapshot = getLatestSnapshot();
    const health = getScraperHealth(snapshot);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      service: "opportunity-feed",
      port: PORT,
      connections: io.engine.clientsCount,
      scraper: health,
      mode: snapshot ? "REAL_DATA" : "WARMING_UP",
    }));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("ArbiTech Opportunity Feed — WebSocket service. Connect via socket.io.");
});

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  allowEIO3: true,
});

// ===== ÉTAT EN MÉMOIRE (cache — 100 users lisent le cache, pas 100 req vers Binance) =====
let currentOpportunities: any[] = [];
let lastFetchOk = false;
let consecutiveErrors = 0;
const MAX_HISTORY = 60;

// ===== FONCTION DE SCRAPING FURTIF =====
async function scrapeAndBroadcast() {
  const jitter = 12000 + Math.random() * 16000; // 12s — 28s (cahier des charges)
  try {
    console.log(`[scraper] fetching real market data… (jitter next: ${Math.round(jitter / 1000)}s)`);
    const snapshot = await fetchMarketSnapshot();
    const realOps = computeRealOpportunities(snapshot);

    if (realOps.length > 0) {
      // Fusionne avec l'historique (garde les anciennes tant qu'elles ne sont pas expirées)
      const now = Date.now();
      currentOpportunities = [...realOps, ...currentOpportunities]
        .filter((op) => new Date(op.expiresAt).getTime() > now)
        .slice(0, MAX_HISTORY);

      lastFetchOk = true;
      consecutiveErrors = 0;

      // Broadcast les nouvelles opportunités réelles
      for (const op of realOps) {
        io.emit("opportunity", { ...op, realData: true });
      }
      // Snapshot rafraîchi
      io.emit("snapshot", { opportunities: currentOpportunities.slice(0, 30), serverTime: Date.now(), realData: true });
      console.log(`[scraper] ✓ ${realOps.length} real opportunities broadcast (sources: ${snapshot.sources.join(",")})`);
    } else {
      console.log("[scraper] no real opportunities this cycle (spreads too small or negative)");
    }
  } catch (e) {
    consecutiveErrors++;
    lastFetchOk = false;
    console.error(`[scraper] ✗ error (${consecutiveErrors}):`, String(e).slice(0, 100));
    // Fallback : génère une opportunité simulée pour ne pas laisser le flux vide
    if (consecutiveErrors > 2) {
      const sim = generateOpportunity(new Date());
      currentOpportunities = [sim, ...currentOpportunities].slice(0, MAX_HISTORY);
      io.emit("opportunity", { ...sim, realData: false, simulated: true });
      console.log("[scraper] fallback: 1 simulated opportunity emitted");
    }
  }

  // Prochain cycle avec jitter
  setTimeout(scrapeAndBroadcast, jitter);
}

// ===== CONNEXIONS CLIENTS =====
io.on("connection", (socket) => {
  console.log(`[+] client connected (${socket.id}) — total ${io.engine.clientsCount}`);
  // Envoie le snapshot courant immédiatement
  socket.emit("snapshot", {
    opportunities: currentOpportunities.slice(0, 30),
    serverTime: Date.now(),
    realData: lastFetchOk,
  });

  socket.on("subscribe", (payload) => {
    socket.data.plan = payload?.plan || "DECOUVERTE";
    socket.emit("subscribed", { plan: socket.data.plan, realData: lastFetchOk });
  });

  socket.on("ping", () => socket.emit("pong", { t: Date.now(), realData: lastFetchOk }));

  socket.on("disconnect", () => {
    console.log(`[-] client disconnected (${socket.id}) — total ${io.engine.clientsCount}`);
  });
});

// ===== DÉMARRAGE =====
httpServer.listen(PORT, () => {
  console.log(`🌙 ArbiTech opportunity feed running on port ${PORT}`);
  console.log(`   Mode: REAL DATA SCRAPER (Binance, Bybit, OKX, KuCoin + Binance P2P FCFA)`);
  console.log(`   Furtif: jitter 12-28s, rotation User-Agents, mise en cache`);
  console.log(`   health: http://localhost:${PORT}/health`);
  // Premier cycle immédiat, puis jitter
  scrapeAndBroadcast();
});

process.on("SIGINT", () => {
  console.log("shutting down…");
  io.close();
  httpServer.close();
  process.exit(0);
});
