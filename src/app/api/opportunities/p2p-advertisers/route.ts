import { NextRequest } from "next/server";
import { ok, bad, handleErr } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type RawAdvertiser = {
  advertiserName?: string;
  price?: string | number;
  surplusAmount?: string | number;
  tradeMethods?: Array<{ identifier?: string; tradeMethodName?: string }>;
  completionRate?: number;
  orders?: number;
  rating?: number;
};

type Advertiser = {
  advertiserName: string;
  price: number;
  surplusAmount: number;
  tradeMethods: string[];
  completionRate: number;
  orders: number;
  rating: number;
};

function pickTradeMethods(raw: RawAdvertiser): string[] {
  if (!Array.isArray(raw.tradeMethods)) return [];
  const out: string[] = [];
  for (const m of raw.tradeMethods) {
    const name = m?.tradeMethodName || m?.identifier;
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

function toNumber(v: string | number | undefined, fallback = 0): number {
  if (v === undefined || v === null) return fallback;
  const n = typeof v === "number" ? v : parseFloat(v);
  return isNaN(n) ? fallback : n;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const asset = (url.searchParams.get("asset") || "USDT").toUpperCase();
    const fiat = (url.searchParams.get("fiat") || "XAF").toUpperCase();
    const tradeType = (url.searchParams.get("type") || "BUY").toUpperCase();

    if (tradeType !== "BUY" && tradeType !== "SELL") {
      return bad("Le paramètre 'type' doit être 'BUY' ou 'SELL'.");
    }

    // Binance P2P endpoint public — aucun secret requis.
    const endpoint = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";
    const body = JSON.stringify({
      fiat,
      asset,
      tradeType,
      page: 1,
      rows: 10,
      payTypes: [],
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
        },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      return bad(
        `Binance P2P a répondu avec le statut ${res.status}.`,
        `endpoint=${endpoint} asset=${asset} fiat=${fiat} type=${tradeType}`
      );
    }

    const json = (await res.json()) as { data?: any[] };
    const rows: any[] = Array.isArray(json?.data) ? json.data : [];

    const advertisers: Advertiser[] = rows
      .map((row): Advertiser => {
        const adv = row?.adv || {};
        const advertiser = row?.advertiser || {};
        const raw: RawAdvertiser = {
          advertiserName: advertiser?.nickName || advertiser?.realName || "—",
          price: adv?.price,
          surplusAmount: adv?.surplusAmount,
          tradeMethods: Array.isArray(row?.tradeMethods)
            ? row.tradeMethods
            : Array.isArray(adv?.tradeMethods)
              ? adv.tradeMethods
              : [],
          completionRate: advertiser?.completedRate ?? advertiser?.completionRate,
          orders: advertiser?.allOrderCount ?? advertiser?.orders ?? 0,
          rating: advertiser?.rating ?? 0,
        };
        return {
          advertiserName: String(raw.advertiserName || "—"),
          price: toNumber(raw.price),
          surplusAmount: toNumber(raw.surplusAmount),
          tradeMethods: pickTradeMethods(raw),
          completionRate: clamp01(toNumber(raw.completionRate, 0) / 100),
          orders: Math.round(toNumber(raw.orders, 0)),
          rating: toNumber(raw.rating, 0),
        };
      })
      .slice(0, 5);

    return ok({
      advertisers,
      count: advertisers.length,
      filters: { asset, fiat, type: tradeType },
      source: "Binance P2P",
    });
  } catch (e) {
    return handleErr(e);
  }
}

function clamp01(v: number): number {
  if (isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
