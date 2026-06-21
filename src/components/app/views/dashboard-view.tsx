"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { OpportunityCardV2 } from "@/components/app/opportunity-card-v2";
import { OpportunityDetailModal } from "@/components/app/opportunity-detail-modal";
import { TimeText } from "@/components/app/time-text";
import { useNotifications } from "@/hooks/use-notifications";
import { useOpportunities, type SortMode, type CategoryFilter } from "@/hooks/use-opportunities";
import {
  Zap, Bell, BellOff, BellRing, Filter, Search, RefreshCw, Wifi, WifiOff, TrendingUp, Crown,
  Check, Sparkles, Clock, Lock, Gift, ChevronRight, Activity, X, Volume2, VolumeX,
  Pause, Play, Star, Flame, LayoutGrid, List, ArrowUpDown, History, ChevronLeft, ArrowRight,
} from "lucide-react";
import { formatFcfa, formatPercent, timeAgo } from "@/lib/format";
import { toast } from "sonner";
import type { Opportunity, Notification, PlanInfo } from "@/lib/types";

type EnrichedOpportunity = Opportunity & {
  fingerprint: string; firstSeenAt: number;
  isNew: boolean; isExpiring: boolean; isExpired: boolean; isFavorite: boolean;
};

export function DashboardView() {
  const user = useApp((s) => s.user);
  const plans = useApp((s) => s.plans);
  const platforms = useApp((s) => s.platforms);
  const setView = useApp((s) => s.setView);

  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number; resetAt: string } | null>(null);

  // Nouveau hook intelligent : merge stable, déduplication, favoris, pause
  const oppHook = useOpportunities();
  const [sortMode, setSortMode] = useState<SortMode>("profit");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // filters
  const [filterPlatform, setFilterPlatform] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterPair, setFilterPair] = useState<string>("");
  const [minProfit, setMinProfit] = useState<string>("0");
  const [showFilters, setShowFilters] = useState(false);

  // notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notif = useNotifications();
  const notifShowRef = useRef(notif.showOpportunity);
  notifShowRef.current = notif.showOpportunity;

  // modals
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [detailOp, setDetailOp] = useState<EnrichedOpportunity | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // history
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  const userPlan = user?.plan;
  const isRealTime = userPlan?.isRealTime ?? false;
  const delaySeconds = userPlan?.delaySeconds ?? 900;

  const seenIdsRef = useRef<Set<string>>(new Set());

  // REST loader — fusionne intelligemment dans le hook (stable, pas de saut)
  const loadFromAPI = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterPlatform !== "ALL") params.set("platform", filterPlatform);
      if (filterType !== "ALL") params.set("type", filterType);
      if (filterPair) params.set("pair", filterPair);
      if (minProfit && minProfit !== "0") params.set("minProfit", minProfit);
      params.set("limit", "40");
      const res = await fetch(`/api/opportunities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newOps: Opportunity[] = data.opportunities || [];
        for (const op of newOps) {
          if (op.profitPercent >= 3 && userPlan?.hasPush && !seenIdsRef.current.has(op.id)) {
            toast.success(`🔥 Opportunité chaude : ${op.pair} +${op.profitPercent.toFixed(2)}%`, {
              description: `${op.buyPlatform.name} → ${op.sellPlatform.name}`,
            });
            notifShowRef.current({ pair: op.pair, profit: op.profitPercent, buyPlatform: op.buyPlatform.name, sellPlatform: op.sellPlatform.name });
          }
          seenIdsRef.current.add(op.id);
        }
        if (seenIdsRef.current.size > 200) seenIdsRef.current = new Set(Array.from(seenIdsRef.current).slice(-100));
        oppHook.mergeOpportunities(newOps);
        setLastUpdate(new Date());
        setPolling(true);
        if (data.quota) setQuota(data.quota);
      }
    } catch { setPolling(false); } finally { setLoading(false); }
  }, [filterPlatform, filterType, filterPair, minProfit, userPlan?.hasPush, oppHook]);

  // Polling REST : 4s Pro, 15s Découverte
  useEffect(() => {
    if (!user) return;
    loadFromAPI();
    const intervalMs = isRealTime ? 4000 : 15000;
    const interval = setInterval(loadFromAPI, intervalMs);
    return () => clearInterval(interval);
  }, [user, loadFromAPI, isRealTime]);

  useEffect(() => { if (user) loadFromAPI(); }, [filterPlatform, filterType, filterPair, minProfit, user, loadFromAPI]);

  // History loader
  const loadHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/opportunities/history?page=${page}&pageSize=6`);
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.items || []);
        setHistoryTotal(data.pagination?.total ?? 0);
        setHistoryTotalPages(data.pagination?.totalPages ?? 1);
        setHistoryPage(page);
      }
    } catch {} finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { if (category === "history" && user) loadHistory(historyPage); }, [category, user, loadHistory, historyPage]);

  // Notifications
  const loadNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) { const data = await res.json(); setNotifications(data.notifications); setUnread(data.unread); }
    } catch {}
  }, [user]);
  useEffect(() => { loadNotifs(); const i = setInterval(loadNotifs, 30000); return () => clearInterval(i); }, [loadNotifs]);

  const markRead = async (id: string) => {
    await fetch("/api/notifications/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  if (!user) return null;

  const planCode = userPlan?.code || "DECOUVERTE";
  const isFree = planCode === "DECOUVERTE" || !userPlan;
  const lockedCount = oppHook.ops.filter((o) => o.locked && !o.isExpired).length;

  // Filtre + tri pour l'affichage
  let displayOps = oppHook.ops.filter((op) => {
    if (op.isExpired) return false;
    if (category === "hot" && op.profitPercent < 3) return false;
    if (category === "p2p" && op.type !== "P2P") return false;
    if (category === "spot" && op.type !== "SPOT") return false;
    if (category === "favorites" && !op.isFavorite) return false;
    if (filterPlatform !== "ALL" && op.buyPlatformCode !== filterPlatform && op.sellPlatformCode !== filterPlatform) return false;
    if (filterType !== "ALL" && op.type !== filterType) return false;
    if (filterPair && !op.pair.toLowerCase().includes(filterPair.toLowerCase())) return false;
    if (minProfit && minProfit !== "0" && op.profitPercent < parseFloat(minProfit)) return false;
    return true;
  });
  displayOps = [...displayOps].sort((a, b) => {
    switch (sortMode) {
      case "profit": return b.profitPercent - a.profitPercent;
      case "profit_asc": return a.profitPercent - b.profitPercent;
      case "confidence": return b.confidence - a.confidence;
      case "expiry": return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      case "newest": return b.firstSeenAt - a.firstSeenAt;
      default: return 0;
    }
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Bonjour, {user.name?.split(" ")[0] || "ami"} 👋</h1>
            <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0"><Crown className="w-3 h-3 mr-1" /> {userPlan?.name || "Découverte"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Voici les opportunités d'arbitrage en direct.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${polling ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
            {polling ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {polling ? (isRealTime ? `Live · ${4}s` : `Retard ${delaySeconds / 60}min`) : "Reconnexion…"}
          </div>
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <button className="relative grid place-items-center w-10 h-10 rounded-full glass hover:glass-strong transition-all" aria-label="Notifications">
                <Bell className="w-4 h-4" />
                {unread > 0 && <span className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-fuchsia-500 text-white text-[10px] font-bold">{unread}</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unread > 0 && <Badge className="bg-fuchsia-500/20 text-fuchsia-300">{unread} non lues</Badge>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto scroll-elegant">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground"><BellRing className="w-6 h-6 mx-auto mb-2 opacity-40" />Aucune notification pour l'instant</div>
                ) : notifications.slice(0, 15).map((n) => (
                  <DropdownMenuItem key={n.id} className="flex-col items-start py-2.5 cursor-pointer" onClick={() => !n.read && markRead(n.id)}>
                    <div className="flex items-center gap-2 w-full">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-fuchsia-500 flex-shrink-0" />}
                      <span className="font-semibold text-sm flex-1">{n.title}</span>
                      <span className="text-[10px] text-muted-foreground"><TimeText date={n.createdAt} formatter={timeAgo} intervalMs={10000} /></span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-4">{n.body}</p>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {notif.mounted && notif.supported && (
            <Button variant="outline" size="icon" className={notif.pushEnabled ? "border-emerald-500/40 text-emerald-400" : ""} title={notif.pushEnabled ? "Push activées" : "Activer push"} onClick={async () => {
              if (!userPlan?.hasPush) { toast.info("Push réservées au plan Pro."); setUpgradeOpen(true); return; }
              if (notif.pushEnabled) { notif.disablePush(); toast.success("Push désactivées."); }
              else { const ok = await notif.enablePush(); if (ok) toast.success("Push activées ! 🎉"); else toast.error("Permission refusée."); }
            }}>
              {notif.pushEnabled ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {!userPlan?.hasPush && <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5" />}
            </Button>
          )}
          {notif.mounted && notif.pushEnabled && (
            <Button variant="ghost" size="icon" className="text-muted-foreground" title="Son" onClick={notif.toggleSound}>
              {notif.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={loadFromAPI} title="Rafraîchir"><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Real data banner */}
      <RealDataBanner ops={oppHook.ops.filter(o => !o.isExpired)} />

      {/* Plan banner for free users — incitation bienveillante */}
      {isFree && (
        <div className="relative overflow-hidden rounded-2xl glass-strong gradient-border p-4 sm:p-5 mb-6">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex-shrink-0"><Clock className="w-5 h-5" /></div>
            <div className="flex-1">
              <h3 className="font-semibold mb-0.5">Vous voyez les opportunités avec <span className="text-amber-300">{delaySeconds / 60} minutes de retard</span></h3>
              <p className="text-sm text-muted-foreground">Les abonnés <strong className="text-violet-300">Pro</strong> voient les opportunités en <strong className="text-emerald-300">temps réel</strong> et saisissent les meilleures opportunités avant qu'elles n'expirent.</p>
            </div>
            <Button onClick={() => setUpgradeOpen(true)} className="relative bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 flex-shrink-0"><Zap className="w-4 h-4 mr-1" /> Passer au temps réel</Button>
          </div>
          {quota && quota.limit > 0 && (
            <div className="relative mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-violet-400" /> Opportunités détaillées aujourd'hui</span>
                <span className={`font-semibold ${quota.remaining === 0 ? "text-amber-300" : "text-foreground"}`}>{quota.used} / {quota.limit}{quota.remaining === 0 && <span className="ml-1.5 text-amber-300">· Quota atteint</span>}</span>
              </div>
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${quota.remaining === 0 ? "bg-gradient-to-r from-amber-500 to-rose-500" : "bg-gradient-to-r from-violet-500 to-fuchsia-500"}`} style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }} />
              </div>
              {quota.remaining === 0 && <p className="text-[11px] text-amber-300/80 mt-1.5">Les nouvelles opportunités sont floutées. Revenez demain, ou passez au plan Pro pour un accès illimité.</p>}
              {quota.remaining > 0 && quota.remaining <= 3 && <p className="text-[11px] text-amber-300/70 mt-1.5">Plus que {quota.remaining} opportunité{quota.remaining > 1 ? "s" : ""} détaillée{quota.remaining > 1 ? "s" : ""} aujourd'hui.</p>}
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile icon={Activity} label="Opportunités actives" value={String(displayOps.length)} tone="violet" />
        <StatTile icon={TrendingUp} label="Profit moyen" value={displayOps.length ? formatPercent(displayOps.reduce((s, o) => s + o.profitPercent, 0) / displayOps.length) : "—"} tone="emerald" />
        <StatTile icon={Zap} label="Meilleur profit" value={displayOps.length ? formatPercent(Math.max(...displayOps.map((o) => o.profitPercent))) : "—"} tone="amber" />
        <StatTile icon={Clock} label="Dernière mise à jour" value={lastUpdate ? <TimeText date={lastUpdate} formatter={timeAgo} intervalMs={2000} /> : "—"} tone="teal" />
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)} className="lg:hidden"><Filter className="w-4 h-4 mr-1" /> Filtres</Button>
        <div className={`flex-1 flex items-center gap-2 flex-wrap ${showFilters ? "flex" : "hidden lg:flex"}`}>
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher une paire (ex: USDT, BTC)…" value={filterPair} onChange={(e) => setFilterPair(e.target.value)} className="pl-9 h-10" />
          </div>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-[150px] h-10"><SelectValue placeholder="Plateforme" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Toutes les plateformes</SelectItem>{platforms.map((p) => (<SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-10"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Tout type</SelectItem><SelectItem value="SPOT">Spot</SelectItem><SelectItem value="P2P">P2P · FCFA</SelectItem></SelectContent>
          </Select>
          <Select value={minProfit} onValueChange={setMinProfit}>
            <SelectTrigger className="w-[150px] h-10"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="0">Tous profits</SelectItem><SelectItem value="0.5">≥ 0,5%</SelectItem><SelectItem value="1">≥ 1%</SelectItem><SelectItem value="2">≥ 2%</SelectItem><SelectItem value="3">≥ 3% 🔥</SelectItem></SelectContent>
          </Select>
          {(filterPair || filterPlatform !== "ALL" || filterType !== "ALL" || minProfit !== "0") && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterPair(""); setFilterPlatform("ALL"); setFilterType("ALL"); setMinProfit("0"); }}><X className="w-3.5 h-3.5 mr-1" /> Effacer</Button>
          )}
        </div>
      </div>

      {/* ===== TABS + CONTROLS ===== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto scroll-elegant pb-1">
          {([
            { key: "all", label: "Toutes", icon: Activity, count: oppHook.ops.filter(o => !o.isExpired).length },
            { key: "hot", label: "🔥 Chaudes", icon: Flame, count: oppHook.ops.filter(o => !o.isExpired && o.profitPercent >= 3).length },
            { key: "p2p", label: "P2P FCFA", icon: Crown, count: oppHook.ops.filter(o => !o.isExpired && o.type === "P2P").length },
            { key: "spot", label: "Spot", icon: TrendingUp, count: oppHook.ops.filter(o => !o.isExpired && o.type === "SPOT").length },
            { key: "favorites", label: "Favoris", icon: Star, count: oppHook.ops.filter(o => !o.isExpired && o.isFavorite).length },
            { key: "history", label: "Historique", icon: History, count: historyTotal },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setCategory(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${category === tab.key ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white" : "glass text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
              {tab.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${category === tab.key ? "bg-white/20" : "bg-muted/50"}`}>{tab.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant={oppHook.paused ? "default" : "outline"} size="sm" onClick={() => { oppHook.setPaused(!oppHook.paused); toast.success(oppHook.paused ? "Reprise des mises à jour" : "Liste figée — prenez votre temps"); }} className={oppHook.paused ? "bg-amber-500 hover:bg-amber-600 text-white border-0" : ""}>
            {oppHook.paused ? <Play className="w-3.5 h-3.5 mr-1" /> : <Pause className="w-3.5 h-3.5 mr-1" />}{oppHook.paused ? "Reprendre" : "Figer"}
          </Button>
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><ArrowUpDown className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="profit">Profit ↓</SelectItem><SelectItem value="profit_asc">Profit ↑</SelectItem><SelectItem value="confidence">Fiabilité</SelectItem><SelectItem value="expiry">Expire bientôt</SelectItem><SelectItem value="newest">Plus récentes</SelectItem></SelectContent>
          </Select>
          <div className="flex items-center gap-0.5 glass rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`grid place-items-center w-8 h-8 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} title="Grille"><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("list")} className={`grid place-items-center w-8 h-8 rounded-md transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} title="Liste"><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* ===== OPPORTUNITIES DISPLAY ===== */}
      {category === "history" ? (
        <div>
          {historyLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[0,1,2,3,4,5].map((i) => <div key={i} className="h-48 rounded-2xl shimmer bg-muted/30" />)}</div>
          ) : historyItems.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="grid place-items-center w-16 h-16 rounded-full bg-muted/40 mx-auto mb-4"><History className="w-7 h-7 text-muted-foreground" /></div>
              <h3 className="font-semibold text-lg mb-1">Aucune opportunité consultée</h3>
              <p className="text-sm text-muted-foreground mb-4">Les opportunités que vous consultez s'enregistrent ici. Vous pourrez les retrouver même après expiration.</p>
              <Button variant="outline" onClick={() => setCategory("all")}>Voir les opportunités en cours</Button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyItems.map((op) => (
                  <div key={op.id} onClick={() => { setDetailOp(op as any); setDetailOpen(true); }} className="glass rounded-2xl p-4 hover:glass-strong cursor-pointer hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-bold text-sm">{op.pair}</span>
                      {op.type === "P2P" ? <Badge className="bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 text-[10px]">P2P</Badge> : <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px]">Spot</Badge>}
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-center mb-2 text-xs">
                      <div className="flex items-center gap-1.5"><span className="grid place-items-center w-6 h-6 rounded text-white text-[10px] font-bold flex-shrink-0" style={{ background: op.buyPlatform.color }}>{op.buyPlatform.logo}</span><span className="truncate">{op.buyPlatform.name}</span></div>
                      <ArrowRight className="w-3 h-3 text-violet-400" />
                      <div className="flex items-center gap-1.5"><span className="grid place-items-center w-6 h-6 rounded text-white text-[10px] font-bold flex-shrink-0" style={{ background: op.sellPlatform.color }}>{op.sellPlatform.logo}</span><span className="truncate">{op.sellPlatform.name}</span></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">{formatPercent(op.profitPercent)}</span>
                      <span className="text-muted-foreground"><TimeText date={op.viewedAt} formatter={timeAgo} intervalMs={60000} /></span>
                    </div>
                  </div>
                ))}
              </div>
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button variant="outline" size="sm" disabled={historyPage === 1} onClick={() => loadHistory(historyPage - 1)}><ChevronLeft className="w-4 h-4 mr-1" /> Précédent</Button>
                  <span className="text-sm text-muted-foreground px-3">Page {historyPage} / {historyTotalPages}</span>
                  <Button variant="outline" size="sm" disabled={historyPage >= historyTotalPages} onClick={() => loadHistory(historyPage + 1)}>Suivant <ChevronRight className="w-4 h-4 ml-1" /></Button>
                </div>
              )}
              <p className="text-center text-xs text-muted-foreground mt-3">{historyTotal} opportunité{historyTotal > 1 ? "s" : ""} consultée{historyTotal > 1 ? "s" : ""} au total</p>
            </>
          )}
        </div>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[0,1,2,3,4,5].map((i) => <div key={i} className="h-52 rounded-2xl shimmer bg-muted/30" />)}</div>
      ) : displayOps.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="grid place-items-center w-16 h-16 rounded-full bg-muted/40 mx-auto mb-4">{category === "favorites" ? <Star className="w-7 h-7 text-muted-foreground" /> : <Search className="w-7 h-7 text-muted-foreground" />}</div>
          <h3 className="font-semibold text-lg mb-1">{category === "favorites" ? "Aucun favori pour le moment" : "Aucune opportunité pour ces filtres"}</h3>
          <p className="text-sm text-muted-foreground mb-4">{category === "favorites" ? "Cliquez sur l'étoile d'une opportunité pour l'épingler ici." : "Essayez d'élargir vos critères, ou patientez : de nouvelles opportunités apparaissent en continu."}</p>
          {category !== "favorites" && <Button variant="outline" onClick={() => { setFilterPair(""); setFilterPlatform("ALL"); setFilterType("ALL"); setMinProfit("0"); setCategory("all"); }}>Réinitialiser les filtres</Button>}
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {displayOps.map((op, idx) => (
            <OpportunityCardV2 key={`${op.fingerprint}-${idx}`} op={op} onUpgrade={() => setUpgradeOpen(true)} onToggleFavorite={oppHook.toggleFavorite} onClick={() => { setDetailOp(op); setDetailOpen(true); }} />
          ))}
        </div>
      )}

      {/* Locked teaser */}
      {isFree && lockedCount > 0 && (
        <div className="mt-6 glass rounded-2xl p-6 text-center border border-violet-500/20">
          <Lock className="w-6 h-6 text-violet-400 mx-auto mb-2" />
          <p className="text-sm font-semibold mb-1">{lockedCount} opportunités verrouillées aujourd'hui</p>
          <p className="text-xs text-muted-foreground mb-3">Vous avez atteint votre quota gratuit. Passez au plan Pro pour un accès illimité.</p>
          <Button size="sm" onClick={() => setUpgradeOpen(true)} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">Débloquer maintenant <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
      )}

      {/* Detail modal */}
      <OpportunityDetailModal op={detailOp} open={detailOpen} onOpenChange={setDetailOpen} onUpgrade={() => { setDetailOpen(false); setUpgradeOpen(true); }} onToggleFavorite={oppHook.toggleFavorite} />

      {/* Upgrade modal */}
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} plans={plans} currentPlanCode={planCode} />
    </div>
  );
}

function RealDataBanner({ ops }: { ops: any[] }) {
  const realCount = ops.filter((o) => o.realData).length;
  const simCount = ops.length - realCount;
  if (ops.length === 0) return null;
  return (
    <div className="rounded-2xl glass p-3 sm:p-4 mb-6 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
        <div className="text-sm">
          <span className="font-semibold">Données de marché réelles</span>
          <span className="text-muted-foreground ml-2">{realCount > 0 && <>{realCount} live</>}{realCount > 0 && simCount > 0 && " · "}{simCount > 0 && <>{simCount} simulée{simCount > 1 ? "s" : ""}</>}</span>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Activity className="w-3 h-3" />Sources : Binance · Bybit · OKX · KuCoin + P2P FCFA</div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: React.ReactNode; tone: string }) {
  const tones: Record<string, string> = { violet: "from-violet-500/20 to-fuchsia-500/20 text-violet-300", emerald: "from-emerald-500/20 to-teal-500/20 text-emerald-300", amber: "from-amber-500/20 to-orange-500/20 text-amber-300", teal: "from-teal-500/20 to-cyan-500/20 text-teal-300" };
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`inline-grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br ${tones[tone]} mb-2`}><Icon className="w-4 h-4" /></div>
      <div className="text-2xl font-display font-bold leading-none">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function UpgradeModal({ open, onOpenChange, plans, currentPlanCode }: { open: boolean; onOpenChange: (b: boolean) => void; plans: PlanInfo[]; currentPlanCode: string }) {
  const refreshUser = useApp((s) => s.refreshUser);
  const [loading, setLoading] = useState<string | null>(null);
  const upgrade = async (code: string) => {
    setLoading(code);
    try {
      const res = await fetch("/api/subscription", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planCode: code, billingCycle: "MONTHLY" }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Échec du paiement"); }
      else { toast.success(data.message || "Abonnement activé !"); await refreshUser(); onOpenChange(false); }
    } catch { toast.error("Erreur réseau"); } finally { setLoading(null); }
  };
  const upgradable = plans.filter((p) => p.code !== currentPlanCode && p.priceMonthly > 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-400" /> Passez à la vitesse supérieure</DialogTitle>
          <DialogDescription>Débloquez le temps réel, le P2P FCFA, les notifications push et bien plus. Paiement simulé.</DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          {upgradable.map((plan) => (
            <div key={plan.id} className={`rounded-2xl p-5 ${plan.isPopular ? "glass-strong gradient-border" : "glass"}`}>
              <div className="flex items-center justify-between mb-2"><h3 className="font-display font-bold text-lg">{plan.name}</h3>{plan.isPopular && <Badge className="bg-violet-500/20 text-violet-300">Populaire</Badge>}</div>
              <div className="text-2xl font-bold mb-3">{formatFcfa(plan.priceMonthly, { compact: true })}<span className="text-sm font-normal text-muted-foreground">/mois</span></div>
              <ul className="space-y-1.5 mb-4 text-sm">{plan.features.slice(0, 4).map((f, i) => (<li key={i} className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" /> {f}</li>))}</ul>
              <Button onClick={() => upgrade(plan.code)} disabled={loading === plan.code} className={`w-full border-0 ${plan.isPopular ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white" : "bg-white/10 hover:bg-white/15"}`}>{loading === plan.code ? "Traitement…" : "Choisir"}</Button>
            </div>
          ))}
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Plus tard</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
