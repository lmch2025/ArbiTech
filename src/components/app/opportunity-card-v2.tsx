"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  TrendingUp,
  Clock,
  Lock,
  Zap,
  Activity,
  Star,
  ChevronDown,
  ChevronUp,
  Network,
  ShoppingCart,
  Send,
  Coins,
  Flame,
  Sparkles,
} from "lucide-react";
import { formatFcfa, formatPercent, formatPrice, timeUntil } from "@/lib/format";
import { TimeText } from "@/components/app/time-text";
import type { Opportunity } from "@/lib/types";

export type EnrichedOpportunity = Opportunity & {
  fingerprint: string;
  firstSeenAt: number;
  isNew: boolean;
  isExpiring: boolean;
  isExpired: boolean;
  isFavorite: boolean;
};

type OpportunityCardV2Props = {
  op: EnrichedOpportunity;
  onUpgrade?: (op: EnrichedOpportunity) => void;
  onToggleFavorite?: (fingerprint: string) => void;
  onClick?: () => void;
  highlight?: boolean;
};

// Frais de réseau estimés par actif (par unité transférée)
const NETWORK_FEES: Record<string, number> = {
  USDT: 1,
  USDC: 1,
  BTC: 0.0001,
  ETH: 0.002,
  BNB: 0.001,
  SOL: 0.01,
  TRX: 1,
};

function networkFeeFor(asset: string): number {
  return NETWORK_FEES[asset] ?? 0;
}

const PLATFORM_URLS: Record<string, string> = {
  BINANCE: "https://www.binance.com",
  BYBIT: "https://www.bybit.com",
  OKX: "https://www.okx.com",
  KUCOIN: "https://www.kucoin.com",
};

function platformUrl(code: string): string | undefined {
  return PLATFORM_URLS[code];
}

export function OpportunityCardV2({
  op,
  onUpgrade,
  onToggleFavorite,
  onClick,
  highlight,
}: OpportunityCardV2Props) {
  const [expanded, setExpanded] = useState(false);

  const profit = op.profitPercent;
  const isHot = profit >= 3;
  const isP2P = op.type === "P2P";
  const locked = false; // Le verrouillage est déterminé par le plan utilisateur via le dashboard.
  // Mais ce composant peut recevoir un op marqué comme verrouillé si l'API l'indique
  // (cas des opportunités simulées gated). On considère qu'un op dont le buyPlatform est masqué
  // est verrouillé. La logique exacte est pilotée par le parent (dashboard-view), mais
  // on garde une heuristique locale pour la robustesse :
  const isLocked = Boolean((op as any).locked);
  const isExpired = op.isExpired;
  const isNew = op.isNew;

  // Calcul du profit net après frais réseau
  const fee = networkFeeFor(op.baseAsset);
  // Pour 1 unité de baseAsset : achat buyPrice, vente sellPrice, moins les frais réseau
  // En P2P les prix sont en FCFA directement ; en Spot ils sont en quoteAsset.
  const grossPerUnit = op.sellPrice - op.buyPrice;
  // Le coût réseau en unité de quoteAsset (conversion si P2P déjà en FCFA)
  // En P2P, buyPrice/sellPrice sont en FCFA, fee est en baseAsset → on convertit via sellPrice
  const feeInQuote = isP2P ? fee * op.sellPrice : fee * op.sellPrice;
  const netPerUnit = grossPerUnit - feeInQuote;
  const netPercent = op.buyPrice > 0 ? (netPerUnit / op.buyPrice) * 100 : 0;

  // Estimation FCFA du profit brut pour 1 unité (P2P) ou pour un volume moyen (Spot)
  // On reste cohérent avec l'ancienne carte : on affiche le profit brut en FCFA
  // approximé via un capital notionnel de 100 000 FCFA pour le P2P.
  const grossFcfa = isP2P
    ? grossPerUnit * (100000 / op.buyPrice)
    : grossPerUnit * 615; // Spot : profit par unité × prix approx USDT/FCFA
  const netFcfa = isP2P
    ? netPerUnit * (100000 / op.buyPrice)
    : netPerUnit * 615;

  const buyUrl = platformUrl(op.buyPlatformCode);
  const sellUrl = platformUrl(op.sellPlatformCode);

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 ${
        isExpired
          ? "opacity-40 scale-95"
          : isNew
            ? "glass-strong gradient-border glow-soft animate-scale-in cursor-pointer"
            : isLocked
              ? "glass"
              : highlight
                ? "glass-strong gradient-border glow-soft hover:-translate-y-0.5 cursor-pointer"
                : "glass hover:glass-strong hover:-translate-y-0.5 cursor-pointer"
      }`}
      onClick={() => {
        if (!isLocked && !isExpired && onClick) onClick();
      }}
      role={isLocked || isExpired ? undefined : "button"}
      tabIndex={isLocked || isExpired ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isLocked && !isExpired && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Opportunité ${op.pair} ${formatPercent(profit)}`}
    >
      <div className="p-4 sm:p-5">
        {/* Header: pair + badges + favorite star */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-display font-bold text-base">{op.pair}</span>
            {isP2P ? (
              <Badge className="bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/20">
                P2P
              </Badge>
            ) : (
              <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20">
                Spot
              </Badge>
            )}
            {isHot && !isLocked && (
              <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                <Flame className="w-3 h-3" /> Chaud
              </Badge>
            )}
            {isNew && !isLocked && (
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30">
                <Sparkles className="w-3 h-3" /> NEW
              </Badge>
            )}
            {op.realData === true && (
              <Badge
                className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                title="Issue des APIs publiques réelles de Binance, Bybit, OKX, KuCoin"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot mr-1" />
                Live
              </Badge>
            )}
            {isLocked && (
              <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <Lock className="w-3 h-3" /> Verrouillée
              </Badge>
            )}
          </div>

          <button
            type="button"
            aria-label={op.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(op.fingerprint);
            }}
            className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                op.isFavorite
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground hover:text-amber-300"
              }`}
            />
          </button>
        </div>

        {/* Recipe: Achetez ici ➔ Vendez là-bas */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-3 relative">
          <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3 relative overflow-hidden">
            <div className="text-[10px] uppercase tracking-wide text-emerald-400 font-semibold mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Achetez ici
            </div>
            <div
              className={`flex items-center gap-2 ${isLocked ? "blur-[6px] select-none" : ""}`}
            >
              <span
                className="grid place-items-center w-7 h-7 rounded-lg text-white text-xs font-bold flex-shrink-0"
                style={{ background: op.buyPlatform.color }}
              >
                {op.buyPlatform.logo}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {isLocked ? "••••••" : op.buyPlatform.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isLocked ? "••••••" : `${formatPrice(op.buyPrice)} ${op.quoteAsset}`}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-violet-400">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="rounded-xl bg-fuchsia-500/8 border border-fuchsia-500/20 p-3 relative overflow-hidden">
            <div className="text-[10px] uppercase tracking-wide text-fuchsia-400 font-semibold mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" /> Vendez là-bas
            </div>
            <div
              className={`flex items-center gap-2 ${isLocked ? "blur-[6px] select-none" : ""}`}
            >
              <span
                className="grid place-items-center w-7 h-7 rounded-lg text-white text-xs font-bold flex-shrink-0"
                style={{ background: op.sellPlatform.color }}
              >
                {op.sellPlatform.logo}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {isLocked ? "••••••" : op.sellPlatform.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isLocked ? "••••••" : `${formatPrice(op.sellPrice)} ${op.quoteAsset}`}
                </div>
              </div>
            </div>
          </div>

          {/* Locked overlay CTA */}
          {isLocked && (
            <div className="absolute inset-0 grid place-items-center z-10">
              <div className="flex flex-col items-center gap-1.5 text-center px-3">
                <Lock className="w-5 h-5 text-violet-400" />
                <div className="text-[11px] font-semibold">
                  Où acheter ? Où vendre ?
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpgrade?.(op);
                  }}
                  className="text-[11px] px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold shadow hover:opacity-90 transition-opacity"
                >
                  Débloquer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profit brut */}
        <div className="rounded-xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-teal-500/10 border border-white/10 p-3 mb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Profit brut
                </div>
                <div className="text-sm font-bold text-emerald-400">
                  {formatPercent(profit)}{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    par unité
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                Estimé
              </div>
              <div className="text-sm font-bold">
                {formatFcfa(grossFcfa, { compact: grossFcfa > 100000 })}
              </div>
            </div>
          </div>
        </div>

        {/* Après frais réseau */}
        {!isLocked && (
          <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-3 mb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Après frais réseau
                  </div>
                  <div className="text-sm font-bold text-amber-300">
                    {formatPercent(netPercent)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Net estimé
                </div>
                <div className="text-sm font-bold">
                  {formatFcfa(netFcfa, { compact: netFcfa > 100000 })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer: fiabilité + volume + countdown */}
        {!isLocked && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-violet-400" />
              <span>Fiabilité {Math.round(op.confidence * 100)}%</span>
            </div>
            {op.volume !== null && op.volume > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>
                  Volume&nbsp;: {formatPrice(op.volume)} {op.baseAsset}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <TimeText date={op.expiresAt} formatter={timeUntil} intervalMs={1000} />
            </div>
          </div>
        )}

        {/* Expandable Détails section */}
        {!isLocked && !isExpired && (
          <div className="mt-3 border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="flex items-center justify-between w-full text-xs font-semibold text-violet-300 hover:text-violet-200 transition-colors py-1"
            >
              <span>Détails — comment exécuter</span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {expanded && (
              <div className="mt-2 space-y-2 animate-fade-in">
                <Step
                  n={1}
                  icon={ShoppingCart}
                  title="Achetez ici"
                  tone="emerald"
                  body={
                    <>
                      Ouvrez{" "}
                      <a
                        href={buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold underline decoration-emerald-400/50 hover:decoration-emerald-400"
                      >
                        {op.buyPlatform.name}
                      </a>{" "}
                      et achetez {formatPrice(1)} {op.baseAsset} à{" "}
                      {formatPrice(op.buyPrice)} {op.quoteAsset}.
                    </>
                  }
                />
                <Step
                  n={2}
                  icon={Send}
                  title="Transférez"
                  tone="violet"
                  body={
                    <>
                      Retirez vos {op.baseAsset} vers votre portefeuille de vente.
                      Frais réseau estimés&nbsp;:{" "}
                      <span className="font-semibold">
                        {fee} {op.baseAsset}
                      </span>{" "}
                      par transfert.
                    </>
                  }
                />
                <Step
                  n={3}
                  icon={Coins}
                  title="Vendez là-bas"
                  tone="fuchsia"
                  body={
                    <>
                      Ouvrez{" "}
                      <a
                        href={sellUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold underline decoration-fuchsia-400/50 hover:decoration-fuchsia-400"
                      >
                        {op.sellPlatform.name}
                      </a>{" "}
                      et vendez à {formatPrice(op.sellPrice)} {op.quoteAsset}.
                    </>
                  }
                />
                <Step
                  n={4}
                  icon={TrendingUp}
                  title="Encaissez le profit"
                  tone="teal"
                  body={
                    <>
                      Profit net estimé&nbsp;:{" "}
                      <span className="font-semibold text-emerald-400">
                        {formatPercent(netPercent)}
                      </span>{" "}
                      (
                      {formatFcfa(netFcfa, { compact: netFcfa > 100000 })})
                      après frais réseau.
                    </>
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  tone,
  body,
}: {
  n: number;
  icon: any;
  title: string;
  tone: "emerald" | "violet" | "fuchsia" | "teal";
  body: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-300 border-emerald-500/30",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-300 border-violet-500/30",
    fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-300 border-fuchsia-500/30",
    teal: "from-teal-500/20 to-teal-500/5 text-teal-300 border-teal-500/30",
  };
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={`grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br ${tones[tone]} border flex-shrink-0 text-xs font-bold`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1 text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">{n}. {title}</span>
        <br />
        {body}
      </div>
    </div>
  );
}

export default OpportunityCardV2;
