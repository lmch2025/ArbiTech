"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  Copy,
  CreditCard,
  Crown,
  Eye,
  Gift,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Trash2,
  User as UserIcon,
  Volume2,
  Zap,
} from "lucide-react";
import { formatFcfa, timeUntil } from "@/lib/format";

/* -------------------------------------------------------------------------- */
/*  Types & helpers                                                           */
/* -------------------------------------------------------------------------- */

type Subscription = {
  id: string;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | string;
  plan: { code: string; name: string };
  billingCycle: "MONTHLY" | "YEARLY" | string;
  amount: number;
  startDate: string;
  endDate: string;
};

type NotifPrefs = {
  push: boolean;
  email: boolean;
  sound: boolean;
};

const NOTIF_KEY = "arbitech_notif_prefs";
const DEFAULT_PREFS: NotifPrefs = { push: true, email: true, sound: false };

function planBadge(code?: string | null) {
  if (code === "PRO")
    return { label: "Pro", className: "bg-violet-500/15 text-violet-200 border-violet-500/30" };
  if (code === "INSTITUTIONNEL")
    return { label: "Institutionnel", className: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30" };
  return { label: "Découverte", className: "bg-teal-500/15 text-teal-200 border-teal-500/30" };
}

function planIcon(code?: string | null) {
  if (code === "PRO") return <Zap className="w-4 h-4" />;
  if (code === "INSTITUTIONNEL") return <Crown className="w-4 h-4" />;
  return <Eye className="w-4 h-4" />;
}

function statusBadge(status: string) {
  if (status === "ACTIVE")
    return { label: "Actif", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" };
  if (status === "CANCELLED")
    return { label: "Annulé", className: "bg-amber-500/15 text-amber-300 border-amber-500/30", dot: "bg-amber-400" };
  if (status === "EXPIRED")
    return { label: "Expiré", className: "bg-rose-500/15 text-rose-300 border-rose-500/30", dot: "bg-rose-400" };
  return { label: status, className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" };
}

function fmtDate(d: string | Date) {
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function initialsOf(s: string) {
  const parts = s.trim().split(/[\s@]+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function daysUntil(d: string | Date) {
  const ms = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/* -------------------------------------------------------------------------- */
/*  Small section header                                                      */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  icon,
  title,
  subtitle,
  accent = "from-violet-500 to-fuchsia-500",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div
        className={`inline-grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg flex-shrink-0`}
      >
        {icon}
      </div>
      <div>
        <h2 className="font-display text-lg sm:text-xl font-bold leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subscription skeleton                                                     */
/* -------------------------------------------------------------------------- */

function SubscriptionSkeleton() {
  return (
    <div className="rounded-2xl p-6 glass animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="h-6 w-32 bg-white/10 rounded-lg" />
        <div className="h-6 w-20 bg-white/10 rounded-full" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main view                                                                 */
/* -------------------------------------------------------------------------- */

export function ProfileView() {
  const user = useApp((s) => s.user);
  const setView = useApp((s) => s.setView);
  const logout = useApp((s) => s.logout);
  const refreshUser = useApp((s) => s.refreshUser);

  /* ---- Profile form ---- */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  /* ---- Password form ---- */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  /* ---- Subscription ---- */
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  /* ---- Notif prefs ---- */
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  /* ---- Delete account dialog ---- */
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isFree = !user?.plan || user.plan.code === "DECOUVERTE";

  /* Hydrate profile fields from user */
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  /* Load subscription */
  const loadSubscription = useCallback(async () => {
    setSubLoading(true);
    try {
      const res = await fetch("/api/subscription");
      const data = await res.json();
      setSubscription(data.subscription ?? null);
    } catch {
      setSubscription(null);
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  /* Load notif prefs from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const updatePref = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    toast.success("Préférence enregistrée.");
  };

  /* ---- Save profile ---- */
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmedName, phone: phone.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Échec de la mise à jour.");
        return;
      }
      toast.success(data.message || "Votre profil a été mis à jour.");
      await refreshUser();
    } catch {
      toast.error("Connexion impossible. Réessayez.");
    } finally {
      setSavingProfile(false);
    }
  };

  /* ---- Change password ---- */
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Échec du changement de mot de passe.");
        return;
      }
      toast.success(data.message || "Votre mot de passe a été changé.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Connexion impossible. Réessayez.");
    } finally {
      setSavingPassword(false);
    }
  };

  /* ---- Cancel subscription ---- */
  const cancelSubscription = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Impossible d'annuler l'abonnement.");
        return;
      }
      toast.success(data.message || "Votre abonnement a été annulé.");
      setCancelOpen(false);
      await refreshUser();
      await loadSubscription();
    } catch {
      toast.error("Connexion impossible. Réessayez.");
    } finally {
      setCancelling(false);
    }
  };

  /* ---- Copy referral link ---- */
  const copyReferral = async () => {
    if (!user) return;
    const link = `${window.location.origin}/?ref=${user.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Lien de parrainage copié !", {
        description: "Partagez-le pour gagner 20% de commission.",
      });
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  /* ---- Logout ---- */
  const handleLogout = async () => {
    toast.success("Vous êtes déconnecté. À bientôt !");
    await logout();
  };

  /* ---- Delete account placeholder ---- */
  const handleDeleteAccount = () => {
    setDeleteOpen(false);
    toast.info("Contactez le support pour supprimer votre compte.", {
      description: "Écrivez à support@arbitech.app — cette action est irréversible.",
    });
  };

  /* ------------------------------------------------------------------------ */
  /*  Gate — not logged in                                                    */
  /* ------------------------------------------------------------------------ */
  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="glass-strong gradient-border glow-soft rounded-3xl p-8 sm:p-12 text-center max-w-md animate-rise">
            <div className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white mb-5 shadow-lg">
              <UserIcon className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold mb-3">
              Connectez-vous à <span className="text-aurora">votre compte</span>
            </h1>
            <p className="text-muted-foreground mb-6">
              Pour gérer votre profil, votre abonnement et vos préférences, veuillez vous
              identifier.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setView("auth")}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
              >
                Se connecter / Créer un compte
              </Button>
              <Button variant="outline" onClick={() => setView("landing")}>
                <ArrowLeft className="w-4 h-4" /> Accueil
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const badge = planBadge(user.plan?.code);
  const initials = initialsOf(user.name || user.email);

  /* ------------------------------------------------------------------------ */
  /*  Main render                                                             */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <button
        onClick={() => setView("landing")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
      </button>

      {/* ---------- Header ---------- */}
      <header className="mb-8 animate-rise">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold mb-2">
          Mon <span className="text-aurora">compte</span>
        </h1>
        <p className="text-muted-foreground mb-6">
          Gérez votre profil, votre sécurité, votre abonnement et vos préférences en toute
          sérénité.
        </p>

        <div className="glass rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-teal-400 text-white text-xl font-bold shadow-lg flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-lg truncate">
                {user.name || "Utilisateur"}
              </span>
              <Badge className={`${badge.className} border`}>
                {planIcon(user.plan?.code)}
                {badge.label}
              </Badge>
              {user.role === "ADMIN" && (
                <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="font-mono bg-white/5 px-2 py-0.5 rounded-md text-foreground">
                {user.referralCode}
              </span>
            </span>
            <span>Code de parrainage</span>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* ---------- 2. Informations personnelles ---------- */}
        <section
          className="glass rounded-2xl p-6 sm:p-7 animate-rise"
          aria-labelledby="profile-section-title"
        >
          <SectionHeader
            icon={<UserIcon className="w-5 h-5" />}
            title="Informations personnelles"
            subtitle="Ces informations apparaissent sur votre compte et dans vos notifications."
            accent="from-violet-500 to-fuchsia-500"
          />
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">
                  Nom complet <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  maxLength={80}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">
                  Téléphone <span className="text-muted-foreground">(optionnel)</span>
                </Label>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  inputMode="tel"
                  maxLength={30}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Adresse email</Label>
              <Input
                id="profile-email"
                value={user.email}
                disabled
                className="opacity-70 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                L&apos;email ne peut pas être modifié. Contactez le support si besoin.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={savingProfile}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" /> Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* ---------- 3. Sécurité — Mot de passe ---------- */}
        <section
          className="glass rounded-2xl p-6 sm:p-7 animate-rise"
          aria-labelledby="security-section-title"
        >
          <SectionHeader
            icon={<KeyRound className="w-5 h-5" />}
            title="Sécurité — Changer le mot de passe"
            subtitle="Choisissez un mot de passe d&apos;au moins 6 caractères."
            accent="from-fuchsia-500 to-rose-500"
          />
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pwd-current">Mot de passe actuel</Label>
              <Input
                id="pwd-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pwd-new">Nouveau mot de passe</Label>
                <Input
                  id="pwd-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd-confirm">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="pwd-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez le nouveau mot de passe"
                  autoComplete="new-password"
                  aria-invalid={
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? true
                      : undefined
                  }
                />
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Les mots de passe ne correspondent pas.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={savingPassword}
                className="bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:from-fuchsia-600 hover:to-rose-600 text-white border-0"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mise à jour…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Changer le mot de passe
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* ---------- 4. Mon abonnement ---------- */}
        <section
          className="glass rounded-2xl p-6 sm:p-7 animate-rise"
          aria-labelledby="subscription-section-title"
        >
          <SectionHeader
            icon={<CreditCard className="w-5 h-5" />}
            title="Mon abonnement"
            subtitle="Gérez votre forfait ArbiTech en quelques clics."
            accent="from-teal-400 to-emerald-500"
          />

          {subLoading ? (
            <SubscriptionSkeleton />
          ) : subscription && subscription.status === "ACTIVE" ? (
            <ActiveSubscriptionCard
              subscription={subscription}
              onCancel={() => setCancelOpen(true)}
            />
          ) : (
            <FreePlanCard
              subscription={subscription}
              onViewPricing={() => setView("pricing")}
            />
          )}
        </section>

        {/* ---------- 5. Préférences de notifications ---------- */}
        <section
          className="glass rounded-2xl p-6 sm:p-7 animate-rise"
          aria-labelledby="notif-section-title"
        >
          <SectionHeader
            icon={<Bell className="w-5 h-5" />}
            title="Préférences de notifications"
            subtitle="Choisissez comment ArbiTech vous informe des opportunités."
            accent="from-amber-400 to-fuchsia-500"
          />
          <div className="space-y-3">
            <NotifRow
              icon={<Bell className="w-4 h-4" />}
              title="Notifications push (opportunités chaudes)"
              description="Recevez une alerte sur votre téléphone dès qu&apos;une opportunité rentable apparaît."
              checked={prefs.push}
              onChecked={(v) => updatePref("push", v)}
              locked={isFree}
              lockedHint="Disponible à partir du plan Pro."
            />
            <Separator />
            <NotifRow
              icon={<Mail className="w-4 h-4" />}
              title="Notifications par email"
              description="Un récapitulatif hebdomadaire de vos opportunités et gains."
              checked={prefs.email}
              onChecked={(v) => updatePref("email", v)}
            />
            <Separator />
            <NotifRow
              icon={<Volume2 className="w-4 h-4" />}
              title="Son à la nouvelle opportunité"
              description="Un petit bip discret à chaque nouvelle opportunité dans le tableau de bord."
              checked={prefs.sound}
              onChecked={(v) => updatePref("sound", v)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
            <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Ces préférences sont stockées sur votre appareil. Les notifications push réelles
            nécessitent le plan Pro ou supérieur.
          </p>
        </section>

        {/* ---------- 6. Programme ambassadeur ---------- */}
        <section
          className="glass rounded-2xl p-6 sm:p-7 animate-rise"
          aria-labelledby="ambassador-section-title"
        >
          <SectionHeader
            icon={<Gift className="w-5 h-5" />}
            title="Programme ambassadeur"
            subtitle="Parrainez vos proches et touchez 20% de commission à chaque abonnement."
            accent="from-fuchsia-500 to-violet-500"
          />
          <div className="rounded-xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-teal-400/10 border border-white/10 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Votre code de parrainage
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-aurora-warm">
                    {user.referralCode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  Lien : {typeof window !== "undefined" ? window.location.origin : ""}/?ref=
                  {user.referralCode}
                </p>
              </div>
              <Button
                onClick={copyReferral}
                variant="outline"
                className="border-white/15 hover:bg-white/10"
              >
                <Copy className="w-4 h-4" /> Copier le lien
              </Button>
            </div>
            <Separator className="my-4" />
            <Button
              onClick={() => setView("ambassador")}
              variant="ghost"
              className="w-full sm:w-auto text-aurora-warm hover:bg-white/5"
            >
              <Sparkles className="w-4 h-4" /> Voir mon tableau ambassadeur
            </Button>
          </div>
        </section>

        {/* ---------- 7. Zone de danger ---------- */}
        <section
          className="glass rounded-2xl p-6 sm:p-7 animate-rise"
          aria-labelledby="danger-section-title"
        >
          <SectionHeader
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Zone de danger"
            subtitle="Déconnexion et gestion du compte."
            accent="from-rose-500 to-amber-500"
          />
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="inline-grid place-items-center w-9 h-9 rounded-lg bg-white/5 text-muted-foreground flex-shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Se déconnecter</p>
                <p className="text-xs text-muted-foreground">
                  Vous pourrez vous reconnecter à tout moment avec votre email et mot de passe.
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white/15 hover:bg-white/10 sm:w-auto"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </Button>
          </div>

          <Separator className="my-5" />

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="inline-grid place-items-center w-9 h-9 rounded-lg bg-rose-500/10 text-rose-300 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-sm text-rose-200">Supprimer mon compte</p>
                <p className="text-xs text-muted-foreground">
                  Action irréversible. Toutes vos données seront effacées.
                </p>
              </div>
            </div>
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <Button
                variant="outline"
                className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 sm:w-auto"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    Supprimer définitivement mon compte
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est <strong className="text-rose-300">irréversible</strong>.
                    Vous perdrez l&apos;accès à votre abonnement, vos filleuls et votre
                    historique. Pour confirmer, veuillez contacter notre support.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    Contacter le support
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>

      {/* ---------- Cancel subscription AlertDialog ---------- */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Annuler votre abonnement ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              En annulant, vous reviendrez immédiatement au <strong>plan Découverte
              gratuit</strong> : les opportunités seront affichées avec 5 minutes de retard,
              sans notifications push ni marché P2P FCFA. Vous pourrez vous réabonner à tout
              moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Garder mon abonnement</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void cancelSubscription();
              }}
              disabled={cancelling}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Annulation…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Oui, annuler
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function ActiveSubscriptionCard({
  subscription,
  onCancel,
}: {
  subscription: Subscription;
  onCancel: () => void;
}) {
  const st = statusBadge(subscription.status);
  const daysLeft = daysUntil(subscription.endDate);
  const isYearly = subscription.billingCycle === "YEARLY";

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-teal-400/10 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="inline-grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
            {planIcon(subscription.plan.code)}
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">
              {subscription.plan.name}
            </p>
            <p className="text-xs text-muted-foreground">Forfait actuel</p>
          </div>
        </div>
        <Badge className={`${st.className} border`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} live-dot`} />
          {st.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <InfoTile
          label="Cycle"
          value={isYearly ? "Annuel" : "Mensuel"}
          icon={<Calendar className="w-3.5 h-3.5" />}
        />
        <InfoTile
          label="Montant"
          value={formatFcfa(subscription.amount, { compact: subscription.amount >= 100000 })}
          icon={<CreditCard className="w-3.5 h-3.5" />}
        />
        <InfoTile
          label="Début"
          value={fmtDate(subscription.startDate)}
          icon={<Calendar className="w-3.5 h-3.5" />}
        />
        <InfoTile
          label="Fin"
          value={fmtDate(subscription.endDate)}
          icon={<Calendar className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-white/5 px-4 py-3 mb-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 live-dot" />
          <span className="text-muted-foreground">Temps restant :</span>
          <span className="font-semibold">
            {daysLeft > 0
              ? `${daysLeft} jour${daysLeft > 1 ? "s" : ""}`
              : "Expire bientôt"}
          </span>
          <span className="text-muted-foreground text-xs">({timeUntil(subscription.endDate)})</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
        >
          Annuler l&apos;abonnement
        </Button>
      </div>
    </div>
  );
}

function FreePlanCard({
  subscription,
  onViewPricing,
}: {
  subscription: Subscription | null;
  onViewPricing: () => void;
}) {
  const past = subscription && subscription.status !== "ACTIVE";
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-teal-500/10 via-violet-500/5 to-transparent p-5 sm:p-6 text-center">
      <div className="inline-grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-lg mb-3">
        <Eye className="w-6 h-6" />
      </div>
      <h3 className="font-display text-lg font-bold mb-1">Vous êtes au plan gratuit</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
        Profitez d&apos;opportunités en temps réel, du marché P2P FCFA et des notifications push
        en passant au plan Pro ou Institutionnel.
      </p>
      {past && subscription && (
        <p className="text-xs text-amber-300/80 mb-4">
          Votre dernier abonnement ({subscription.plan.name}) est{" "}
          {subscription.status === "CANCELLED" ? "annulé" : "expiré"} depuis le{" "}
          {fmtDate(subscription.endDate)}.
        </p>
      )}
      <Button
        onClick={onViewPricing}
        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
      >
        <Sparkles className="w-4 h-4" /> Voir les forfaits
      </Button>
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function NotifRow({
  icon,
  title,
  description,
  checked,
  onChecked,
  locked = false,
  lockedHint,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChecked: (v: boolean) => void;
  locked?: boolean;
  lockedHint?: string;
}) {
  return (
    <div className="flex items-start sm:items-center gap-3 py-2">
      <div className="inline-grid place-items-center w-9 h-9 rounded-lg bg-white/5 text-muted-foreground flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">{title}</p>
          {locked && (
            <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px]">
              <Lock className="w-3 h-3" /> Pro+
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locked && lockedHint ? `${lockedHint} ` : ""}
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChecked} className="flex-shrink-0" />
    </div>
  );
}
