"use client";

import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RTooltip,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Boxes,
  Bot,
  Gift,
  TrendingUp,
  TrendingDown,
  Search,
  MoreVertical,
  Ban,
  CheckCircle2,
  UserCheck,
  Activity,
  Clock,
  AlertTriangle,
  Plus,
  Save,
  RefreshCw,
  Sparkles,
  Coins,
  Eye,
  Zap,
  ShieldCheck,
  Wifi,
  WifiOff,
  AlertCircle,
  Star,
  Palette,
  Rocket,
  Lock,
} from "lucide-react";
import { formatFcfa, formatNumber, timeAgo } from "@/lib/format";
import { planToneClass } from "@/lib/constants";

// ============ Types ============

type Tab = "overview" | "users" | "plans" | "platforms" | "scrapers" | "ambassador";

type Stats = {
  kpis: {
    totalUsers: number;
    activeSubscribers: number;
    conversionRate: number;
    totalRevenue: number;
    monthRevenue: number;
    revenueGrowth: number;
    newUsersThisMonth: number;
    pendingPayouts: number;
  };
  revenueByPlan: RevenueByPlanItem[];
  platformStatus: PlatformStatusItem[];
  recentSignups: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    plan: string | null;
  }[];
};

type RevenueByPlanItem = {
  plan: string;
  code: string;
  subscribers: number;
  revenue: number;
};

type PlatformStatusItem = {
  code: string;
  name: string;
  color?: string;
  status: string;
  latencyMs: number;
  successRate: number;
  lastSyncAt: string;
  pairsCount: number;
  recentSuccess?: number;
  recentErrors?: number;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  status: string;
  role: string;
  referralCode: string;
  createdAt: string;
  plan: { code: string; name: string } | null;
  subscription: { status: string; endDate: string; amount: number } | null;
};

type AdminPlan = {
  id: string;
  code: string;
  name: string;
  tagline: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  delaySeconds: number;
  isRealTime: boolean;
  hasP2PFiat: boolean;
  hasPush: boolean;
  hasVolume: boolean;
  hasVipSupport: boolean;
  hasAllPairs: boolean;
  features: string[];
  accentColor: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
};

type AdminPlatform = {
  id: string;
  code: string;
  name: string;
  logo: string;
  color: string;
  url: string;
  status: string;
  pairsCount: number;
  isActive: boolean;
  latencyMs: number;
  successRate: number;
  lastSyncAt: string;
};

type AmbassadorConfig = {
  id: string;
  commissionType: "PERCENT" | "FIXED";
  commissionValue: number;
  minPayout: number;
  isActive: boolean;
};

// ============ Constants & helpers ============

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "plans", label: "Forfaits", icon: CreditCard },
  { id: "platforms", label: "Plateformes", icon: Boxes },
  { id: "scrapers", label: "Robots espions", icon: Bot },
  { id: "ambassador", label: "Ambassadeurs", icon: Gift },
];

function planBarColor(code: string): string {
  switch (code) {
    case "DECOUVERTE":
      return "#2dd4bf"; // teal
    case "PRO":
      return "#a855f7"; // violet
    case "INSTITUTIONNEL":
      return "#ec4899"; // magenta
    default:
      return "#a855f7";
  }
}

function statusDotClass(status: string): string {
  switch ((status || "").toUpperCase()) {
    case "ONLINE":
      return "bg-emerald-400";
    case "DEGRADED":
      return "bg-amber-400";
    case "OFFLINE":
      return "bg-rose-500";
    default:
      return "bg-muted-foreground";
  }
}

function statusLabel(status: string): string {
  switch ((status || "").toUpperCase()) {
    case "ONLINE":
      return "En ligne";
    case "DEGRADED":
      return "Dégradé";
    case "OFFLINE":
      return "Hors ligne";
    case "ACTIVE":
      return "Actif";
    case "BANNED":
      return "Banni";
    case "PENDING":
      return "En attente";
    default:
      return status || "—";
  }
}

function successRateTone(rate: number): string {
  if (rate >= 95) return "text-emerald-400";
  if (rate >= 80) return "text-amber-400";
  return "text-rose-400";
}

function latencyTone(ms: number): string {
  if (ms <= 150) return "text-emerald-400";
  if (ms <= 400) return "text-amber-400";
  return "text-rose-400";
}

// ============ Small shared components ============

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  growth,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof LayoutDashboard;
  tone: string;
  growth?: number;
  delay?: number;
}) {
  return (
    <div
      className="glass rounded-2xl p-5 animate-rise relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-30 bg-gradient-to-br",
          tone,
        )}
      />
      <div className="flex items-start justify-between relative">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="font-display text-2xl font-extrabold truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={cn(
            "inline-grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br text-white flex-shrink-0",
            tone,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {typeof growth === "number" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {growth >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className={growth >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs mois dernier</span>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status, className }: { status: string; className?: string }) {
  const isOnline = (status || "").toUpperCase() === "ONLINE";
  return (
    <span
      className={cn(
        "inline-block w-2.5 h-2.5 rounded-full",
        statusDotClass(status),
        isOnline && "live-dot",
        className,
      )}
    />
  );
}

function SectionHeader({
  title,
  description,
  icon: Icon,
  onRefresh,
  refreshing,
  action,
}: {
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  onRefresh?: () => void;
  refreshing?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="flex items-start gap-3">
        <div className="inline-grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 text-violet-300">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {action}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="border-white/10 bg-white/5"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1.5", refreshing && "animate-spin")} />
            Actualiser
          </Button>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
}) {
  return (
    <div className="glass rounded-2xl p-10 text-center animate-fade-in">
      <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ============ Revenue chart tooltip ============

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RevenueByPlanItem }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="glass-strong rounded-lg p-3 text-xs space-y-1">
      <p className="font-semibold">{item.plan}</p>
      <p className="text-muted-foreground">
        Revenu :{" "}
        <span className="text-foreground font-medium">
          {formatFcfa(item.revenue, { compact: true })}
        </span>
      </p>
      <p className="text-muted-foreground">
        Abonnés : <span className="text-foreground font-medium">{item.subscribers}</span>
      </p>
    </div>
  );
}

// ============ Overview Section ============

function OverviewSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStats(data as Stats);
    } catch (e) {
      toast.error("Impossible de charger les statistiques.", {
        description: (e as Error).message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <section>
        <SectionHeader
          title="Vue d'ensemble"
          description="Pouls de la plateforme en temps réel"
          icon={LayoutDashboard}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </section>
    );
  }

  if (!stats) {
    return (
      <section>
        <SectionHeader
          title="Vue d'ensemble"
          description="Pouls de la plateforme en temps réel"
          icon={LayoutDashboard}
          onRefresh={fetchStats}
          refreshing={refreshing}
        />
        <EmptyState
          icon={AlertCircle}
          title="Statistiques indisponibles"
          description="Une erreur est survenue lors du chargement. Réessayez."
        />
      </section>
    );
  }

  const k = stats.kpis;

  return (
    <section>
      <SectionHeader
        title="Vue d'ensemble"
        description="Pouls de la plateforme en temps réel"
        icon={LayoutDashboard}
        onRefresh={fetchStats}
        refreshing={refreshing}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="Revenu total"
          value={formatFcfa(k.totalRevenue, { compact: true })}
          sub="Cumulé depuis le lancement"
          icon={Coins}
          tone="from-violet-500 to-fuchsia-500"
          delay={0}
        />
        <KpiCard
          label="Revenu du mois"
          value={formatFcfa(k.monthRevenue, { compact: true })}
          sub="Encaissé ce mois-ci"
          icon={TrendingUp}
          tone="from-fuchsia-500 to-rose-500"
          growth={k.revenueGrowth}
          delay={60}
        />
        <KpiCard
          label="Abonnés actifs"
          value={formatNumber(k.activeSubscribers, 0)}
          sub="Souscriptions en cours"
          icon={UserCheck}
          tone="from-teal-400 to-emerald-500"
          delay={120}
        />
        <KpiCard
          label="Taux de conversion"
          value={`${k.conversionRate.toFixed(1)}%`}
          sub="Inscrits → abonnés"
          icon={Activity}
          tone="from-emerald-400 to-teal-500"
          delay={180}
        />
        <KpiCard
          label="Nouveaux inscrits"
          value={formatNumber(k.newUsersThisMonth, 0)}
          sub="Ce mois-ci"
          icon={Sparkles}
          tone="from-amber-400 to-orange-500"
          delay={240}
        />
        <KpiCard
          label="Paiements en attente"
          value={formatFcfa(k.pendingPayouts, { compact: true })}
          sub="Commissions ambassadeurs"
          icon={Gift}
          tone="from-rose-500 to-fuchsia-500"
          delay={300}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue by plan chart */}
        <Card className="lg:col-span-3 glass rounded-2xl border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-violet-300" />
              Revenu par forfait
            </CardTitle>
            <CardDescription>Répartition des abonnements actifs</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.revenueByPlan.length === 0 ? (
              <div className="h-[260px] grid place-items-center text-sm text-muted-foreground">
                Aucun abonnement actif pour l'instant.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={stats.revenueByPlan}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="plan"
                    stroke="currentColor"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    stroke="currentColor"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatFcfa(v, { compact: true })}
                    className="text-muted-foreground"
                  />
                  <RTooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(168,85,247,0.08)" }}
                  />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={64}>
                    {stats.revenueByPlan.map((entry, i) => (
                      <Cell key={i} fill={planBarColor(entry.code)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent signups */}
        <Card className="lg:col-span-2 glass rounded-2xl border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Inscriptions récentes
            </CardTitle>
            <CardDescription>Les derniers membres à nous avoir rejoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto scroll-elegant">
            {stats.recentSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune inscription récente.
              </p>
            ) : (
              stats.recentSignups.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="inline-grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-white/10 text-sm font-semibold flex-shrink-0">
                    {(s.name || s.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {s.name || "Sans nom"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.plan ? (
                      <Badge
                        variant="secondary"
                        className="bg-white/5 border-white/10 text-xs"
                      >
                        {s.plan}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Gratuit</span>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {timeAgo(s.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform status preview */}
      {stats.platformStatus.length > 0 && (
        <Card className="mt-6 glass rounded-2xl border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-300" />
              État des plateformes
            </CardTitle>
            <CardDescription>Santé des connexions en direct</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.platformStatus.map((p) => (
                <div
                  key={p.code}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <StatusDot status={p.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {statusLabel(p.status)} · {p.pairsCount} paires
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

// ============ Users Section ============

function UserStatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        Actif
      </Badge>
    );
  if (s === "BANNED")
    return (
      <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/30">
        Banni
      </Badge>
    );
  if (s === "PENDING")
    return (
      <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30">
        En attente
      </Badge>
    );
  return <Badge variant="secondary">{status}</Badge>;
}

function SubStatusBadge({ sub }: { sub: AdminUser["subscription"] }) {
  if (!sub)
    return <span className="text-xs text-muted-foreground">Aucune</span>;
  const s = (sub.status || "").toUpperCase();
  if (s === "ACTIVE")
    return (
      <Badge className="bg-teal-500/15 text-teal-300 border border-teal-500/30">
        Actif
      </Badge>
    );
  if (s === "EXPIRED")
    return (
      <Badge variant="secondary" className="bg-white/5">
        Expiré
      </Badge>
    );
  if (s === "CANCELED")
    return (
      <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/30">
        Annulé
      </Badge>
    );
  return <Badge variant="secondary">{sub.status}</Badge>;
}

function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUser;
    action: "ban" | "unban" | "activate";
  } | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setUsers(data.users as AdminUser[]);
    } catch (e) {
      toast.error("Impossible de charger les utilisateurs.", {
        description: (e as Error).message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const confirmAction = async () => {
    if (!pendingAction) return;
    setActing(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pendingAction.user.id,
          action: pendingAction.action,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success(data.message || "Utilisateur mis à jour.");
      setPendingAction(null);
      fetchUsers();
    } catch (e) {
      toast.error("Échec de l'action.", { description: (e as Error).message });
    } finally {
      setActing(false);
    }
  };

  const actionLabel = pendingAction
    ? pendingAction.action === "ban"
      ? "Bannir"
      : pendingAction.action === "unban"
        ? "Débannir"
        : "Activer"
    : "";

  return (
    <section>
      <SectionHeader
        title="Utilisateurs"
        description="Gérez les membres, bannissez les abus, réactivez les comptes"
        icon={Users}
        onRefresh={fetchUsers}
        refreshing={refreshing}
      />

      <div className="glass rounded-2xl border-white/10 overflow-hidden">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-white/5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email ou code de parrainage…"
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="ACTIVE">Actifs</SelectItem>
              <SelectItem value="BANNED">Bannis</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={Users}
              title="Aucun utilisateur trouvé"
              description="Ajustez votre recherche ou votre filtre pour trouver des membres."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="pl-4">Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Forfait</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Compte</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className="border-white/5 hover:bg-white/[0.03]"
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <div className="inline-grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-white/10 text-xs font-semibold flex-shrink-0">
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.name || "Sans nom"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {u.referralCode}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    {u.plan ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "bg-white/5 border-white/10 text-foreground",
                        )}
                      >
                        {u.plan.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Gratuit</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <SubStatusBadge sub={u.subscription} />
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={u.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {timeAgo(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-white/10"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {u.status !== "BANNED" ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setPendingAction({ user: u, action: "ban" })
                            }
                          >
                            <Ban className="w-4 h-4" /> Bannir
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              setPendingAction({ user: u, action: "unban" })
                            }
                          >
                            <CheckCircle2 className="w-4 h-4" /> Débannir
                          </DropdownMenuItem>
                        )}
                        {u.status !== "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              setPendingAction({ user: u, action: "activate" })
                            }
                          >
                            <UserCheck className="w-4 h-4" /> Activer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {users.length} utilisateur{users.length > 1 ? "s" : ""} affiché
        {users.length > 1 ? "s" : ""}.
      </p>

      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(o) => !o && setPendingAction(null)}
      >
        <AlertDialogContent className="glass-strong border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingAction?.action === "ban" ? (
                <Ban className="w-5 h-5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              {actionLabel}{" "}
              {pendingAction?.user.name || pendingAction?.user.email} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action === "ban"
                ? "Cet utilisateur ne pourra plus se connecter ni accéder à la plateforme. L'action est réversible."
                : "Le compte sera réactivé et l'utilisateur pourra de nouveau accéder à la plateforme."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting} className="border-white/10">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={acting}
              onClick={confirmAction}
              className={cn(
                pendingAction?.action === "ban"
                  ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white hover:from-rose-600 hover:to-fuchsia-600"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600",
              )}
            >
              {acting ? "En cours…" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// ============ Plans Section ============

function PlanEditor({
  plan,
  onSaved,
}: {
  plan: AdminPlan;
  onSaved: () => void;
}) {
  const [name, setName] = useState(plan.name);
  const [tagline, setTagline] = useState(plan.tagline);
  const [description, setDescription] = useState(plan.description);
  const [priceMonthly, setPriceMonthly] = useState(String(plan.priceMonthly));
  const [priceYearly, setPriceYearly] = useState(String(plan.priceYearly));
  const [features, setFeatures] = useState(plan.features.join("\n"));
  const [isPopular, setIsPopular] = useState(plan.isPopular);
  const [isActive, setIsActive] = useState(plan.isActive);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync if plan changes externally
  useEffect(() => {
    setName(plan.name);
    setTagline(plan.tagline);
    setDescription(plan.description);
    setPriceMonthly(String(plan.priceMonthly));
    setPriceYearly(String(plan.priceYearly));
    setFeatures(plan.features.join("\n"));
    setIsPopular(plan.isPopular);
    setIsActive(plan.isActive);
    setDirty(false);
  }, [plan]);

  const markDirty = () => setDirty(true);

  const save = async () => {
    setSaving(true);
    try {
      const featuresArray = features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          name,
          tagline,
          description,
          priceMonthly: parseFloat(priceMonthly) || 0,
          priceYearly: parseFloat(priceYearly) || 0,
          features: featuresArray,
          isPopular,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success(data.message || "Forfait mis à jour sans toucher au code.");
      setDirty(false);
      onSaved();
    } catch (e) {
      toast.error("Échec de la mise à jour.", {
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const tone = planToneClass(plan.accentColor);
  const Icon =
    plan.code === "DECOUVERTE"
      ? Eye
      : plan.code === "PRO"
        ? Zap
        : ShieldCheck;

  return (
    <Card className="glass rounded-2xl border-white/10 overflow-hidden">
      <div className={cn("h-1.5 bg-gradient-to-r", tone)} />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "inline-grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br text-white",
                tone,
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">
                {plan.code}
                {plan.isPopular && (
                  <Badge className="ml-2 bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Star className="w-3 h-3 mr-1 fill-amber-300" /> Populaire
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs font-mono">
                {plan.id.slice(0, 8)}…
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor={`popular-${plan.id}`} className="text-xs text-muted-foreground">
                Populaire
              </Label>
              <Switch
                id={`popular-${plan.id}`}
                checked={isPopular}
                onCheckedChange={(v) => {
                  setIsPopular(v);
                  markDirty();
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`active-${plan.id}`} className="text-xs text-muted-foreground">
                Actif
              </Label>
              <Switch
                id={`active-${plan.id}`}
                checked={isActive}
                onCheckedChange={(v) => {
                  setIsActive(v);
                  markDirty();
                }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nom affiché</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markDirty();
              }}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Slogan</Label>
            <Input
              value={tagline}
              onChange={(e) => {
                setTagline(e.target.value);
                markDirty();
              }}
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
            rows={2}
            className="bg-white/5 border-white/10 resize-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Prix mensuel (FCFA)</Label>
            <Input
              type="number"
              value={priceMonthly}
              onChange={(e) => {
                setPriceMonthly(e.target.value);
                markDirty();
              }}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Prix annuel (FCFA)</Label>
            <Input
              type="number"
              value={priceYearly}
              onChange={(e) => {
                setPriceYearly(e.target.value);
                markDirty();
              }}
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">
            Fonctionnalités{" "}
            <span className="text-muted-foreground">(une par ligne)</span>
          </Label>
          <Textarea
            value={features}
            onChange={(e) => {
              setFeatures(e.target.value);
              markDirty();
            }}
            rows={5}
            className="bg-white/5 border-white/10 resize-none text-sm font-mono"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {dirty ? "Modifications non enregistrées" : "À jour"}
          </p>
          <Button
            onClick={save}
            disabled={saving || !dirty}
            className={cn(
              "bg-gradient-to-r text-white border-0",
              dirty
                ? "from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                : "from-white/10 to-white/10",
            )}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PlansSection() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setPlans(data.plans as AdminPlan[]);
    } catch (e) {
      toast.error("Impossible de charger les forfaits.", {
        description: (e as Error).message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return (
    <section>
      <SectionHeader
        title="Forfaits"
        description="Tarifs, slogans et fonctionnalités — modifiables sans toucher au code"
        icon={CreditCard}
        onRefresh={fetchPlans}
        refreshing={refreshing}
      />
      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Aucun forfait configuré"
          description="Les forfaits apparaîtront ici une fois créés dans la base."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {plans.map((p, i) => (
            <div
              key={p.id}
              className="animate-rise"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <PlanEditor plan={p} onSaved={fetchPlans} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============ Platforms Section ============

function PlatformsSection() {
  const [platforms, setPlatforms] = useState<AdminPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New platform form
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newColor, setNewColor] = useState("#a855f7");
  const [adding, setAdding] = useState(false);

  const fetchPlatforms = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/platforms");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setPlatforms(data.platforms as AdminPlatform[]);
    } catch (e) {
      toast.error("Impossible de charger les plateformes.", {
        description: (e as Error).message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const addPlatform = async () => {
    if (!newName.trim() || !newCode.trim()) {
      toast.error("Le nom et le code sont requis.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          code: newCode.trim().toUpperCase(),
          url: newUrl.trim(),
          color: newColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success(data.message || "Plateforme ajoutée.");
      setNewName("");
      setNewCode("");
      setNewUrl("");
      setNewColor("#a855f7");
      fetchPlatforms();
    } catch (e) {
      toast.error("Échec de l'ajout.", { description: (e as Error).message });
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (p: AdminPlatform) => {
    try {
      const res = await fetch("/api/admin/platforms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success(
        `${p.name} ${!p.isActive ? "activée" : "désactivée"}.`,
      );
      fetchPlatforms();
    } catch (e) {
      toast.error("Échec du basculement.", {
        description: (e as Error).message,
      });
    }
  };

  return (
    <section>
      <SectionHeader
        title="Plateformes"
        description="Ajout dynamique de plateformes — sans toucher au code source"
        icon={Boxes}
        onRefresh={fetchPlatforms}
        refreshing={refreshing}
      />

      {/* Add new platform form */}
      <Card className="glass rounded-2xl border-white/10 mb-6 gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="inline-grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
              <Plus className="w-4 h-4" />
            </div>
            Ajouter une plateforme
          </CardTitle>
          <CardDescription>
            Le robot espion démarre automatiquement la surveillance. Aucun
            déploiement nécessaire.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nom</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Bitget"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Code (unique)</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="EX: BITGET"
                className="bg-white/5 border-white/10 font-mono uppercase"
                maxLength={16}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL (optionnel)</Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://www.bitget.com"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Couleur</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                />
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="bg-white/5 border-white/10 font-mono text-xs flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              La couleur sera utilisée dans toute l'interface.
            </p>
            <Button
              onClick={addPlatform}
              disabled={adding}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              <Rocket className="w-4 h-4 mr-1.5" />
              {adding ? "Ajout en cours…" : "Lancer la surveillance"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platforms list */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : platforms.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Aucune plateforme"
          description="Ajoutez votre première plateforme ci-dessus pour démarrer la surveillance."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p, i) => (
            <Card
              key={p.id}
              className={cn(
                "glass rounded-2xl border-white/10 animate-rise overflow-hidden",
                !p.isActive && "opacity-60",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="h-1.5"
                style={{ backgroundColor: p.color }}
              />
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="inline-grid place-items-center w-11 h-11 rounded-xl text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.logo || p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {p.code}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={() => toggleActive(p)}
                  />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <StatusDot status={p.status} />
                  <span className="text-sm font-medium">
                    {statusLabel(p.status)}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-xs text-muted-foreground">
                    {p.pairsCount} paires
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Latence :{" "}
                    <span className={latencyTone(p.latencyMs)}>
                      {p.latencyMs}ms
                    </span>
                  </span>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-300 hover:text-violet-200 hover:underline"
                  >
                    Visiter ↗
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

// ============ Scrapers Section ============

function ScrapersSection() {
  const [summary, setSummary] = useState<PlatformStatusItem[]>([]);
  const [logs, setLogs] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/scraper-logs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSummary((data.summary || []) as PlatformStatusItem[]);
      setLogs(data.logs || []);
    } catch (e) {
      toast.error("Impossible de charger les logs.", {
        description: (e as Error).message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <section>
      <SectionHeader
        title="Robots espions"
        description="Santé des scrapers qui surveillent chaque plateforme en continu"
        icon={Bot}
        onRefresh={fetchLogs}
        refreshing={refreshing}
        action={
          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot mr-1.5" />
            {summary.filter((s) => (s.status || "").toUpperCase() === "ONLINE").length}{" "}
            / {summary.length} en ligne
          </Badge>
        }
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : summary.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Aucun robot espion actif"
          description="Ajoutez des plateformes pour démarrer la surveillance automatique."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {summary.map((s, i) => {
            const success = s.successRate ?? 0;
            const st = (s.status || "").toUpperCase();
            return (
              <Card
                key={s.code}
                className={cn(
                  "glass rounded-2xl border-white/10 animate-rise overflow-hidden",
                  st === "OFFLINE" && "opacity-75",
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="inline-grid place-items-center w-10 h-10 rounded-xl text-white font-bold text-xs flex-shrink-0"
                        style={{ backgroundColor: s.color || "#a855f7" }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {s.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={s.status} />
                      <span className="text-xs font-medium">
                        {statusLabel(s.status)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Taux de succès</span>
                      <span className={cn("font-semibold", successRateTone(success))}>
                        {success.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={success}
                      className={cn(
                        "h-1.5",
                        success >= 95
                          ? "[&>[data-slot=progress-indicator]]:bg-emerald-400"
                          : success >= 80
                            ? "[&>[data-slot=progress-indicator]]:bg-amber-400"
                            : "[&>[data-slot=progress-indicator]]:bg-rose-400",
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white/5 py-2">
                      <p className={cn("text-sm font-bold", latencyTone(s.latencyMs))}>
                        {s.latencyMs}ms
                      </p>
                      <p className="text-[10px] text-muted-foreground">Latence</p>
                    </div>
                    <div className="rounded-lg bg-white/5 py-2">
                      <p className="text-sm font-bold text-emerald-400">
                        {s.recentSuccess ?? "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Succès</p>
                    </div>
                    <div className="rounded-lg bg-white/5 py-2">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          (s.recentErrors ?? 0) > 0
                            ? "text-rose-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {s.recentErrors ?? 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Erreurs</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Dernier sync : {s.lastSyncAt ? timeAgo(s.lastSyncAt) : "—"}
                    </span>
                    <span>{s.pairsCount} paires</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && logs.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          {logs.length} entrées de log récentes disponibles en base.
        </p>
      )}
    </section>
  );
}

// ============ Ambassador Section ============

function AmbassadorSection() {
  const [config, setConfig] = useState<AmbassadorConfig | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commissionType, setCommissionType] = useState<"PERCENT" | "FIXED">(
    "PERCENT",
  );
  const [commissionValue, setCommissionValue] = useState("10");
  const [minPayout, setMinPayout] = useState("5000");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setRefreshing(true);
      const [cfgRes, statsRes] = await Promise.all([
        fetch("/api/admin/ambassador-config"),
        fetch("/api/admin/stats"),
      ]);
      const cfgData = await cfgRes.json();
      if (!cfgRes.ok) throw new Error(cfgData.error || "Erreur");
      const c = cfgData.config as AmbassadorConfig | null;
      setConfig(c);
      if (c) {
        setCommissionType(c.commissionType);
        setCommissionValue(String(c.commissionValue));
        setMinPayout(String(c.minPayout));
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setPendingPayouts(statsData.kpis?.pendingPayouts ?? 0);
      }
    } catch (e) {
      toast.error("Impossible de charger la configuration.", {
        description: (e as Error).message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ambassador-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionType,
          commissionValue: parseFloat(commissionValue) || 0,
          minPayout: parseFloat(minPayout) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setConfig(data.config as AmbassadorConfig);
      toast.success(data.message || "Configuration mise à jour.");
    } catch (e) {
      toast.error("Échec de la mise à jour.", {
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <SectionHeader
        title="Ambassadeurs"
        description="Configurez les commissions et le seuil de paiement"
        icon={Gift}
        onRefresh={fetchAll}
        refreshing={refreshing}
      />

      {loading ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Config form */}
          <Card className="glass rounded-2xl border-white/10 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fuchsia-300" />
                Configuration des commissions
              </CardTitle>
              <CardDescription>
                Modifiez le taux de récompense des ambassadeurs. Les changements
                s'appliquent aux futures conversions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type de commission</Label>
                  <Select
                    value={commissionType}
                    onValueChange={(v) =>
                      setCommissionType(v as "PERCENT" | "FIXED")
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">
                        Pourcentage (% du revenu)
                      </SelectItem>
                      <SelectItem value="FIXED">
                        Montant fixe (FCFA par filleul)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {commissionType === "PERCENT"
                      ? "Valeur (%)"
                      : "Valeur (FCFA)"}
                  </Label>
                  <Input
                    type="number"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Seuil de paiement minimum (FCFA)
                </Label>
                <Input
                  type="number"
                  value={minPayout}
                  onChange={(e) => setMinPayout(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Les ambassadeurs ne peuvent demander un paiement qu'une fois ce
                  seuil atteint.
                </p>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Aperçu de la récompense pour un filleul Pro (15 000 FCFA / mois) :
                </p>
                <p className="font-display text-xl font-extrabold text-aurora-warm">
                  {commissionType === "PERCENT"
                    ? formatFcfa(
                        (15000 * (parseFloat(commissionValue) || 0)) / 100,
                      )
                    : formatFcfa(parseFloat(commissionValue) || 0)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {commissionType === "PERCENT"
                    ? `${commissionValue || 0}% du revenu généré par le filleul`
                    : "Montant fixe par filleul actif"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {config ? "Configuration active" : "Première configuration"}
                </p>
                <Button
                  onClick={save}
                  disabled={saving}
                  className="bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:from-fuchsia-600 hover:to-rose-600 text-white border-0"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending payouts card */}
          <Card className="glass rounded-2xl border-white/10 bg-gradient-to-br from-rose-500/10 to-fuchsia-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="w-4 h-4 text-rose-300" />
                Paiements en attente
              </CardTitle>
              <CardDescription>Total des commissions à verser</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-extrabold text-aurora-warm mb-3">
                {formatFcfa(pendingPayouts, { compact: true })}
              </p>
              <Separator className="mb-3 bg-white/10" />
              <p className="text-xs text-muted-foreground">
                Ces paiements seront traités manuellement. Le seuil minimum
                actuel est de{" "}
                <span className="text-foreground font-medium">
                  {formatFcfa(parseFloat(minPayout) || 0, { compact: true })}
                </span>
                .
              </p>
              {pendingPayouts > 0 && (
                <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-200">
                    Des ambassadeurs attendent leur paiement. Pensez à les traiter
                    rapidement.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

// ============ Main AdminView ============

export function AdminView() {
  const user = useApp((s) => s.user);
  const [tab, setTab] = useState<Tab>("overview");

  // Forbidden / loading state
  if (!user) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="glass rounded-2xl p-10 text-center max-w-md mx-auto">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold mb-2">Accès restreint</h1>
          <p className="text-sm text-muted-foreground">
            Vous devez être connecté pour accéder à l'administration.
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="glass rounded-2xl p-10 text-center max-w-md mx-auto">
          <ShieldCheck className="w-10 h-10 text-rose-300 mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold mb-2">Zone réservée</h1>
          <p className="text-sm text-muted-foreground">
            Cet espace est réservé aux administrateurs. Votre compte n'a pas les
            permissions nécessaires.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Header */}
      <header className="mb-8 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="mb-3 bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/30">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 live-dot mr-1.5" />
              Mode administration
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Centre de <span className="text-aurora">contrôle</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bon retour, {user.name || user.email} — vous pilotez ArbiTech.
            </p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar / tab nav */}
        <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)]">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto scroll-elegant pb-2 lg:pb-0 lg:pr-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                    active
                      ? "glass-strong text-foreground border border-white/10 glow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      active && "text-fuchsia-300",
                    )}
                  />
                  {t.label}
                  {active && (
                    <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-fuchsia-400 live-dot" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          {tab === "overview" && <OverviewSection />}
          {tab === "users" && <UsersSection />}
          {tab === "plans" && <PlansSection />}
          {tab === "platforms" && <PlatformsSection />}
          {tab === "scrapers" && <ScrapersSection />}
          {tab === "ambassador" && <AmbassadorSection />}
        </main>
      </div>
    </div>
  );
}
