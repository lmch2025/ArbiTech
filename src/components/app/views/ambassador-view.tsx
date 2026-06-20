"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Gift,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Twitter,
  Users,
  Wallet,
  TrendingUp,
  Sparkles,
  Star,
  Heart,
  Zap,
  ChevronRight,
  ArrowRight,
  Lock,
  Rocket,
  Target,
  Flame,
  Crown,
  PiggyBank,
  CircleDollarSign,
  UserCheck,
  Clock,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { SHARE_TEXTS } from "@/lib/share-texts";
import { formatFcfa, timeAgo } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Stats = {
  totalReferrals: number;
  activeReferrals: number;
  payingReferrals: number;
  totalEarned: number;
  availablePayout: number;
  minPayout: number;
  commissionType: "PERCENT" | "FIXED";
  commissionValue: number;
};

type Referral = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  status: string;
  plan: string | null;
};

type Earning = {
  id: string;
  amount: number;
  status: "PENDING" | "PAID";
  createdAt: string;
  referredName: string;
};

type AmbassadorData = {
  referralCode: string;
  referralLink: string;
  stats: Stats;
  referrals: Referral[];
  earnings: Earning[];
};

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

// Commission examples (20% of monthly plan price)
const COMMISSION_PRO = 3000; // 20% of 15 000 FCFA
const COMMISSION_INST = 10000; // 20% of 50 000 FCFA

const CATEGORY_META: Record<
  string,
  { label: string; tone: string; icon: typeof Flame }
> = {
  FOMO: { label: "FOMO", tone: "from-fuchsia-500 to-rose-500", icon: Flame },
  EMOTIONAL: { label: "Émotion", tone: "from-violet-500 to-fuchsia-500", icon: Heart },
  SIMPLE: { label: "Simple", tone: "from-teal-400 to-emerald-500", icon: Sparkles },
  FINANCIAL: { label: "Argent", tone: "from-amber-400 to-rose-500", icon: CircleDollarSign },
};

const CATEGORIES = ["ALL", "FOMO", "EMOTIONAL", "SIMPLE", "FINANCIAL"] as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function buildShareUrl(
  channel: "whatsapp" | "telegram" | "twitter",
  text: string,
  link: string,
): string {
  const full = `${text}\n\n${link}`;
  if (channel === "whatsapp")
    return `https://wa.me/?text=${encodeURIComponent(full)}`;
  if (channel === "telegram")
    return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(full)}`;
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(3, name.length - 2))}@${domain}`;
}

function displayName(r: Referral): string {
  if (r.name && r.name.trim().length > 0) return r.name;
  return maskEmail(r.email);
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/* ------------------------------------------------------------------ */
/* Section: Stat card                                                  */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  delay,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
  tone: string;
  delay: number;
}) {
  return (
    <div
      className="glass rounded-2xl p-5 animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {label}
          </p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold mt-1 truncate">
            {value}
          </p>
          {hint && (
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          )}
        </div>
        <div
          className={`grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br ${tone} text-white flex-shrink-0 shadow-lg`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Share buttons row                                          */
/* ------------------------------------------------------------------ */

function ShareButtons({
  text,
  link,
  size = "default",
}: {
  text: string;
  link: string;
  size?: "default" | "sm";
}) {
  const open = (channel: "whatsapp" | "telegram" | "twitter") => {
    window.open(buildShareUrl(channel, text, link), "_blank", "noopener,noreferrer");
    toast.success("Merci de partager ArbiTech ! 💜");
  };
  const btn =
    size === "sm"
      ? "h-8 w-8 has-[>svg]:px-0"
      : "h-10 px-4";
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => open("whatsapp")}
        className={`bg-emerald-500 hover:bg-emerald-600 text-white border-0 ${btn}`}
        size={size === "sm" ? "icon" : "default"}
        title="Partager sur WhatsApp"
      >
        <MessageCircle className={size === "sm" ? "w-4 h-4" : "w-4 h-4 mr-2"} />
        {size === "default" && "WhatsApp"}
      </Button>
      <Button
        onClick={() => open("telegram")}
        className={`bg-teal-500 hover:bg-teal-600 text-white border-0 ${btn}`}
        size={size === "sm" ? "icon" : "default"}
        title="Partager sur Telegram"
      >
        <Send className={size === "sm" ? "w-4 h-4" : "w-4 h-4 mr-2"} />
        {size === "default" && "Telegram"}
      </Button>
      <Button
        onClick={() => open("twitter")}
        className={`bg-foreground/90 hover:bg-foreground text-background border-0 ${btn}`}
        size={size === "sm" ? "icon" : "default"}
        title="Partager sur Twitter / X"
      >
        <Twitter className={size === "sm" ? "w-4 h-4" : "w-4 h-4 mr-2"} />
        {size === "default" && "Twitter"}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section: Copy button                                                */
/* ------------------------------------------------------------------ */

function CopyButton({
  value,
  label = "Copier",
  copiedLabel = "Copié",
  className,
  size = "sm",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copié dans le presse-papiers ✨");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Impossible de copier. Essayez manuellement.");
    }
  };
  return (
    <Button
      onClick={onCopy}
      variant={copied ? "secondary" : "secondary"}
      size={size}
      className={className}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      <span>{copied ? copiedLabel : label}</span>
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function AmbassadorView() {
  const user = useApp((s) => s.user);
  const setView = useApp((s) => s.setView);
  const setAuthMode = useApp((s) => s.setAuthMode);
  const setShareOpen = useApp((s) => s.setShareOpen);

  const [data, setData] = useState<AmbassadorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Share gallery state
  const [activeCategory, setActiveCategory] =
    useState<(typeof CATEGORIES)[number]>("ALL");
  const [surpriseIdx, setSurpriseIdx] = useState<number | null>(null);

  // Calculator state
  const [proCount, setProCount] = useState(5);
  const [instCount, setInstCount] = useState(2);

  const isLoggedIn = !!user;

  /* ---- Referral link & code ---- */
  const referralCode = useMemo(() => {
    if (user?.referralCode) return user.referralCode;
    if (data?.referralCode) return data.referralCode;
    return "DECOUVRIR";
  }, [user, data]);

  const referralLink = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/?ref=${referralCode}`;
    }
    return `https://arbitech.app/?ref=${referralCode}`;
  }, [referralCode]);

  /* ---- Fetch ambassador data ---- */
  const loadData = useCallback(async () => {
    if (!user) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ambassador/me", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---- Filtered share texts ---- */
  const filteredTexts = useMemo(() => {
    const list =
      activeCategory === "ALL"
        ? SHARE_TEXTS
        : SHARE_TEXTS.filter((t) => t.category === activeCategory);
    return list.map((t, i) => ({ ...t, idx: i }));
  }, [activeCategory]);

  const surprise = useCallback(() => {
    const idx = Math.floor(Math.random() * SHARE_TEXTS.length);
    setSurpriseIdx(idx);
    setActiveCategory("ALL");
    // scroll into view
    setTimeout(() => {
      const el = document.getElementById(`share-text-${idx}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-violet-400/70");
      setTimeout(() => el?.classList.remove("ring-2", "ring-violet-400/70"), 2200);
    }, 80);
  }, []);

  /* ---- Claim payout ---- */
  const claimPayout = async () => {
    if (!data) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/ambassador/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim" }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message ?? "Demande de paiement enregistrée 🎉");
        await loadData();
      } else {
        toast.error(json?.error ?? json?.message ?? "Impossible de réclamer le paiement.");
      }
    } catch {
      toast.error("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setClaiming(false);
    }
  };

  /* ---- Navigation helpers ---- */
  const goRegister = () => {
    setAuthMode("register");
    setView("auth");
  };
  const goDashboard = () => setView("dashboard");

  /* ---- Calculator potential ---- */
  const potential = proCount * COMMISSION_PRO + instCount * COMMISSION_INST;

  const stats = data?.stats;
  const progressPct = stats
    ? Math.min(100, Math.round((stats.availablePayout / stats.minPayout) * 100))
    : 0;
  const canClaim = !!stats && stats.availablePayout >= stats.minPayout;
  const remainingToClaim = stats
    ? Math.max(0, stats.minPayout - stats.availablePayout)
    : 0;

  return (
    <div className="flex flex-col">
      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden aurora-hero">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-24">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-rise">
            <button
              onClick={() => setView("landing")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Retour à l&apos;accueil
            </button>

            <Badge className="mx-auto gap-1.5 bg-violet-500/15 text-violet-200 border border-violet-500/30 px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot" />
              Programme ouvert à tous · sans abonnement
            </Badge>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Partagez ArbiTech,
              <br />
              <span className="text-aurora">changez des vies</span>
              <br />
              <span className="text-aurora-warm">(dont la vôtre).</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Devenez ambassadeur en un clic. Partagez votre lien, et{" "}
              <strong className="text-foreground">touchez 20 % de commission</strong>{" "}
              à chaque ami qui s&apos;abonne.{" "}
              <strong className="text-foreground">Aucun abonnement requis</strong>{" "}
              pour commencer à gagner.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={() =>
                  document
                    .getElementById("referral-link")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-teal-400 text-white border-0 h-12 px-7 text-base glow-soft hover:scale-[1.02] transition-transform"
              >
                <Gift className="w-5 h-5 mr-2" /> Récupérer mon lien
              </Button>
              {!isLoggedIn && (
                <Button
                  onClick={goRegister}
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 text-base border-white/15 bg-white/5 hover:bg-white/10"
                >
                  <Sparkles className="w-5 h-5 mr-2 text-violet-400" />
                  Créer un compte gratuit
                </Button>
              )}
              {isLoggedIn && (
                <Button
                  onClick={() =>
                    document
                      .getElementById("dashboard-section")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 text-base border-white/15 bg-white/5 hover:bg-white/10"
                >
                  <Wallet className="w-5 h-5 mr-2 text-emerald-400" />
                  Voir mes gains
                </Button>
              )}
            </div>

            {/* mini trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Ouvert aux visiteurs
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Paiement dès 5 000 FCFA
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Commission à vie
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 space-y-16 sm:space-y-20">
        {/* ============================================================ */}
        {/* HOW IT WORKS                                                 */}
        {/* ============================================================ */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="bg-teal-500/15 text-teal-200 border border-teal-500/30 mb-3">
              <Zap className="w-3 h-3 mr-1" /> Comment ça marche
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
              Trois étapes, <span className="text-aurora">des milliers de FCFA</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Aussi simple qu&apos;une recette de cuisine. Aucune compétence technique requise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Share2,
                tone: "from-violet-500 to-fuchsia-500",
                step: "01",
                title: "Vous partagez votre lien",
                desc: "Un lien unique, partout : WhatsApp, Telegram, Twitter, status, groupes. On vous fournit même les messages prêts à coller.",
              },
              {
                icon: UserCheck,
                tone: "from-fuchsia-500 to-rose-500",
                step: "02",
                title: "Vos amis s'inscrivent & s'abonnent",
                desc: "Quand un ami crée son compte via votre lien puis passe à un forfait Pro ou Institutionnel, la magie opère.",
              },
              {
                icon: PiggyBank,
                tone: "from-teal-400 to-emerald-500",
                step: "03",
                title: "Vous touchez 20 %",
                desc: "3 000 FCFA par ami Pro, 10 000 FCFA par ami Institutionnel. Cumulés. Sans limite. À vie.",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 relative overflow-hidden animate-rise"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="absolute -top-2 -right-2 font-display text-7xl font-black text-white/5 select-none">
                  {s.step}
                </span>
                <div
                  className={`grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br ${s.tone} text-white mb-4 shadow-lg`}
                >
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* CALCULATOR                                                   */}
        {/* ============================================================ */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="bg-amber-500/15 text-amber-200 border border-amber-500/30 mb-3">
              <TrendingUp className="w-3 h-3 mr-1" /> Simulateur de gains
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
              Voyez votre <span className="text-aurora-warm">potentiel</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Faites glisser les curseurs et rêvez un peu. La réalité pourrait vous surprendre.
            </p>
          </div>

          <div className="glass-strong gradient-border rounded-3xl p-6 sm:p-10 glow-soft">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Amis au forfait Pro</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFcfa(COMMISSION_PRO)} / ami
                        </p>
                      </div>
                    </div>
                    <span className="font-display text-2xl font-extrabold text-aurora">
                      {proCount}
                    </span>
                  </div>
                  <Slider
                    value={[proCount]}
                    min={0}
                    max={50}
                    step={1}
                    onValueChange={(v) => setProCount(v[0] ?? 0)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Amis Institutionnels</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFcfa(COMMISSION_INST)} / ami
                        </p>
                      </div>
                    </div>
                    <span className="font-display text-2xl font-extrabold text-aurora-warm">
                      {instCount}
                    </span>
                  </div>
                  <Slider
                    value={[instCount]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={(v) => setInstCount(v[0] ?? 0)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl bg-muted/40 border border-border p-3">
                    <p className="text-xs text-muted-foreground">Par ami Pro</p>
                    <p className="font-display text-lg font-bold text-violet-300">
                      {formatFcfa(COMMISSION_PRO)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border p-3">
                    <p className="text-xs text-muted-foreground">Par ami Institutionnel</p>
                    <p className="font-display text-lg font-bold text-fuchsia-300">
                      {formatFcfa(COMMISSION_INST)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="relative rounded-2xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-teal-500/15 border border-white/10 p-8 text-center overflow-hidden">
                <div className="absolute inset-0 aurora-hero opacity-40 pointer-events-none" />
                <div className="relative space-y-3">
                  <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
                    Votre potentiel mensuel
                  </p>
                  <p className="font-display text-5xl sm:text-6xl font-black text-aurora leading-tight">
                    {formatFcfa(potential, { compact: potential >= 1_000_000 })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {proCount + instCount === 0
                      ? "Faites glisser un curseur pour commencer 🎁"
                      : `Avec ${proCount + instCount} filleul${proCount + instCount > 1 ? "s" : ""} actif${proCount + instCount > 1 ? "s" : ""}, renouvelé chaque mois`}
                  </p>
                  <Separator className="my-4 bg-white/10" />
                  <p className="text-xs text-muted-foreground">
                    Soit {formatFcfa(potential * 12, { compact: true })} sur un an.
                    De quoi changer de vie. 💜
                  </p>
                  <Button
                    onClick={() =>
                      document
                        .getElementById("referral-link")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 mt-3"
                  >
                    <Rocket className="w-4 h-4 mr-2" /> Je me lance
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* REFERRAL LINK CARD                                           */}
        {/* ============================================================ */}
        <section id="referral-link" className="space-y-6 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="bg-violet-500/15 text-violet-200 border border-violet-500/30 mb-3">
              <Gift className="w-3 h-3 mr-1" /> Votre lien unique
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
              Votre lien, <span className="text-aurora">votre trésor</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Partagez-le partout. Chaque inscription via ce lien est automatiquement rattachée à vous.
            </p>
          </div>

          <div className="glass-strong gradient-border rounded-3xl p-6 sm:p-8 glow-soft">
            <div className="flex flex-col gap-5">
              {/* Code + link */}
              <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-center">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 px-6 py-4">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Code
                  </span>
                  <span className="font-mono font-bold text-xl text-aurora tracking-wider">
                    {referralCode}
                  </span>
                </div>
                <div className="space-y-2 min-w-0">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Lien de parrainage
                  </label>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border p-2 pl-3">
                    <code className="flex-1 text-sm truncate font-mono">{referralLink}</code>
                    <CopyButton value={referralLink} label="Copier le lien" />
                  </div>
                </div>
              </div>

              {/* Quick share */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Partager rapidement
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <ShareButtons text={SHARE_TEXTS[0].text} link={referralLink} />
                  <Button
                    variant="outline"
                    onClick={() => setShareOpen(true)}
                    className="border-white/15 bg-white/5 hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Plus d&apos;options
                  </Button>
                </div>
              </div>

              {/* Guest nudge */}
              {!isLoggedIn && (
                <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-fuchsia-500/10 border border-amber-500/20 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="grid place-items-center w-11 h-11 rounded-xl bg-amber-500/20 text-amber-300 flex-shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      Ce lien est un aperçu. Créez un compte pour avoir le vôtre.
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vous suivrez vos filleuls, vos gains et réclamerez vos paiements en temps réel.
                    </p>
                  </div>
                  <Button
                    onClick={goRegister}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 flex-shrink-0"
                  >
                    Créer mon compte <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SHARE MESSAGES GALLERY                                       */}
        {/* ============================================================ */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <Badge className="bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/30 mb-3">
                <Heart className="w-3 h-3 mr-1" /> Messages prêts à l&apos;emploi
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
                Des mots qui <span className="text-aurora">touchent</span>
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                On a écrit pour vous les meilleurs messages. Choisissez par thème, copiez, partagez.
                Votre entourage va adorer.
              </p>
            </div>
            <Button
              onClick={surprise}
              variant="outline"
              className="border-white/15 bg-white/5 hover:bg-white/10 self-start sm:self-end"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-300" /> Surprise-moi
            </Button>
          </div>

          {/* Category tabs */}
          <Tabs
            value={activeCategory}
            onValueChange={(v) => setActiveCategory(v as (typeof CATEGORIES)[number])}
          >
            <TabsList className="flex flex-wrap h-auto bg-muted/40 border border-border p-1 gap-1">
              {CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
                >
                  {cat === "ALL" ? "Tous" : CATEGORY_META[cat]?.label ?? cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Grid of share texts */}
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredTexts.map((t, i) => {
              const meta = CATEGORY_META[t.category] ?? CATEGORY_META.SIMPLE;
              const isSurprise = surpriseIdx === t.idx;
              return (
                <div
                  key={`${t.idx}-${i}`}
                  id={`share-text-${t.idx}`}
                  className={`glass rounded-2xl p-5 flex flex-col gap-3 transition-all scroll-mt-20 ${
                    isSurprise ? "ring-2 ring-violet-400/70" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      className={`bg-gradient-to-r ${meta.tone} text-white border-0 gap-1`}
                    >
                      <meta.icon className="w-3 h-3" /> {meta.label}
                    </Badge>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.channel === "ALL" ? "Tous canaux" : t.channel}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed italic flex-1">&ldquo;{t.text}&rdquo;</p>
                  <Separator className="bg-white/5" />
                  <div className="flex flex-wrap items-center gap-2">
                    <CopyButton
                      value={`${t.text}\n\n${referralLink}`}
                      label="Copier"
                      copiedLabel="Copié"
                    />
                    <ShareButtons text={t.text} link={referralLink} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* DASHBOARD / GUEST CTA                                        */}
        {/* ============================================================ */}
        <section id="dashboard-section" className="space-y-8 scroll-mt-20">
          {!isLoggedIn ? (
            /* ---- Guest CTA ---- */
            <div className="glass-strong gradient-border rounded-3xl p-8 sm:p-12 text-center glow-soft relative overflow-hidden">
              <div className="absolute inset-0 aurora-hero opacity-40 pointer-events-none" />
              <div className="relative space-y-5 max-w-xl mx-auto">
                <div className="grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-teal-400 text-white mx-auto shadow-xl animate-float">
                  <Gift className="w-8 h-8" />
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
                  Suivez vos filleuls et vos gains <span className="text-aurora">en temps réel</span>
                </h2>
                <p className="text-muted-foreground">
                  Créez un compte gratuit pour débloquer votre tableau ambassadeur : statistiques,
                  liste de vos filleuls, historique des gains et demande de paiement.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    onClick={goRegister}
                    className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-teal-400 text-white border-0 h-12 px-7 text-base glow-soft hover:scale-[1.02] transition-transform"
                  >
                    <Sparkles className="w-5 h-5 mr-2" /> Créer mon compte gratuit
                  </Button>
                  <Button
                    onClick={() => setView("auth")}
                    variant="outline"
                    className="h-12 px-7 text-base border-white/15 bg-white/5 hover:bg-white/10"
                  >
                    J&apos;ai déjà un compte
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Sans engagement. Vos données restent privées. Vous gardez le contrôle.
                </p>
              </div>
            </div>
          ) : loading ? (
            /* ---- Loading skeleton ---- */
            <DashboardSkeleton />
          ) : (
            /* ---- Full dashboard ---- */
            <>
              {/* Stats grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot" /> Tableau ambassadeur
                  </Badge>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                  <StatCard
                    icon={Users}
                    label="Filleuls"
                    value={String(stats?.totalReferrals ?? 0)}
                    hint="Total inscrits"
                    tone="from-violet-500 to-fuchsia-500"
                    delay={0}
                  />
                  <StatCard
                    icon={UserCheck}
                    label="Actifs"
                    value={String(stats?.activeReferrals ?? 0)}
                    hint="Comptes actifs"
                    tone="from-fuchsia-500 to-rose-500"
                    delay={60}
                  />
                  <StatCard
                    icon={Star}
                    label="Payants"
                    value={String(stats?.payingReferrals ?? 0)}
                    hint="Avec abonnement"
                    tone="from-amber-400 to-rose-500"
                    delay={120}
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Gains totaux"
                    value={formatFcfa(stats?.totalEarned ?? 0, { compact: true })}
                    hint="Depuis le début"
                    tone="from-teal-400 to-emerald-500"
                    delay={180}
                  />
                  <StatCard
                    icon={Wallet}
                    label="Disponible"
                    value={formatFcfa(stats?.availablePayout ?? 0, { compact: true })}
                    hint={`Seuil : ${formatFcfa(stats?.minPayout ?? 5000, { compact: true })}`}
                    tone="from-emerald-400 to-teal-500"
                    delay={240}
                  />
                </div>

                {/* Claim / progress card */}
                <div className="glass-strong rounded-2xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`grid place-items-center w-12 h-12 rounded-2xl text-white flex-shrink-0 ${
                          canClaim
                            ? "bg-gradient-to-br from-emerald-400 to-teal-500 animate-pulse-glow"
                            : "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                        }`}
                      >
                        {canClaim ? <PartyPopper className="w-6 h-6" /> : <PiggyBank className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {canClaim
                            ? "Vous pouvez réclamer votre paiement 🎉"
                            : "Encore un effort, vous y êtes presque !"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {canClaim
                            ? `${formatFcfa(stats?.availablePayout ?? 0)} disponibles dès maintenant.`
                            : `Plus que ${formatFcfa(remainingToClaim)} avant de pouvoir réclamer.`}
                        </p>
                        <div className="mt-3 max-w-md">
                          <Progress value={progressPct} className="h-2.5" />
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {progressPct}% du seuil de {formatFcfa(stats?.minPayout ?? 5000)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={claimPayout}
                      disabled={!canClaim || claiming}
                      className={`h-12 px-7 text-base flex-shrink-0 border-0 ${
                        canClaim
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:scale-[1.02] transition-transform glow-soft"
                          : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {claiming ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Traitement…
                        </>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5 mr-2" /> Réclamer mon paiement
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Referrals list + Earnings history */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Referrals */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-violet-400" />
                      <h3 className="font-display text-lg font-bold">Vos filleuls</h3>
                    </div>
                    <Badge variant="secondary" className="bg-muted/60">
                      {data?.referrals.length ?? 0}
                    </Badge>
                  </div>

                  {(!data || data.referrals.length === 0) && (
                    <div className="rounded-xl bg-muted/30 border border-dashed border-white/10 p-8 text-center">
                      <div className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300 mx-auto mb-3">
                        <Gift className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-sm">Vous n&apos;avez pas encore de filleuls.</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        Partagez votre lien, vos premiers filleuls apparaîtront ici.
                      </p>
                      <Button
                        onClick={() =>
                          document
                            .getElementById("referral-link")
                            ?.scrollIntoView({ behavior: "smooth", block: "center" })
                        }
                        size="sm"
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0"
                      >
                        <Share2 className="w-4 h-4 mr-1" /> Partager mon lien
                      </Button>
                    </div>
                  )}

                  {data && data.referrals.length > 0 && (
                    <ul className="space-y-2 max-h-[420px] overflow-y-auto scroll-elegant pr-1">
                      {data.referrals.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border/60 p-3"
                        >
                          <div className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-violet-200 font-semibold text-sm flex-shrink-0">
                            {initials(displayName(r)) || "•"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{displayName(r)}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {timeAgo(r.createdAt)}
                              {r.plan && (
                                <>
                                  <span>·</span>
                                  <span className="text-fuchsia-300">{r.plan}</span>
                                </>
                              )}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              r.status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-muted/60 text-muted-foreground"
                            }
                          >
                            {r.status === "ACTIVE" ? "Actif" : r.status === "PENDING" ? "En attente" : r.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Earnings history */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-display text-lg font-bold">Historique des gains</h3>
                    </div>
                    <Badge variant="secondary" className="bg-muted/60">
                      {data?.earnings.length ?? 0}
                    </Badge>
                  </div>

                  {(!data || data.earnings.length === 0) && (
                    <div className="rounded-xl bg-muted/30 border border-dashed border-white/10 p-8 text-center">
                      <div className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-300 mx-auto mb-3">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-sm">Aucun gain pour l&apos;instant.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vos commissions apparaîtront ici dès qu&apos;un filleul s&apos;abonnera.
                      </p>
                    </div>
                  )}

                  {data && data.earnings.length > 0 && (
                    <ul className="space-y-2 max-h-[420px] overflow-y-auto scroll-elegant pr-1">
                      {data.earnings.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border/60 p-3"
                        >
                          <div
                            className={`grid place-items-center w-10 h-10 rounded-full flex-shrink-0 ${
                              e.status === "PAID"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {e.status === "PAID" ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {e.referredName ?? "Filleul"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {timeAgo(e.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-sm font-bold text-emerald-300">
                              +{formatFcfa(e.amount, { compact: e.amount >= 100000 })}
                            </p>
                            <Badge
                              variant="secondary"
                              className={
                                e.status === "PAID"
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              }
                            >
                              {e.status === "PAID" ? "Payé" : "En attente"}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Commission info */}
              {stats && (
                <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 text-amber-300 flex-shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">
                    Votre commission :{" "}
                    <strong className="text-foreground">
                      {stats.commissionType === "PERCENT"
                        ? `${stats.commissionValue}%`
                        : formatFcfa(stats.commissionValue)}
                    </strong>{" "}
                    sur chaque filleul qui s&apos;abonne. Cumulez sans limite, réclamez dès{" "}
                    <strong className="text-foreground">{formatFcfa(stats.minPayout)}</strong>.
                  </p>
                  <Button
                    onClick={goDashboard}
                    variant="outline"
                    size="sm"
                    className="border-white/15 bg-white/5 hover:bg-white/10 flex-shrink-0"
                  >
                    Aller au dashboard <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ============================================================ */}
        {/* FINAL CTA                                                    */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden rounded-3xl glass-strong gradient-border p-8 sm:p-12 text-center glow-soft">
          <div className="absolute inset-0 aurora-hero opacity-50 pointer-events-none" />
          <div className="relative space-y-5 max-w-2xl mx-auto">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-teal-400 text-white mx-auto shadow-xl animate-float">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
              Une dernière chance de faire partie de l&apos;<span className="text-aurora">aventure</span>
            </h2>
            <p className="text-muted-foreground">
              Chaque lien partagé est une graine plantée. Arrosez-la, et regardez vos gains grandir.
              On est avec vous à chaque étape. 💜
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <Button
                onClick={() =>
                  document
                    .getElementById("referral-link")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-teal-400 text-white border-0 h-12 px-7 text-base glow-soft hover:scale-[1.02] transition-transform"
              >
                <Share2 className="w-5 h-5 mr-2" /> Partager maintenant
              </Button>
              {!isLoggedIn && (
                <Button
                  onClick={goRegister}
                  variant="outline"
                  className="h-12 px-7 text-base border-white/15 bg-white/5 hover:bg-white/10"
                >
                  Créer mon compte <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard skeleton                                                  */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48 rounded-full bg-muted/50" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-muted/40" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-2xl bg-muted/40" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-2xl bg-muted/40" />
        <Skeleton className="h-80 rounded-2xl bg-muted/40" />
      </div>
    </div>
  );
}
