"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Eye, Zap, ShieldCheck, ArrowLeft, Sparkles, HelpCircle } from "lucide-react";
import { formatFcfa } from "@/lib/format";
import { planToneClass } from "@/lib/constants";

export function PricingView() {
  const plans = useApp((s) => s.plans);
  const user = useApp((s) => s.user);
  const setView = useApp((s) => s.setView);
  const setAuthMode = useApp((s) => s.setAuthMode);
  const setPendingPlan = useApp((s) => s.setPendingPlan);

  const choose = (code: string) => {
    setPendingPlan(code as never);
    if (user) setView("dashboard");
    else {
      setAuthMode("register");
      setView("auth");
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <button
        onClick={() => setView("landing")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </button>

      <div className="text-center max-w-2xl mx-auto mb-12">
        <Badge className="mb-4 bg-amber-500/15 text-amber-200 border border-amber-500/30">
          <Star className="w-3 h-3 mr-1" /> Forfaits simples et transparents
        </Badge>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-4">
          Choisissez votre <span className="text-aurora">niveau de jeu</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Commencez gratuitement. Passez à la vitesse supérieure quand vous êtes prêt.
          Sans engagement, annulez quand vous voulez.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
        {plans.map((plan) => {
          const tone = planToneClass(plan.accentColor);
          const current = user?.plan?.code === plan.code;
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col ${
                plan.isPopular ? "glass-strong gradient-border glow-soft md:scale-[1.03]" : "glass"
              }`}
            >
              {plan.isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 px-4 py-1">
                  <Star className="w-3 h-3 mr-1 fill-white" /> Le plus populaire
                </Badge>
              )}
              <div className={`inline-grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br ${tone} text-white mb-4`}>
                {plan.code === "DECOUVERTE" ? <Eye className="w-6 h-6" /> : plan.code === "PRO" ? <Zap className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <h3 className="font-display text-2xl font-extrabold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.tagline}</p>
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold">
                    {plan.priceMonthly === 0 ? "Gratuit" : formatFcfa(plan.priceMonthly, { compact: plan.priceMonthly >= 100000 })}
                  </span>
                  {plan.priceMonthly > 0 && <span className="text-sm text-muted-foreground">/ mois</span>}
                </div>
                {plan.priceYearly > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ou {formatFcfa(plan.priceYearly, { compact: true })}/an (2 mois offerts)
                  </p>
                )}
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className={f.startsWith("Tout du") ? "font-semibold text-foreground" : ""}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => choose(plan.code)}
                disabled={current}
                className={`w-full border-0 ${
                  plan.isPopular
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                    : plan.priceMonthly === 0
                      ? "bg-foreground/90 text-background hover:bg-foreground"
                      : "bg-white/10 hover:bg-white/15 text-foreground border border-white/15"
                }`}
              >
                {current ? "Forfait actuel" : plan.priceMonthly === 0 ? "Commencer gratuitement" : "Choisir ce forfait"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 gap-2 p-4 sm:p-5 border-b border-white/10 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> Fonctionnalité</div>
            <div className="text-center">Découverte</div>
            <div className="text-center bg-violet-500/10 rounded-lg py-1">Pro</div>
            <div className="text-center">Institutionnel</div>
          </div>
          {[
            { label: "Opportunités en temps réel", values: [false, true, true] },
            { label: "Marché P2P FCFA", values: [false, true, true] },
            { label: "Notifications push", values: [false, true, true] },
            { label: "Toutes les paires", values: [false, false, true] },
            { label: "Volume disponible affiché", values: [false, false, true] },
            { label: "Support VIP dédié", values: [false, false, true] },
            { label: "Délai d'affichage", values: ["5 min", "0 (live)", "0 (prioritaire)"] },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 p-4 sm:p-5 border-b border-white/5 last:border-0 text-xs sm:text-sm">
              <div className="text-muted-foreground">{row.label}</div>
              {row.values.map((v, j) => (
                <div key={j} className={`text-center ${j === 1 ? "bg-violet-500/5 rounded-lg" : ""}`}>
                  {typeof v === "boolean" ? (
                    v ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-muted-foreground/40">—</span>
                  ) : (
                    <span className="font-medium">{v}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">Une question avant de vous lancer ?</p>
        <Button variant="outline" onClick={() => setView("ambassador")}>
          <Sparkles className="w-4 h-4 mr-2" /> Découvrir le programme ambassadeur
        </Button>
      </div>
    </div>
  );
}
