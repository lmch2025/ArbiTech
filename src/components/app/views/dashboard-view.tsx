"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { OpportunityCard } from "@/components/app/opportunity-card";
import { useNotifications } from "@/hooks/use-notifications";
import {
  Zap, Bell, BellOff, BellRing, Filter, Search, RefreshCw, Wifi, WifiOff, TrendingUp, Crown,
  Check, Sparkles, Clock, Lock, Gift, ChevronRight, Activity, X, Volume2, VolumeX,
} from "lucide-react";
import { formatFcfa, formatPercent, timeAgo } from "@/lib/format";
import { toast } from "sonner";
import type { Opportunity, Notification, PlanInfo } from "@/lib/types";

const WS_PORT = 3003;

export function DashboardView() {
  const user = useApp((s) => s.user);
  const plans = useApp((s) => s.plans);
  const platforms = useApp((s) => s.platforms);
  const setView = useApp((s) => s.setView);

  const [ops, setOps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // filters
  const [filterPlatform, setFilterPlatform] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterPair, setFilterPair] = useState<string>("");
  const [minProfit, setMinProfit] = useState<string>("0");
  const [showFilters, setShowFilters] = useState(false);

  // notifications (in-app bell + Web Push natives)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notif = useNotifications();
  // Ref pour accéder à la dernière version de showOpportunity sans reconnecter le socket
  const notifShowRef = useRef(notif.showOpportunity);
  notifShowRef.current = notif.showOpportunity;

  // upgrade modal
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const userPlan = user?.plan;
  const isRealTime = userPlan?.isRealTime ?? false;
  const delaySeconds = userPlan?.delaySeconds ?? 300;

  // REST fallback loader
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
        setOps(data.opportunities);
        setLastUpdate(new Date());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filterPlatform, filterType, filterPair, minProfit]);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    // Build platform lookup for enriching raw WS opportunities (which only carry codes)
    const platformMap = new Map(platforms.map((p) => [p.code, p]));
    const enrich = (op: any): Opportunity => {
      if (op.buyPlatform && op.sellPlatform) return op as Opportunity;
      const buy = platformMap.get(op.buyPlatformCode);
      const sell = platformMap.get(op.sellPlatformCode);
      return {
        ...op,
        buyPlatform: buy
          ? { code: buy.code, name: buy.name, color: buy.color, logo: buy.logo }
          : { code: op.buyPlatformCode, name: op.buyPlatformCode, color: "#7c3aed", logo: "?" },
        sellPlatform: sell
          ? { code: sell.code, name: sell.name, color: sell.color, logo: sell.logo }
          : { code: op.sellPlatformCode, name: op.sellPlatformCode, color: "#c026d3", logo: "?" },
      };
    };

    const socket = io("/?XTransformPort=" + WS_PORT, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("subscribe", { plan: userPlan?.code || "DECOUVERTE" });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("snapshot", (data: { opportunities: any[] }) => {
      if (data.opportunities?.length) {
        setOps((prev) => mergeOps(prev, data.opportunities.map(enrich)));
        setLastUpdate(new Date());
        setLoading(false);
      }
    });

    socket.on("opportunity", (rawOp: any) => {
      const op = enrich(rawOp);
      // Apply plan delay filter client-side: Découverte users see ops with delay
      if (delaySeconds > 0) {
        const age = (Date.now() - new Date(op.createdAt).getTime()) / 1000;
        if (age < delaySeconds) return; // hide too-fresh ops
      }
      // Plan gating: hide ops requiring a higher plan
      if (op.requiresPlan === "PRO" && (userPlan?.code === "DECOUVERTE" || !userPlan)) return;
      if (op.requiresPlan === "INSTITUTIONNEL" && userPlan?.code !== "INSTITUTIONNEL") return;
      if (op.type === "P2P" && !userPlan?.hasP2PFiat) return;

      // Hot opportunity notification (toast in-app + Web Push native si activé)
      if (op.profitPercent >= 3 && userPlan?.hasPush) {
        toast.success(`🔥 Opportunité chaude : ${op.pair} +${op.profitPercent.toFixed(2)}%`, {
          description: `${op.buyPlatform.name} → ${op.sellPlatform.name}`,
        });
        // Notification native (Web Push) — ne s'affiche que si l'onglet est caché
        notifShowRef.current({
          pair: op.pair,
          profit: op.profitPercent,
          buyPlatform: op.buyPlatform.name,
          sellPlatform: op.sellPlatform.name,
        });
      }

      setOps((prev) => mergeOps([op], prev).slice(0, 50));
      setLastUpdate(new Date());
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, userPlan?.code, delaySeconds, userPlan?.hasP2PFiat, userPlan?.hasPush, userPlan, platforms]);

  // REST fallback: load initially and periodically when WS not connected
  useEffect(() => {
    if (!user) return;
    loadFromAPI();
    const interval = setInterval(() => {
      if (!connected) loadFromAPI();
    }, isRealTime ? 4000 : 15000);
    return () => clearInterval(interval);
  }, [user, connected, loadFromAPI, isRealTime]);

  // Re-apply filters when changed (client-side on top of WS data)
  const filteredOps = ops.filter((op) => {
    if (filterPlatform !== "ALL" && op.buyPlatformCode !== filterPlatform && op.sellPlatformCode !== filterPlatform) return false;
    if (filterType !== "ALL" && op.type !== filterType) return false;
    if (filterPair && !op.pair.toLowerCase().includes(filterPair.toLowerCase())) return false;
    if (minProfit && minProfit !== "0" && op.profitPercent < parseFloat(minProfit)) return false;
    return true;
  });

  // Notifications
  const loadNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnread(data.unread);
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [loadNotifs]);

  const markRead = async (id: string) => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  if (!user) return null;

  const planCode = userPlan?.code || "DECOUVERTE";
  const isFree = planCode === "DECOUVERTE" || !userPlan;
  const lockedCount = ops.length === 0 ? 0 : Math.max(0, Math.floor(ops.length * 0.3));

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Bonjour, {user.name?.split(" ")[0] || "ami"} 👋
            </h1>
            <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
              <Crown className="w-3 h-3 mr-1" /> {userPlan?.name || "Découverte"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Voici les opportunités d'arbitrage en direct.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${connected ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? (isRealTime ? "Temps réel" : `Retard ${delaySeconds}s`) : "Reconnexion…"}
          </div>

          {/* Notifications */}
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <button className="relative grid place-items-center w-10 h-10 rounded-full glass hover:glass-strong transition-all" aria-label="Notifications">
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-fuchsia-500 text-white text-[10px] font-bold">
                    {unread}
                  </span>
                )}
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
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <BellRing className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    Aucune notification pour l'instant
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex-col items-start py-2.5 cursor-pointer"
                      onClick={() => !n.read && markRead(n.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-fuchsia-500 flex-shrink-0" />}
                        <span className="font-semibold text-sm flex-1">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 pl-4">{n.body}</p>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Push notifications toggle (Web Push natif) */}
          {notif.mounted && notif.supported && (
            <Button
              variant="outline"
              size="icon"
              className={notif.pushEnabled ? "border-emerald-500/40 text-emerald-400" : ""}
              title={
                !userPlan?.hasPush
                  ? "Notifications push — réservé au plan Pro"
                  : notif.pushEnabled
                    ? "Notifications push activées — cliquez pour désactiver"
                    : "Activer les notifications push (opportunités chaudes)"
              }
              onClick={async () => {
                if (!userPlan?.hasPush) {
                  toast.info("Les notifications push sont réservées au plan Pro.", {
                    description: "Passez au plan Pro pour être prévenu même quand l'app est en arrière-plan.",
                  });
                  setUpgradeOpen(true);
                  return;
                }
                if (notif.pushEnabled) {
                  notif.disablePush();
                  toast.success("Notifications push désactivées.");
                } else {
                  const ok = await notif.enablePush();
                  if (ok) {
                    toast.success("Notifications push activées ! 🎉", {
                      description: "Vous serez prévenu des opportunités chaudes même en arrière-plan.",
                    });
                  } else {
                    toast.error("Permission refusée. Autorisez les notifications dans votre navigateur.");
                  }
                }
              }}
            >
              {notif.pushEnabled ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {!userPlan?.hasPush && <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5" />}
            </Button>
          )}

          {/* Sound toggle */}
          {notif.mounted && notif.pushEnabled && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              title={notif.soundEnabled ? "Désactiver le son" : "Activer le son à la nouvelle opportunité"}
              onClick={notif.toggleSound}
            >
              {notif.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}

          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={loadFromAPI} title="Rafraîchir">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Plan banner for free users */}
      {isFree && (
        <div className="relative overflow-hidden rounded-2xl glass-strong gradient-border p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="relative flex items-start gap-3 flex-1">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-0.5">Vous voyez les opportunités avec {delaySeconds / 60} min de retard</h3>
              <p className="text-sm text-muted-foreground">
                Passez au plan Pro pour le temps réel, le marché P2P FCFA et les notifications push.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setUpgradeOpen(true)}
            className="relative bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 flex-shrink-0"
          >
            <Zap className="w-4 h-4 mr-1" /> Passer au temps réel
          </Button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile icon={Activity} label="Opportunités actives" value={String(filteredOps.length)} tone="violet" />
        <StatTile icon={TrendingUp} label="Profit moyen" value={filteredOps.length ? formatPercent(filteredOps.reduce((s, o) => s + o.profitPercent, 0) / filteredOps.length) : "—"} tone="emerald" />
        <StatTile icon={Zap} label="Meilleur profit" value={filteredOps.length ? formatPercent(Math.max(...filteredOps.map((o) => o.profitPercent))) : "—"} tone="amber" />
        <StatTile icon={Clock} label="Dernière mise à jour" value={lastUpdate ? timeAgo(lastUpdate) : "—"} tone="teal" />
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)} className="lg:hidden">
          <Filter className="w-4 h-4 mr-1" /> Filtres
        </Button>
        <div className={`flex-1 flex items-center gap-2 flex-wrap ${showFilters ? "flex" : "hidden lg:flex"}`}>
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une paire (ex: USDT, BTC)…"
              value={filterPair}
              onChange={(e) => setFilterPair(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-[150px] h-10"><SelectValue placeholder="Plateforme" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les plateformes</SelectItem>
              {platforms.map((p) => (<SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-10"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tout type</SelectItem>
              <SelectItem value="SPOT">Spot</SelectItem>
              <SelectItem value="P2P">P2P · FCFA</SelectItem>
            </SelectContent>
          </Select>
          <Select value={minProfit} onValueChange={setMinProfit}>
            <SelectTrigger className="w-[150px] h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Tous profits</SelectItem>
              <SelectItem value="0.5">≥ 0,5%</SelectItem>
              <SelectItem value="1">≥ 1%</SelectItem>
              <SelectItem value="2">≥ 2%</SelectItem>
              <SelectItem value="3">≥ 3% 🔥</SelectItem>
            </SelectContent>
          </Select>
          {(filterPair || filterPlatform !== "ALL" || filterType !== "ALL" || minProfit !== "0") && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterPair(""); setFilterPlatform("ALL"); setFilterType("ALL"); setMinProfit("0"); }}>
              <X className="w-3.5 h-3.5 mr-1" /> Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Opportunities grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-52 rounded-2xl shimmer bg-muted/30" />)}
        </div>
      ) : filteredOps.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="grid place-items-center w-16 h-16 rounded-full bg-muted/40 mx-auto mb-4">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Aucune opportunité pour ces filtres</h3>
          <p className="text-sm text-muted-foreground mb-4">Essayez d'élargir vos critères, ou patientez : de nouvelles opportunités apparaissent en continu.</p>
          <Button variant="outline" onClick={() => { setFilterPair(""); setFilterPlatform("ALL"); setFilterType("ALL"); setMinProfit("0"); }}>
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOps.map((op, i) => (
            <OpportunityCard key={op.id} op={op} highlight={i === 0 && op.profitPercent >= 2} />
          ))}
        </div>
      )}

      {/* Locked teaser for free users */}
      {isFree && lockedCount > 0 && (
        <div className="mt-6 glass rounded-2xl p-6 text-center border border-violet-500/20">
          <Lock className="w-6 h-6 text-violet-400 mx-auto mb-2" />
          <p className="text-sm font-semibold mb-1">{lockedCount} opportunités en temps réel verrouillées</p>
          <p className="text-xs text-muted-foreground mb-3">Les utilisateurs Pro les voient en direct, sans attendre.</p>
          <Button size="sm" onClick={() => setUpgradeOpen(true)} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
            Débloquer maintenant <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Upgrade modal */}
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} plans={plans} currentPlanCode={planCode} />
    </div>
  );
}

function mergeOps(incoming: Opportunity[], existing: Opportunity[]): Opportunity[] {
  const map = new Map<string, Opportunity>();
  for (const op of existing) map.set(op.id, op);
  for (const op of incoming) map.set(op.id, op);
  // sort by createdAt desc, prune expired
  const now = Date.now();
  return Array.from(map.values())
    .filter((op) => new Date(op.expiresAt).getTime() > now)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

function StatTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    violet: "from-violet-500/20 to-fuchsia-500/20 text-violet-300",
    emerald: "from-emerald-500/20 to-teal-500/20 text-emerald-300",
    amber: "from-amber-500/20 to-orange-500/20 text-amber-300",
    teal: "from-teal-500/20 to-cyan-500/20 text-teal-300",
  };
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`inline-grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br ${tones[tone]} mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
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
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planCode: code, billingCycle: "MONTHLY" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Échec du paiement");
      } else {
        toast.success(data.message || "Abonnement activé !");
        await refreshUser();
        onOpenChange(false);
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(null);
    }
  };

  const upgradable = plans.filter((p) => p.code !== currentPlanCode && p.priceMonthly > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" /> Passez à la vitesse supérieure
          </DialogTitle>
          <DialogDescription>
            Débloquez le temps réel, le P2P FCFA, les notifications push et bien plus.
            Paiement simulé (aucune carte requise pour la démo).
          </DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          {upgradable.map((plan) => (
            <div key={plan.id} className={`rounded-2xl p-5 ${plan.isPopular ? "glass-strong gradient-border" : "glass"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                {plan.isPopular && <Badge className="bg-violet-500/20 text-violet-300">Populaire</Badge>}
              </div>
              <div className="text-2xl font-bold mb-3">{formatFcfa(plan.priceMonthly, { compact: true })}<span className="text-sm font-normal text-muted-foreground">/mois</span></div>
              <ul className="space-y-1.5 mb-4 text-sm">
                {plan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => upgrade(plan.code)}
                disabled={loading === plan.code}
                className={`w-full border-0 ${plan.isPopular ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white" : "bg-white/10 hover:bg-white/15"}`}
              >
                {loading === plan.code ? "Traitement…" : "Choisir"}
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Plus tard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
