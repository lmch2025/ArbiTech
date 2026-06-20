"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Clock, Lock, Zap, Activity } from "lucide-react";
import { formatFcfa, formatPercent, formatPrice, timeUntil } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

export function OpportunityCard({
  op,
  locked,
  highlight,
}: {
  op: Opportunity;
  locked?: boolean;
  highlight?: boolean;
}) {
  const profit = op.profitPercent;
  const isHot = profit >= 2.5;
  const isWarm = profit >= 1.2 && !isHot;

  return (
    <div
      className={`relative rounded-2xl p-4 sm:p-5 transition-all ${
        locked
          ? "glass opacity-70"
          : highlight
            ? "glass-strong gradient-border glow-soft"
            : "glass hover:glass-strong hover:-translate-y-0.5"
      }`}
    >
      {/* Header: pair + type + freshness */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-base">{op.pair}</span>
          {op.type === "P2P" ? (
            <Badge className="bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/20">
              P2P · FCFA
            </Badge>
          ) : (
            <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20">
              Spot
            </Badge>
          )}
          {isHot && !locked && (
            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
              🔥 Chaud
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{timeUntil(op.expiresAt)}</span>
        </div>
      </div>

      {/* Recipe: Achat ➔ Vente ➔ Profit */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-3">
        <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3">
          <div className="text-[10px] uppercase tracking-wide text-emerald-400 font-semibold mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Achetez ici
          </div>
          <div className="flex items-center gap-2">
            <span
              className="grid place-items-center w-7 h-7 rounded-lg text-white text-xs font-bold flex-shrink-0"
              style={{ background: op.buyPlatform.color }}
            >
              {op.buyPlatform.logo}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{op.buyPlatform.name}</div>
              <div className="text-xs text-muted-foreground">{formatPrice(op.buyPrice)} {op.quoteAsset}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center text-violet-400">
          <ArrowRight className="w-5 h-5" />
        </div>

        <div className="rounded-xl bg-fuchsia-500/8 border border-fuchsia-500/20 p-3">
          <div className="text-[10px] uppercase tracking-wide text-fuchsia-400 font-semibold mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" /> Vendez là-bas
          </div>
          <div className="flex items-center gap-2">
            <span
              className="grid place-items-center w-7 h-7 rounded-lg text-white text-xs font-bold flex-shrink-0"
              style={{ background: op.sellPlatform.color }}
            >
              {op.sellPlatform.logo}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{op.sellPlatform.name}</div>
              <div className="text-xs text-muted-foreground">{formatPrice(op.sellPrice)} {op.quoteAsset}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit net */}
      <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-teal-500/10 border border-white/10 p-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Profit net</div>
            <div className="text-sm font-bold text-emerald-400">
              {formatPercent(profit)} <span className="text-muted-foreground font-normal text-xs">par unité</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Par {op.baseAsset}</div>
          <div className="text-sm font-bold">{formatFcfa(op.profitAmount * 615, { compact: op.profitAmount > 100 })}</div>
        </div>
        {locked ? (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <Lock className="w-6 h-6 text-violet-400" />
              <div className="text-sm font-semibold">Opportunité verrouillée</div>
              <div className="text-xs text-muted-foreground">Passez au plan supérieur pour la voir</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer: confidence + volume */}
      {!locked && (
        <div className="flex items-center justify-between gap-2 mt-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>Fiabilité {Math.round(op.confidence * 100)}%</span>
          </div>
          {op.volume !== null && op.volume > 0 ? (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Volume dispo: {formatPrice(op.volume)} {op.baseAsset}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
