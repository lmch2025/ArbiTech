import { BASE_ASSETS, PLATFORMS_SEED } from "./constants";

export type GeneratedOpportunity = {
  id: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  buyPlatformCode: string;
  sellPlatformCode: string;
  buyPrice: number;
  sellPrice: number;
  profitPercent: number;
  profitAmount: number;
  volume: number;
  type: "SPOT" | "P2P";
  requiresPlan: "DECOUVERTE" | "PRO" | "INSTITUTIONNEL";
  confidence: number;
  expiresAt: string;
  createdAt: string;
};

// Deterministic-ish pseudo-random with seed for reproducibility
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const QUOTE_ASSETS = ["FCFA", "USDT"] as const;
const P2P_ASSETS = ["USDT", "USDC"];

/**
 * Génère une opportunité d'arbitrage réaliste.
 * Les prix fluctuent autour d'un prix de base FCFA, avec un spread
 * réaliste entre plateformes (0.1% à 4%).
 */
export function generateOpportunity(now: Date = new Date()): GeneratedOpportunity {
  const asset = pick(BASE_ASSETS);
  const isP2P = P2P_ASSETS.includes(asset.symbol) && Math.random() > 0.45;
  const quoteAsset = isP2P ? "FCFA" : pick(QUOTE_ASSETS);

  // prix de base
  const base =
    quoteAsset === "FCFA"
      ? asset.basePriceFcfa
      : asset.symbol === "USDT"
        ? 1
        : asset.basePriceFcfa / 615;

  // chaque plateforme a un petit écart de prix
  const platforms = [...PLATFORMS_SEED].sort(() => Math.random() - 0.5);
  const [buyP, sellP] = platforms;

  const buyJitter = rand(-asset.volatility, asset.volatility * 0.4);
  const sellJitter = rand(asset.volatility * 0.3, asset.volatility * 1.6);

  const buyPrice = base * (1 + buyJitter);
  const sellPrice = base * (1 + sellJitter);

  const profitPercent = ((sellPrice - buyPrice) / buyPrice) * 100;
  const profitAmount = sellPrice - buyPrice;

  // volume réaliste: plus l'asset est liquide, plus le volume est haut
  const volumeBase =
    asset.symbol === "USDT" || asset.symbol === "USDC"
      ? rand(2000, 45000)
      : asset.symbol === "BTC"
        ? rand(0.05, 2.4)
        : asset.symbol === "ETH"
          ? rand(1.2, 18)
          : rand(5, 320);

  // plan requis selon la rentabilité et le type
  let requiresPlan: GeneratedOpportunity["requiresPlan"] = "DECOUVERTE";
  if (isP2P || profitPercent > 1.8) requiresPlan = "PRO";
  if (profitPercent > 3.5 || (isP2P && profitPercent > 2.5)) requiresPlan = "INSTITUTIONNEL";

  const confidence = Math.min(0.98, 0.6 + profitPercent / 12 + rand(0, 0.1));

  const ttlMs = isP2P ? rand(45, 180) * 1000 : rand(90, 360) * 1000;

  return {
    id: `op_${now.getTime()}_${Math.floor(Math.random() * 1e6)}`,
    pair: `${asset.symbol}/${quoteAsset}`,
    baseAsset: asset.symbol,
    quoteAsset,
    buyPlatformCode: buyP.code,
    sellPlatformCode: sellP.code,
    buyPrice,
    sellPrice,
    profitPercent,
    profitAmount,
    volume: volumeBase,
    type: isP2P ? "P2P" : "SPOT",
    requiresPlan,
    confidence,
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    createdAt: now.toISOString(),
  };
}

export function generateBatch(count: number, now: Date = new Date()): GeneratedOpportunity[] {
  return Array.from({ length: count }, () => generateOpportunity(now));
}

// Garde un historique glissant en mémoire (utilisé par le mini-service ET par l'API de fallback)
const MAX_HISTORY = 60;
const history: GeneratedOpportunity[] = [];

export function pushOpportunity(op: GeneratedOpportunity) {
  history.unshift(op);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
}

export function getHistory() {
  return history;
}

export function pruneExpired(now: Date = new Date()) {
  const t = now.getTime();
  for (let i = history.length - 1; i >= 0; i--) {
    if (new Date(history[i].expiresAt).getTime() < t) history.splice(i, 1);
  }
}

// Initialise avec quelques opportunités pour ne pas avoir une liste vide
export function ensureSeeded() {
  if (history.length === 0) {
    const now = Date.now();
    for (let i = 0; i < 12; i++) {
      const op = generateOpportunity(new Date(now - i * 15000));
      pushOpportunity(op);
    }
  }
}
