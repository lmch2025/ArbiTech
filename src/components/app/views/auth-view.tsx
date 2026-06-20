"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail, Lock, User, Phone, Gift, ArrowRight, ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function AuthView() {
  const authMode = useApp((s) => s.authMode);
  const setAuthMode = useApp((s) => s.setAuthMode);
  const setView = useApp((s) => s.setView);
  const refreshUser = useApp((s) => s.refreshUser);
  const referralCode = useApp((s) => s.referralCode);
  const pendingPlan = useApp((s) => s.pendingPlan);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [ref, setRef] = useState(referralCode || "");
  const [refValid, setRefValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = authMode === "register";

  // Validate referral code on the fly
  useEffect(() => {
    if (!ref) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear validation when code emptied
      setRefValid(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/referral", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ referralCode: ref.toUpperCase() }),
        });
        const data = await res.json();
        setRefValid(!data.error);
      } catch {
        setRefValid(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [ref]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body = isRegister
        ? { name, email, password, phone, referralCode: ref || undefined }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      toast.success(data.message || (isRegister ? "Compte créé !" : "Connexion réussie !"));
      await refreshUser();

      // Route based on pending plan or default
      if (pendingPlan) {
        setView("dashboard");
      } else if (data.user?.role === "ADMIN") {
        setView("admin");
      } else {
        setView("dashboard");
      }
    } catch {
      setError("Connexion impossible. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
      {/* Left: form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <button
            onClick={() => setView("landing")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </button>

          <div className="flex items-center gap-2.5 mb-6">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-teal-400 text-white">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="font-display font-extrabold text-xl">
              <span className="text-aurora">ArbiTech</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-extrabold mb-2">
            {isRegister ? "Créez votre compte gratuit" : "Bon retour parmi nous"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRegister
              ? "Quelques secondes suffisent. Pas de carte bancaire pour commencer."
              : "Connectez-vous pour voir les opportunités en direct."}
          </p>

          {pendingPlan && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/30 p-3 mb-5 flex items-center gap-2">
              <Gift className="w-4 h-4 text-violet-400" />
              <span className="text-sm">Vous avez choisi le plan <strong>{pendingPlan}</strong>. Finalisez votre inscription.</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Votre nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Aïcha Diallo"
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Votre email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="pl-9 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Votre mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  className="pl-9 h-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {isRegister && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Votre numéro WhatsApp (optionnel)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: +237 6XX XXX XXX"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ref">Code de parrainage (optionnel)</Label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="ref"
                      value={ref}
                      onChange={(e) => setRef(e.target.value.toUpperCase())}
                      placeholder="Ex: AICHAB3F"
                      className="pl-9 h-11 uppercase"
                    />
                    {refValid === true && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  {refValid === true && (
                    <p className="text-xs text-emerald-400">Code valide ! Vous serez parrainé.</p>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0 text-base"
            >
              {loading ? "Patientez…" : isRegister ? "Créer mon compte" : "Se connecter"}
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}{" "}
            <button
              onClick={() => {
                setAuthMode(isRegister ? "login" : "register");
                setError(null);
              }}
              className="text-violet-400 hover:text-violet-300 font-medium"
            >
              {isRegister ? "Connectez-vous" : "Créez-en un gratuitement"}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Données chiffrées</span>
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Sans carte bancaire</span>
          </div>

          <div className="mt-6 rounded-xl bg-muted/30 border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Comptes de démonstration :</p>
            <p className="text-xs font-mono">demo@arbitech.app / Demo2025!</p>
            <p className="text-xs font-mono">admin@arbitech.app / ArbiTech2025!</p>
          </div>
        </div>
      </div>

      {/* Right: visual panel */}
      <div className="hidden lg:flex relative overflow-hidden aurora-hero">
        <div className="relative z-10 flex flex-col justify-center p-12 max-w-lg">
          <Badge className="w-fit mb-6 bg-violet-500/20 text-violet-200 border border-violet-500/40">
            <Sparkles className="w-3 h-3 mr-1" /> La chasse aux profits, automatisée
          </Badge>
          <h2 className="font-display text-4xl font-extrabold leading-tight mb-4">
            Pendant que vous dormez, <span className="text-aurora">ArbiTech veille.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Rejoignez la communauté qui transforme les différences de prix entre plateformes en revenus réels.
            Sans jargon. Sans complexité.
          </p>
          <div className="space-y-3">
            {[
              "Opportunités en temps réel sur 4 plateformes",
              "Marché P2P FCFA inclus (Binance, Bybit)",
              "Notifications push sur votre téléphone",
              "Gagnez de l'argent en parrainant vos amis",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 glass rounded-xl p-3">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                  <Check className="w-4 h-4" />
                </span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
