"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ExternalLink,
  ShoppingCart,
  Send,
  Star,
  Loader2,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2,
  Circle,
  Flame,
} from "lucide-react";
import {
  formatFcfa,
  formatPercent,
  formatPrice,
  formatNumber,
} from "@/lib/format";
import type { Opportunity } from "@/lib/types";

type OpportunityDetailModalProps = {
  op: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
  onToggleFavorite?: (fingerprint?: string) => void;
};

// Frais réseau par actif (par unité transférée)
const NETWORK_FEES: Record<string, number> = {
  USDT: 1,
  USDC: 1,
  BTC: 0.0001,
  ETH: 0.002,
  BNB: 0.001,
  SOL: 0.01,
  TRX: 1,
};

const PLATFORM_URLS: Record<string, string> = {
  BINANCE: "https://www.binance.com",
  BYBIT: "https://www.bybit.com",
  OKX: "https://www.okx.com",
  KUCOIN: "https://www.kucoin.com",
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

const QUICK_AMOUNTS = [50000, 100000, 500000, 1000000];

const DEFAULT_CHECKLIST = [
  "J'ai vérifié les prix en direct sur les plateformes",
  "J'ai confirmé les moyens de paiement disponibles (MoMo, Orange Money, etc.)",
  "J'ai calculé les frais de réseau pour le transfert",
  "J'ai préparé mon portefeuille de réception",
  "J'ai vérifié la réputation de l'annonceur P2P",
  "Je suis prêt à exécuter l'arbitrage maintenant",
];

export function OpportunityDetailModal({
  op,
  open,
  onOpenChange,
  onUpgrade,
  onToggleFavorite,
}: OpportunityDetailModalProps) {
  const [capital, setCapital] = useState<number>(100000);
  const [checklist, setChecklist] = useState<boolean[]>(
    DEFAULT_CHECKLIST.map(() => false)
  );
  const [buyAds, setBuyAds] = useState<Advertiser[]>([]);
  const [sellAds, setSellAds] = useState<Advertiser[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);

  const isP2P = op?.type === "P2P";
  const fee = op ? NETWORK_FEES[op.baseAsset] ?? 0 : 0;

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setChecklist(DEFAULT_CHECKLIST.map(() => false));
      setBuyAds([]);
      setSellAds([]);
      setAdsError(null);
    }
  }, [open]);

  // Fetch P2P advertisers when modal opens
  useEffect(() => {
    if (!open || !op || !isP2P) return;
    let cancelled = false;
    async function loadAds() {
      if (!op) return;
      setAdsLoading(true);
      setAdsError(null);
      try {
        const base = op.baseAsset;
        const fiat = op.quoteAsset;
        const [buyRes, sellRes] = await Promise.all([
          fetch(
            `/api/opportunities/p2p-advertisers?asset=${encodeURIComponent(
              base
            )}&fiat=${encodeURIComponent(fiat)}&type=BUY`
          ),
          fetch(
            `/api/opportunities/p2p-advertisers?asset=${encodeURIComponent(
              base
            )}&fiat=${encodeURIComponent(fiat)}&type=SELL`
          ),
        ]);
        const buyJson = buyRes.ok ? await buyRes.json() : { advertisers: [] };
        const sellJson = sellRes.ok ? await sellRes.json() : { advertisers: [] };
        if (cancelled) return;
        setBuyAds(Array.isArray(buyJson.advertisers) ? buyJson.advertisers : []);
        setSellAds(Array.isArray(sellJson.advertisers) ? sellJson.advertisers : []);
      } catch {
        if (!cancelled) {
          setAdsError("Impossible de charger les annonceurs P2P réels.");
        }
      } finally {
        if (!cancelled) setAdsLoading(false);
      }
    }
    loadAds();
    return () => {
      cancelled = true;
    };
  }, [open, op, isP2P]);

  const calc = useMemo(() => {
    if (!op) return null;
    const qty = op.buyPrice > 0 ? capital / op.buyPrice : 0;
    const networkFeeTotal = fee * qty;
    const qtyAfterFee = Math.max(0, qty - networkFeeTotal);
    const grossSale = qtyAfterFee * op.sellPrice;
    const netProfit = grossSale - capital;
    const roi = capital > 0 ? (netProfit / capital) * 100 : 0;
    const grossProfit = qty * (op.sellPrice - op.buyPrice);
    return { qty, networkFeeTotal, qtyAfterFee, grossSale, netProfit, roi, grossProfit };
  }, [op, capital, fee]);

  if (!op) return null;

  const buyUrl = PLATFORM_URLS[op.buyPlatformCode] ?? "#";
  const sellUrl = PLATFORM_URLS[op.sellPlatformCode] ?? "#";

  const isHot = op.profitPercent >= 3;
  const completedCount = checklist.filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scroll-elegant">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap pr-8">
            <span>{op.pair}</span>
            {op.type === "P2P" ? (
              <Badge className="bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                P2P
              </Badge>
            ) : (
              <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30">
                Spot
              </Badge>
            )}
            {isHot && (
              <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Flame className="w-3 h-3" /> Chaud
              </Badge>
            )}
            {op.realData === true && (
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot mr-1" />
                Live
              </Badge>
            )}
            <button
              type="button"
              aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              onClick={() => {
                setFavorite((v) => !v);
                onToggleFavorite?.();
              }}
              className="ml-auto grid place-items-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  favorite
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          </DialogTitle>
          <DialogDescription>
            Stratégie d'exécution détaillée, calculateur de profit et annonceurs
            P2P réels pour cette opportunité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* ===== 1. Stratégie d'exécution ===== */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-violet-400" />
              Stratégie d'exécution
            </h3>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-emerald-400 font-semibold mb-1">
                  1. Achetez ici
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="grid place-items-center w-7 h-7 rounded-lg text-white text-xs font-bold flex-shrink-0"
                    style={{ background: op.buyPlatform.color }}
                  >
                    {op.buyPlatform.logo}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {op.buyPlatform.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(op.buyPrice)} {op.quoteAsset}
                    </div>
                  </div>
                </div>
                <a href={buyUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> Ouvrir{" "}
                    {op.buyPlatform.name}
                  </Button>
                </a>
              </div>

              <div className="grid place-items-center text-violet-400">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="rounded-xl bg-fuchsia-500/8 border border-fuchsia-500/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-fuchsia-400 font-semibold mb-1">
                  3. Vendez là-bas
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="grid place-items-center w-7 h-7 rounded-lg text-white text-xs font-bold flex-shrink-0"
                    style={{ background: op.sellPlatform.color }}
                  >
                    {op.sellPlatform.logo}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {op.sellPlatform.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(op.sellPrice)} {op.quoteAsset}
                    </div>
                  </div>
                </div>
                <a href={sellUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/10"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> Ouvrir{" "}
                    {op.sellPlatform.name}
                  </Button>
                </a>
              </div>
            </div>

            <div className="mt-2 rounded-xl bg-violet-500/8 border border-violet-500/20 p-3 flex items-start gap-2">
              <Send className="w-4 h-4 text-violet-300 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  2. Transférez
                </span>{" "}
                vos {op.baseAsset} de {op.buyPlatform.name} vers{" "}
                {op.sellPlatform.name}. Frais réseau estimés&nbsp;:{" "}
                <span className="font-semibold text-amber-300">
                  {fee} {op.baseAsset}
                </span>{" "}
                par transfert.
              </div>
            </div>
          </section>

          {/* ===== 2. Calculateur de profit ===== */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Calculateur de profit
            </h3>
            <div className="glass rounded-xl p-3 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="capital-input">Capital investi (FCFA)</Label>
                <Input
                  id="capital-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={capital}
                  onChange={(e) =>
                    setCapital(Math.max(0, Number(e.target.value) || 0))
                  }
                />
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCapital(amt)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        capital === amt
                          ? "bg-violet-500/20 text-violet-200 border-violet-500/40"
                          : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {formatFcfa(amt, { compact: amt >= 1000000 })}
                    </button>
                  ))}
                </div>
              </div>

              {calc && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <CalcRow
                    label={`Quantité achetée (${op.baseAsset})`}
                    value={formatNumber(calc.qty, 6)}
                  />
                  <CalcRow
                    label={`Frais réseau (${op.baseAsset})`}
                    value={formatNumber(calc.networkFeeTotal, 6)}
                    tone="amber"
                  />
                  <CalcRow
                    label={`Quantité après frais`}
                    value={formatNumber(calc.qtyAfterFee, 6)}
                  />
                  <CalcRow
                    label={`Montant après vente (FCFA)`}
                    value={formatFcfa(calc.grossSale)}
                  />
                  <CalcRow
                    label={`Profit net (FCFA)`}
                    value={formatFcfa(calc.netProfit)}
                    tone={calc.netProfit >= 0 ? "emerald" : "rose"}
                    strong
                  />
                  <CalcRow
                    label={`ROI`}
                    value={formatPercent(calc.roi)}
                    tone={calc.roi >= 0 ? "emerald" : "rose"}
                    strong
                  />
                </div>
              )}

              {calc && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Rentabilité</span>
                    <span>{formatPercent(Math.max(0, Math.min(100, calc.roi)))}</span>
                  </div>
                  <Progress
                    value={Math.max(0, Math.min(100, calc.roi))}
                    className="h-2 bg-white/10"
                  />
                </div>
              )}
            </div>
          </section>

          {/* ===== 3. Annonceurs P2P ===== */}
          {isP2P && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-fuchsia-400" />
                Annonceurs P2P réels
              </h3>
              {adsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Chargement des annonceurs Binance P2P…
                </div>
              ) : adsError ? (
                <div className="text-xs text-rose-300 py-2">{adsError}</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  <AdvertiserList
                    title={`Acheter ${op.baseAsset} (BUY)`}
                    tone="emerald"
                    advertisers={buyAds}
                  />
                  <AdvertiserList
                    title={`Vendre ${op.baseAsset} (SELL)`}
                    tone="fuchsia"
                    advertisers={sellAds}
                  />
                </div>
              )}
            </section>
          )}

          {/* ===== 4. Checklist d'exécution ===== */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
              Checklist d'exécution
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 ml-1">
                {completedCount}/{checklist.length}
              </Badge>
            </h3>
            <div className="space-y-1.5">
              {DEFAULT_CHECKLIST.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setChecklist((prev) =>
                      prev.map((v, idx) => (idx === i ? !v : v))
                    )
                  }
                  className="flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {checklist[i] ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-xs ${
                      checklist[i]
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ===== 5. Info tiles ===== */}
          <section>
            <div className="grid grid-cols-3 gap-2">
              <InfoTile
                icon={Activity}
                label="Fiabilité"
                value={`${Math.round(op.confidence * 100)}%`}
                tone="violet"
              />
              <InfoTile
                icon={Zap}
                label="Volume"
                value={
                  op.volume && op.volume > 0
                    ? `${formatPrice(op.volume)} ${op.baseAsset}`
                    : "—"
                }
                tone="amber"
              />
              <InfoTile
                icon={TrendingUp}
                label="Profit brut"
                value={formatPercent(op.profitPercent)}
                tone="emerald"
              />
            </div>
          </section>
        </div>

        {/* ===== Footer ===== */}
        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Retour à la liste
          </Button>
          <a href={sellUrl} target="_blank" rel="noopener noreferrer">
            <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
              <ExternalLink className="w-4 h-4 mr-1" /> Aller à {op.sellPlatform.name}
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CalcRow({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "amber" | "rose";
  strong?: boolean;
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-400"
      : tone === "amber"
        ? "text-amber-300"
        : tone === "rose"
          ? "text-rose-400"
          : "text-foreground";
  return (
    <div className="rounded-lg bg-white/5 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </div>
      <div
        className={`text-sm ${strong ? "font-bold" : "font-semibold"} ${toneClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: "violet" | "amber" | "emerald";
}) {
  const tones: Record<string, string> = {
    violet: "from-violet-500/20 to-fuchsia-500/20 text-violet-300",
    amber: "from-amber-500/20 to-orange-500/20 text-amber-300",
    emerald: "from-emerald-500/20 to-teal-500/20 text-emerald-300",
  };
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div
        className={`inline-grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br ${tones[tone]} mb-1.5 mx-auto`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}

function AdvertiserList({
  title,
  tone,
  advertisers,
}: {
  title: string;
  tone: "emerald" | "fuchsia";
  advertisers: Advertiser[];
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300 border-emerald-500/30"
      : "text-fuchsia-300 border-fuchsia-500/30";
  return (
    <div className={`rounded-xl border ${toneClass} bg-white/5 p-2.5`}>
      <div className={`text-xs font-semibold mb-1.5 ${toneClass}`}>{title}</div>
      {advertisers.length === 0 ? (
        <div className="text-[11px] text-muted-foreground py-2 text-center">
          Aucun annonceur disponible
        </div>
      ) : (
        <ul className="space-y-1.5">
          {advertisers.map((ad, i) => (
            <li
              key={i}
              className="rounded-lg bg-white/5 p-2 text-[11px] leading-tight"
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-semibold truncate">
                  {ad.advertiserName}
                </span>
                <span className={`font-bold ${toneClass}`}>
                  {formatPrice(ad.price)} FCFA
                </span>
              </div>
              <div className="text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
                <span>Vol. {formatPrice(ad.surplusAmount)}</span>
                <span>•</span>
                <span>{ad.orders} orders</span>
                <span>•</span>
                <span>{(ad.completionRate * 100).toFixed(0)}% compl.</span>
              </div>
              {ad.tradeMethods.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {ad.tradeMethods.slice(0, 3).map((m, j) => (
                    <span
                      key={j}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OpportunityDetailModal;
