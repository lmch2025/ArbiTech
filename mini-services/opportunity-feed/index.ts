import { createServer } from "http";
import { Server } from "socket.io";
import { pathToFileURL } from "url";
import { dirname, resolve } from "path";

const PORT = 3003;
const __dirname = dirname(new URL(import.meta.url).pathname);

// Import shared engine from the main app
const enginePath = resolve(__dirname, "../../src/lib/opportunity-engine.ts");
const constantsPath = resolve(__dirname, "../../src/lib/constants.ts");

const { generateOpportunity, pushOpportunity, getHistory, pruneExpired, ensureSeeded } =
  await import(pathToFileURL(enginePath).href);

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "opportunity-feed", port: PORT, connections: io.engine.clientsCount }));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("ArbiTech Opportunity Feed — WebSocket service. Connect via socket.io.");
});

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  allowEIO3: true,
});

// Seed initial history so newly connected clients see data immediately
ensureSeeded();

const ACTIVE_CLIENTS = new Set();

io.on("connection", (socket) => {
  ACTIVE_CLIENTS.add(socket.id);
  console.log(`[+] client connected (${socket.id}) — total ${ACTIVE_CLIENTS.size}`);

  // Send current snapshot immediately
  socket.emit("snapshot", { opportunities: getHistory().slice(0, 30), serverTime: Date.now() });

  // Client can subscribe with a plan filter
  socket.on("subscribe", (payload) => {
    const plan = (payload?.plan || "DECOUVERTE").toUpperCase();
    socket.data.plan = plan;
    socket.emit("subscribed", { plan });
  });

  socket.on("ping", () => socket.emit("pong", { t: Date.now() }));

  socket.on("disconnect", () => {
    ACTIVE_CLIENTS.delete(socket.id);
    console.log(`[-] client disconnected (${socket.id}) — total ${ACTIVE_CLIENTS.size}`);
  });
});

// Tick: generate new opportunities on a jittered interval (anti-pattern, simule scraping furtif)
function scheduleNext() {
  const jitter = 2500 + Math.random() * 4000; // 2.5s — 6.5s
  setTimeout(() => {
    pruneExpired();
    // generate 1-3 opportunities per tick
    const count = Math.random() > 0.6 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const op = generateOpportunity(new Date());
      pushOpportunity(op);
      io.emit("opportunity", op);
    }
    // periodically broadcast a refreshed snapshot so clients resync
    if (Math.random() > 0.7) {
      io.emit("snapshot", { opportunities: getHistory().slice(0, 30), serverTime: Date.now() });
    }
    scheduleNext();
  }, jitter);
}

httpServer.listen(PORT, () => {
  console.log(`🌙 ArbiTech opportunity feed running on port ${PORT}`);
  console.log(`   health: http://localhost:${PORT}/health`);
  scheduleNext();
});

process.on("SIGINT", () => {
  console.log("shutting down…");
  io.close();
  httpServer.close();
  process.exit(0);
});
