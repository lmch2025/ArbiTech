"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, ExternalLink, ShoppingCart, Send, Star, Loader2, TrendingUp, Activity, Zap,
  CheckCircle2, Circle, Flame, Users, ShieldCheck, Wallet, Info, AlertCircle, Lock,
} from "lucide-react";
import { formatFcfa, formatPercent, formatPrice, formatNumber } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

type Props = {
  op: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
  onToggleFavorite?: (fingerprint?: string) => void;
};

const NETWORK_FEES: Record<string, number> = { USDT: 1, USDC: 1, BTC: 0.0001, ETH: 0.002, BNB: 0.001, SOL: 0.01, TRX: 1 };
const PLATFORM_URLS: Record<string, string> = { BINANCE: "https://www.binance.com", BYBIT: "https://www.bybit.com", OKX: "https://www.okx.com", KUCOIN: "https://www.kucoin.com" };

type Advertiser = {
  advertiserName: string; price: number; surplusAmount: number;
  tradeMethods: string[]; completionRate: number; orders: number; rating: number;
};

const QUICK_AMOUNTS = [50000, 100000, 500000, 1000000];

export function OpportunityDetailModal({ op, open, onOpenChange, onUpgrade, onToggleFavorite }: Props) {
  const [capital, setCapital] = useState<number>(100000);
  const [checklist, setChecklist] = useState<boolean[]>(Array(6).fill(false));
  const [buyAds, setBuyAds] = useState<Advertiser[]>([]);
  const [sellAds, setSellAds] = useState<Advertiser[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [selectedBuyAd, setSelectedBuyAd] = useState<number>(0);
  const [selectedSellAd, setSelectedSellAd] = useState<number>(0);
  const [p2pCapital, setP2pCapital] = useState<number>(0);

  const isP2P = op?.type === "P2P";
  const fee = op ? NETWORK_FEES[op.baseAsset] ?? 0 : 0;

  useEffect(() => {
    if (!open) { setChecklist(Array(6).fill(false)); setBuyAds([]); setSellAds([]); setAdsError(null); setSelectedBuyAd(0); setSelectedSellAd(0); setP2pCapital(0); }
  }, [open]);

  // Fetch P2P advertisers
  useEffect(() => {
    if (!open || !op || !isP2P) return;
    let cancelled = false;
    async function loadAds() {
      if (!op) return;
      setAdsLoading(true); setAdsError(null);
      try {
        const base = op.baseAsset; const fiat = op.quoteAsset;
        const [buyRes, sellRes] = await Promise.all([
          fetch(`/api/opportunities/p2p-advertisers?asset=${encodeURIComponent(base)}&fiat=${encodeURIComponent(fiat)}&type=BUY`),
          fetch(`/api/opportunities/p2p-advertisers?asset=${encodeURIComponent(base)}&fiat=${encodeURIComponent(fiat)}&type=SELL`),
        ]);
        const buyJson = buyRes.ok ? await buyRes.json() : { advertisers: [] };
        const sellJson = sellRes.ok ? await sellRes.json() : { advertisers: [] };
        if (cancelled) return;
        setBuyAds(Array.isArray(buyJson.advertisers) ? buyJson.advertisers : []);
        setSellAds(Array.isArray(sellJson.advertisers) ? sellJson.advertisers : []);
      } catch { if (!cancelled) setAdsError("Impossible de charger les annonceurs P2P."); }
      finally { if (!cancelled) setAdsLoading(false); }
    }
    loadAds();
    return () => { cancelled = true; };
  }, [open, op, isP2P]);

  // Quand les annonceurs arrivent, initialise le capital P2P au min des volumes
  useEffect(() => {
    if (buyAds.length > 0 && sellAds.length > 0) {
      const buyAd = buyAds[selectedBuyAd] || buyAds[0];
      const sellAd = sellAds[selectedSellAd] || sellAds[0];
      const maxVol = Math.min(buyAd?.surplusAmount || 0, sellAd?.surplusAmount || 0);
      const buyPrice = buyAd?.price || op?.buyPrice || 0;
      const maxCapital = maxVol * buyPrice;
      setP2pCapital(Math.min(maxCapital, 100000)); // capital initial = min(100k, maxVol)
    }
  }, [buyAds, sellAds, selectedBuyAd, selectedSellAd, op?.buyPrice]);

  // ===== Calcul Spot (capital libre) =====
  const spotCalc = useMemo(() => {
    if (!op) return null;
    const qty = op.buyPrice > 0 ? capital / op.buyPrice : 0;
    const networkFeeTotal = fee * qty;
    const qtyAfterFee = Math.max(0, qty - networkFeeTotal);
    const grossSale = qtyAfterFee * op.sellPrice;
    const netProfit = grossSale - capital;
    const roi = capital > 0 ? (netProfit / capital) * 100 : 0;
    return { qty, networkFeeTotal, qtyAfterFee, grossSale, netProfit, roi };
  }, [op, capital, fee]);

  // ===== Calcul P2P (basé sur les vrais annonceurs) =====
  const p2pCalc = useMemo(() => {
    if (!op || !isP2P || buyAds.length === 0 || sellAds.length === 0) return null;
    const buyAd = buyAds[selectedBuyAd];
    const sellAd = sellAds[selectedSellAd];
    if (!buyAd || !sellAd) return null;

    const buyPrice = buyAd.price;
    const sellPrice = sellAd.price;
    const buyVol = buyAd.surplusAmount; // volume dispo côté achat
    const sellVol = sellAd.surplusAmount; // volume dispo côté vente
    const maxVolume = Math.min(buyVol, sellVol); // volume max exécutable

    // Capital en FCFA
    const cap = Math.max(0, Math.min(p2pCapital, maxVolume * buyPrice));
    const qty = buyPrice > 0 ? cap / buyPrice : 0;
    const networkFeeTotal = fee * qty;
    const qtyAfterFee = Math.max(0, qty - networkFeeTotal);
    const grossSale = qtyAfterFee * sellPrice;
    const netProfit = grossSale - cap;
    const roi = cap > 0 ? (netProfit / cap) * 100 : 0;

    return { buyAd, sellAd, buyPrice, sellPrice, maxVolume, cap, qty, networkFeeTotal, qtyAfterFee, grossSale, netProfit, roi };
  }, [op, isP2P, buyAds, sellAds, selectedBuyAd, selectedSellAd, p2pCapital, fee]);

  if (!op) return null;

  const buyUrl = PLATFORM_URLS[op.buyPlatformCode] ?? "#";
  const sellUrl = PLATFORM_URLS[op.sellPlatformCode] ?? "#";
  const isHot = op.profitPercent >= 3;
  const completedCount = checklist.filter(Boolean).length;

  const checklistItems = isP2P ? [
    "J'ai vérifié le prix et le volume du vendeur P2P sélectionné",
    "J'ai vérifié le prix et le volume de l'acheteur P2P sélectionné",
    "J'ai confirmé les moyens de paiement (MoMo, Orange Money, etc.)",
    "J'ai vérifié la réputation des annonceurs (taux de complétion, nombre d'ordres)",
    "J'ai préparé mon compte Mobile Money pour le paiement",
    "Je suis prêt à exécuter l'arbitrage maintenant",
  ] : [
    "J'ai vérifié les prix en direct sur les plateformes",
    "J'ai vérifié la liquidité disponible dans le carnet d'ordres",
    "J'ai calculé les frais de réseau pour le transfert",
    "J'ai préparé mon portefeuille de réception",
    "J'ai vérifié les frais de trading sur chaque plateforme",
    "Je suis prêt à exécuter l'arbitrage maintenant",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scroll-elegant">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap pr-8">
            <span>{op.pair}</span>
            {op.type === "P2P" ? (
              <Badge className="bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">P2P · FCFA</Badge>
            ) : (
              <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30">Spot</Badge>
            )}
            {isHot && <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30"><Flame className="w-3 h-3" /> Chaud</Badge>}
            {op.realData === true && <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot mr-1" /> Live</Badge>}
            <button type="button" aria-label="Favori" onClick={() => { setFavorite(v => !v); onToggleFavorite?.(); }} className="ml-auto grid place-items-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors">
              <Star className={`w-4 h-4 ${favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
            </button>
          </DialogTitle>
          <DialogDescription>
            {isP2P
              ? "Arbitrage P2P : vous achetez à un vrai vendeur et vendez à un vrai acheteur. Le calcul est basé sur les annonces réelles."
              : "Arbitrage Spot : vous tradez contre le carnet d'ordres. Le calculateur estime votre profit selon votre capital."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* ===== 1. Stratégie d'exécution ===== */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><ArrowRight className="w-4 h-4 text-violet-400" /> Stratégie d'exécution</h3>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-emerald-400 font-semibold mb-1">1. Achetez ici</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="grid place-items-center w-7 h-7 rounded-lg text-white text-xs font-bold flex-shrink-0" style={{ background: op.buyPlatform.color }}>{op.buyPlatform.logo}</span>
                  <div className="min-w-0"><div className="text-sm font-semibold truncate">{op.buyPlatform.name}</div><div className="text-xs text-muted-foreground">{formatPrice(op.buyPrice)} {op.quoteAsset}</div></div>
                </div>
                <a href={buyUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" className="w-full h-8 text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"><ExternalLink className="w-3 h-3 mr-1" /> Ouvrir {op.buyPlatform.name}</Button></a>
              </div>
              <div className="grid place-items-center text-violet-400"><ArrowRight className="w-5 h-5" /></div>
              <div className="rounded-xl bg-fuchsia-500/8 border border-fuchsia-500/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-fuchsia-400 font-semibold mb-1">3. Vendez là-bas</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="grid place-items-center w-7 h-7 rounded-lg text-white text-xs font-bold flex-shrink-0" style={{ background: op.sellPlatform.color }}>{op.sellPlatform.logo}</span>
                  <div className="min-w-0"><div className="text-sm font-semibold truncate">{op.sellPlatform.name}</div><div className="text-xs text-muted-foreground">{formatPrice(op.sellPrice)} {op.quoteAsset}</div></div>
                </div>
                <a href={sellUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" className="w-full h-8 text-xs border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/10"><ExternalLink className="w-3 h-3 mr-1" /> Ouvrir {op.sellPlatform.name}</Button></a>
              </div>
            </div>
            <div className="mt-2 rounded-xl bg-violet-500/8 border border-violet-500/20 p-3 flex items-start gap-2">
              <Send className="w-4 h-4 text-violet-300 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">2. Transférez</span> vos {op.baseAsset} de {op.buyPlatform.name} vers {op.sellPlatform.name}. Frais réseau : <span className="font-semibold text-amber-300">{fee} {op.baseAsset}</span> par transfert.</div>
            </div>
          </section>

          {/* ===== 2A. Calculateur P2P (basé sur vrais annonceurs) ===== */}
          {isP2P ? (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Users className="w-4 h-4 text-fuchsia-400" /> Calculateur P2P — Vrais annonceurs</h3>

              {adsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Chargement des annonceurs Binance P2P réels…</div>
              ) : adsError ? (
                <div className="text-xs text-rose-300 py-2">{adsError}</div>
              ) : buyAds.length === 0 || sellAds.length === 0 ? (
                <div className="glass rounded-xl p-4 text-center text-sm text-muted-foreground">Aucun annonceur P2P disponible pour le moment.</div>
              ) : (
                <div className="space-y-3">
                  {/* Sélection des annonceurs */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Vendeur (BUY) */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                      <div className="text-xs font-semibold text-emerald-300 mb-2 flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" /> Vendeur (qui vous vend)</div>
                      <div className="space-y-1.5">
                        {buyAds.slice(0, 3).map((ad, i) => (
                          <button key={i} onClick={() => setSelectedBuyAd(i)} className={`w-full text-left rounded-lg p-2 transition-colors ${selectedBuyAd === i ? "bg-emerald-500/15 border border-emerald-500/40" : "bg-white/5 border border-transparent hover:bg-white/10"}`}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold truncate">{ad.advertiserName}</span>
                              <span className="font-bold text-emerald-300">{formatPrice(ad.price)} FCFA</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span className="flex items-center gap-0.5"><Wallet className="w-2.5 h-2.5" /> {formatPrice(ad.surplusAmount)} {op.baseAsset}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5"><ShieldCheck className="w-2.5 h-2.5" /> {(ad.completionRate * 100).toFixed(0)}%</span>
                            </div>
                            {ad.tradeMethods.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">{ad.tradeMethods.slice(0, 2).map((m, j) => (<span key={j} className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-muted-foreground">{m}</span>))}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Acheteur (SELL) */}
                    <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-3">
                      <div className="text-xs font-semibold text-fuchsia-300 mb-2 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Acheteur (qui vous rachète)</div>
                      <div className="space-y-1.5">
                        {sellAds.slice(0, 3).map((ad, i) => (
                          <button key={i} onClick={() => setSelectedSellAd(i)} className={`w-full text-left rounded-lg p-2 transition-colors ${selectedSellAd === i ? "bg-fuchsia-500/15 border border-fuchsia-500/40" : "bg-white/5 border border-transparent hover:bg-white/10"}`}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold truncate">{ad.advertiserName}</span>
                              <span className="font-bold text-fuchsia-300">{formatPrice(ad.price)} FCFA</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span className="flex items-center gap-0.5"><Wallet className="w-2.5 h-2.5" /> {formatPrice(ad.surplusAmount)} {op.baseAsset}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5"><ShieldCheck className="w-2.5 h-2.5" /> {(ad.completionRate * 100).toFixed(0)}%</span>
                            </div>
                            {ad.tradeMethods.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">{ad.tradeMethods.slice(0, 2).map((m, j) => (<span key={j} className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-muted-foreground">{m}</span>))}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Capital limité au volume dispo */}
                  {p2pCalc && (
                    <div className="glass rounded-xl p-3 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="p2p-capital" className="text-xs">Capital (limité au volume disponible)</Label>
                          <span className="text-[10px] text-muted-foreground">Max : {formatFcfa(p2pCalc.maxVolume * p2pCalc.buyPrice, { compact: true })}</span>
                        </div>
                        <Input id="p2p-capital" type="number" inputMode="numeric" min={0} max={Math.floor(p2pCalc.maxVolume * p2pCalc.buyPrice)} step={1000} value={p2pCapital} onChange={(e) => setP2pCapital(Math.max(0, Math.min(Number(e.target.value) || 0, p2pCalc.maxVolume * p2pCalc.buyPrice)))} />
                        <input type="range" min={0} max={Math.floor(p2pCalc.maxVolume * p2pCalc.buyPrice)} value={Math.min(p2pCapital, p2pCalc.maxVolume * p2pCalc.buyPrice)} onChange={(e) => setP2pCapital(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted/50 accent-violet-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <CalcRow label={`Quantité achetée`} value={`${formatNumber(p2pCalc.qty, 4)} ${op.baseAsset}`} />
                        <CalcRow label={`Frais réseau`} value={`${formatNumber(p2pCalc.networkFeeTotal, 4)} ${op.baseAsset}`} tone="amber" />
                        <CalcRow label={`Quantité après frais`} value={`${formatNumber(p2pCalc.qtyAfterFee, 4)} ${op.baseAsset}`} />
                        <CalcRow label={`Montant après vente`} value={formatFcfa(p2pCalc.grossSale)} />
                        <CalcRow label={`Profit net`} value={formatFcfa(p2pCalc.netProfit)} tone={p2pCalc.netProfit >= 0 ? "emerald" : "rose"} strong />
                        <CalcRow label={`ROI`} value={formatPercent(p2pCalc.roi)} tone={p2pCalc.roi >= 0 ? "emerald" : "rose"} strong />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>Rentabilité</span><span>{formatPercent(Math.max(-100, Math.min(100, p2pCalc.roi)))}</span></div>
                        <Progress value={Math.max(0, Math.min(100, p2pCalc.roi))} className="h-2 bg-white/10" />
                      </div>
                      {p2pCalc.netProfit < 0 && (
                        <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-[11px] text-rose-300">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>Attention : les frais (réseau + écart de prix) dépassent le profit. Cette combinaison d'annonceurs n'est pas rentable.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          ) : (
            /* ===== 2B. Calculateur Spot (capital libre) ===== */
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-400" /> Calculateur de profit</h3>
              <div className="glass rounded-xl p-3 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="capital-input" className="text-xs">Capital investi (FCFA)</Label>
                  <Input id="capital-input" type="number" inputMode="numeric" min={0} step={1000} value={capital} onChange={(e) => setCapital(Math.max(0, Number(e.target.value) || 0))} />
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button key={amt} type="button" onClick={() => setCapital(amt)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${capital === amt ? "bg-violet-500/20 text-violet-200 border-violet-500/40" : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"}`}>{formatFcfa(amt, { compact: amt >= 1000000 })}</button>
                    ))}
                  </div>
                </div>
                {spotCalc && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <CalcRow label={`Quantité achetée (${op.baseAsset})`} value={formatNumber(spotCalc.qty, 6)} />
                      <CalcRow label={`Frais réseau (${op.baseAsset})`} value={formatNumber(spotCalc.networkFeeTotal, 6)} tone="amber" />
                      <CalcRow label={`Quantité après frais`} value={formatNumber(spotCalc.qtyAfterFee, 6)} />
                      <CalcRow label={`Montant après vente (FCFA)`} value={formatFcfa(spotCalc.grossSale)} />
                      <CalcRow label={`Profit net (FCFA)`} value={formatFcfa(spotCalc.netProfit)} tone={spotCalc.netProfit >= 0 ? "emerald" : "rose"} strong />
                      <CalcRow label={`ROI`} value={formatPercent(spotCalc.roi)} tone={spotCalc.roi >= 0 ? "emerald" : "rose"} strong />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>Rentabilité</span><span>{formatPercent(Math.max(0, Math.min(100, spotCalc.roi)))}</span></div>
                      <Progress value={Math.max(0, Math.min(100, spotCalc.roi))} className="h-2 bg-white/10" />
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* ===== 3. Checklist ===== */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Checklist d'exécution <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 ml-1">{completedCount}/{checklistItems.length}</Badge></h3>
            <div className="space-y-1.5">
              {checklistItems.map((item, i) => (
                <button key={i} type="button" onClick={() => setChecklist((prev) => prev.map((v, idx) => idx === i ? !v : v))} className="flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors">
                  {checklist[i] ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                  <span className={`text-xs ${checklist[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>{item}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ===== 4. Info tiles ===== */}
          <section>
            <div className="grid grid-cols-3 gap-2">
              <InfoTile icon={Activity} label="Fiabilité" value={`${Math.round(op.confidence * 100)}%`} tone="violet" />
              <InfoTile icon={Zap} label="Volume" value={op.volume && op.volume > 0 ? `${formatPrice(op.volume)} ${op.baseAsset}` : "—"} tone="amber" />
              <InfoTile icon={TrendingUp} label="Profit brut" value={formatPercent(op.profitPercent)} tone="emerald" />
            </div>
          </section>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">Retour à la liste</Button>
          <a href={buyUrl} target="_blank" rel="noopener noreferrer"><Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0"><ExternalLink className="w-4 h-4 mr-1" /> Aller à {op.buyPlatform.name}</Button></a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CalcRow({ label, value, tone, strong }: { label: string; value: string; tone?: "emerald" | "amber" | "rose"; strong?: boolean }) {
  const toneClass = tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-300" : tone === "rose" ? "text-rose-400" : "text-foreground";
  return (
    <div className="rounded-lg bg-white/5 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
      <div className={`text-sm ${strong ? "font-bold" : "font-semibold"} ${toneClass}`}>{value}</div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "violet" | "amber" | "emerald" }) {
  const tones: Record<string, string> = { violet: "from-violet-500/20 to-fuchsia-500/20 text-violet-300", amber: "from-amber-500/20 to-orange-500/20 text-amber-300", emerald: "from-emerald-500/20 to-teal-500/20 text-emerald-300" };
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className={`inline-grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br ${tones[tone]} mb-1.5 mx-auto`}><Icon className="w-4 h-4" /></div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-0.5">{label}</div>
    </div>
  );
}

export default OpportunityDetailModal;
