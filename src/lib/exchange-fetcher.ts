/**
 * Exchange Fetcher — Récupère les VRAIS prix des APIs publiques de Binance, Bybit, OKX, KuCoin.
 *
 * Conforme au cahier des charges "Stratégie de Scraping Sécurisée (Gratuite & Anti-Ban)" :
 * - Rotation de User-Agents et Headers (imite un navigateur humain)
 * - Délais Aléatoires (Jitter) — gérés par l'appelant (mini-service)
 * - Mise en cache — l'appelant stocke en mémoire, 100 utilisateurs lisent le cache
 *
 * Aucune clé API requise : ces endpoints sont publics et officiels.
 */

// Pool de User-Agents réalistes (Chrome, Safari, Firefox, mobile)
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomHeaders() {
  const ua = randomUA();
  return {
    "User-Agent": ua,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Origin: "https://arbitech.app",
    Referer: "https://arbitech.app/",
  };
}

async function fetchJSON(url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...opts,
      headers: { ...randomHeaders(), ...(opts.headers as Record<string, string> || {}) },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ===== TYPES =====

export type SpotQuote = {
  exchange: "BINANCE" | "BYBIT" | "OKX" | "KUCOIN";
  symbol: string; // ex: "BTC/USDT"
  price: number; // dernier prix
  bid: number | null; // meilleur prix d'achat (ask) côté utilisateur = on peut acheter à ce prix
  ask: number | null; // meilleur prix de vente (bid) côté utilisateur = on peut vendre à ce prix
  timestamp: number;
};

export type P2PQuote = {
  platform: "BINANCE";
  asset: string; // ex: "USDT"
  fiat: string; // ex: "XAF"
  tradeType: "BUY" | "SELL"; // BUY = on achète l'asset contre du fiat ; SELL = on vend l'asset pour du fiat
  bestPrice: number; // meilleur prix (FCFA par unité)
  availableVolume: number; // volume dispo (unités de l'asset)
  advertiserCount: number;
  timestamp: number;
};

export type MarketSnapshot = {
  spot: Record<string, SpotQuote[]>; // "BTC/USDT" → quotes par exchange
  p2p: P2PQuote[];
  fetchedAt: number;
  sources: string[]; // ex: ["BINANCE", "BYBIT", "OKX", "KUCOIN"]
  errors: string[];
};

// ===== PAIRS SPOT À SURVEILLER =====

const SPOT_SYMBOLS = [
  { unified: "BTC/USDT", binance: "BTCUSDT", bybit: "BTCUSDT", okx: "BTC-USDT", kucoin: "BTC-USDT" },
  { unified: "ETH/USDT", binance: "ETHUSDT", bybit: "ETHUSDT", okx: "ETH-USDT", kucoin: "ETH-USDT" },
  { unified: "BNB/USDT", binance: "BNBUSDT", bybit: "BNBUSDT", okx: "BNB-USDT", kucoin: "BNB-USDT" },
  { unified: "SOL/USDT", binance: "SOLUSDT", bybit: "SOLUSDT", okx: "SOL-USDT", kucoin: "SOL-USDT" },
  { unified: "TRX/USDT", binance: "TRXUSDT", bybit: "TRXUSDT", okx: "TRX-USDT", kucoin: "TRX-USDT" },
  { unified: "USDC/USDT", binance: "USDCUSDT", bybit: "USDCUSDT", okx: "USDC-USDT", kucoin: "USDC-USDT" },
];

// ===== FETCHERS PAR EXCHANGE =====

async function fetchBinanceSpot(symbols: typeof SPOT_SYMBOLS): Promise<SpotQuote[]> {
  // Un seul appel batch avec /ticker/bookTicker (ask + bid pour tous les symboles)
  const all = symbols.map((s) => s.binance).join(",");
  const url = `https://api.binance.com/api/v3/ticker/bookTicker?symbols=[${encodeURIComponent(JSON.stringify(symbols.map((s) => s.binance))).slice(1, -1).replace(/"/g, "")}]`;
  // Plus simple : appels individuels parallèles
  const quotes = await Promise.all(
    symbols.map(async (s) => {
      const data = await fetchJSON(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${s.binance}`);
      if (!data || !data.bidPrice) return null;
      return {
        exchange: "BINANCE" as const,
        symbol: s.unified,
        price: parseFloat(data.bidPrice) && parseFloat(data.askPrice) ? (parseFloat(data.bidPrice) + parseFloat(data.askPrice)) / 2 : 0,
        bid: parseFloat(data.bidPrice), // prix auquel on peut vendre
        ask: parseFloat(data.askPrice), // prix auquel on peut acheter
        timestamp: Date.now(),
      };
    })
  );
  return quotes.filter((q): q is SpotQuote => q !== null);
}

async function fetchBybitSpot(symbols: typeof SPOT_SYMBOLS): Promise<SpotQuote[]> {
  // Bybit v5 : un seul appel pour tous les tickers spot, puis on filtre
  const data = await fetchJSON("https://api.bybit.com/v5/market/tickers?category=spot");
  if (!data?.result?.list) return [];
  const list = data.result.list as any[];
  const quotes: SpotQuote[] = [];
  for (const s of symbols) {
    const t = list.find((x) => x.symbol === s.bybit);
    if (t) {
      quotes.push({
        exchange: "BYBIT",
        symbol: s.unified,
        price: parseFloat(t.lastPrice),
        bid: parseFloat(t.bid1Price),
        ask: parseFloat(t.ask1Price),
        timestamp: Date.now(),
      });
    }
  }
  return quotes;
}

async function fetchOkxSpot(symbols: typeof SPOT_SYMBOLS): Promise<SpotQuote[]> {
  // OKX : un seul appel /market/tickers?instType=SPOT, puis filtre
  const data = await fetchJSON("https://www.okx.com/api/v5/market/tickers?instType=SPOT");
  if (!data?.data) return [];
  const list = data.data as any[];
  const quotes: SpotQuote[] = [];
  for (const s of symbols) {
    const t = list.find((x) => x.instId === s.okx);
    if (t) {
      quotes.push({
        exchange: "OKX",
        symbol: s.unified,
        price: parseFloat(t.last),
        bid: parseFloat(t.bidPx),
        ask: parseFloat(t.askPx),
        timestamp: Date.now(),
      });
    }
  }
  return quotes;
}

async function fetchKucoinSpot(symbols: typeof SPOT_SYMBOLS): Promise<SpotQuote[]> {
  // KuCoin : /market/allTickers (un seul appel)
  const data = await fetchJSON("https://api.kucoin.com/api/v1/market/allTickers");
  if (!data?.data?.ticker) return [];
  const list = data.data.ticker as any[];
  const quotes: SpotQuote[] = [];
  for (const s of symbols) {
    const t = list.find((x) => x.symbol === s.kucoin);
    if (t) {
      quotes.push({
        exchange: "KUCOIN",
        symbol: s.unified,
        price: parseFloat(t.last),
        bid: parseFloat(t.buy), // meilleur bid
        ask: parseFloat(t.sell), // meilleur ask
        timestamp: Date.now(),
      });
    }
  }
  return quotes;
}

// ===== P2P BINANCE FCFA =====

async function fetchBinanceP2P(asset: string, fiat: string, tradeType: "BUY" | "SELL"): Promise<P2PQuote | null> {
  const body = JSON.stringify({
    fiat,
    asset,
    tradeType,
    page: 1,
    rows: 10,
    payTypes: [],
  });
  const data = await fetchJSON(
    "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    },
    10000
  );
  if (!data?.data || data.data.length === 0) return null;
  // Le "best price" : pour BUY, on veut le prix le PLUS BAS (acheter moins cher) ;
  // pour SELL, on veut le prix le PLUS HAUT (vendre plus cher).
  const ads = data.data.map((a: any) => ({
    price: parseFloat(a.adv.price),
    surplusAmount: parseFloat(a.adv.surplusAmount),
  }));
  const best =
    tradeType === "BUY"
      ? ads.reduce((min: any, a: any) => (a.price < min.price ? a : min), ads[0])
      : ads.reduce((max: any, a: any) => (a.price > max.price ? a : max), ads[0]);

  return {
    platform: "BINANCE",
    asset,
    fiat,
    tradeType,
    bestPrice: best.price,
    availableVolume: best.surplusAmount,
    advertiserCount: data.data.length,
    timestamp: Date.now(),
  };
}

// ===== SNAPSHOT GLOBAL =====

let lastSnapshot: MarketSnapshot | null = null;
const snapshotListeners: Array<(s: MarketSnapshot) => void> = [];

export function getLatestSnapshot() {
  return lastSnapshot;
}

export function subscribeSnapshot(cb: (s: MarketSnapshot) => void) {
  snapshotListeners.push(cb);
  return () => {
    const i = snapshotListeners.indexOf(cb);
    if (i >= 0) snapshotListeners.splice(i, 1);
  };
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const errors: string[] = [];

  // Lance tous les fetchs en parallèle (mais chaque exchange = 1 seul appel batch)
  const [binanceSpot, bybitSpot, okxSpot, kucoinSpot, usdtBuy, usdtSell] = await Promise.all([
    fetchBinanceSpot(SPOT_SYMBOLS).catch((e) => { errors.push("Binance spot: " + String(e).slice(0, 80)); return []; }),
    fetchBybitSpot(SPOT_SYMBOLS).catch((e) => { errors.push("Bybit spot: " + String(e).slice(0, 80)); return []; }),
    fetchOkxSpot(SPOT_SYMBOLS).catch((e) => { errors.push("OKX spot: " + String(e).slice(0, 80)); return []; }),
    fetchKucoinSpot(SPOT_SYMBOLS).catch((e) => { errors.push("KuCoin spot: " + String(e).slice(0, 80)); return []; }),
    fetchBinanceP2P("USDT", "XAF", "BUY").catch((e) => { errors.push("Binance P2P BUY: " + String(e).slice(0, 80)); return null; }),
    fetchBinanceP2P("USDT", "XAF", "SELL").catch((e) => { errors.push("Binance P2P SELL: " + String(e).slice(0, 80)); return null; }),
  ]);

  // Regroupe les quotes spot par symbole unifié
  const spotMap: Record<string, SpotQuote[]> = {};
  for (const q of [...binanceSpot, ...bybitSpot, ...okxSpot, ...kucoinSpot]) {
    if (!spotMap[q.symbol]) spotMap[q.symbol] = [];
    spotMap[q.symbol].push(q);
  }

  const p2p: P2PQuote[] = [];
  if (usdtBuy) p2p.push(usdtBuy);
  if (usdtSell) p2p.push(usdtSell);

  const sources = ["BINANCE", "BYBIT", "OKX", "KUCOIN"].filter((s) =>
    [binanceSpot, bybitSpot, okxSpot, kucoinSpot].some((arr) => arr.length > 0 && arr[0]?.exchange === s)
  );

  const snapshot: MarketSnapshot = {
    spot: spotMap,
    p2p,
    fetchedAt: Date.now(),
    sources,
    errors,
  };

  lastSnapshot = snapshot;
  for (const cb of snapshotListeners) cb(snapshot);
  return snapshot;
}

// Test rapide (utilisable en CLI)
if (require.main === module) {
  fetchMarketSnapshot().then((s) => {
    console.log(JSON.stringify(s, null, 2));
  });
}
