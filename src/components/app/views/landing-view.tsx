"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Bell,
  Globe,
  TrendingUp,
  Users,
  Gift,
  Check,
  Star,
  Eye,
  Lock,
  Smartphone,
  Heart,
  Moon,
  Rocket,
  ChefHat,
  Target,
} from "lucide-react";
import { OpportunityCard } from "@/components/app/opportunity-card";
import { formatFcfa, formatPercent } from "@/lib/format";
import type { Opportunity } from "@/lib/types";
import { planToneClass } from "@/lib/constants";

export function LandingView() {
  const setView = useApp((s) => s.setView);
  const setAuthMode = useApp((s) => s.setAuthMode);
  const setPendingPlan = useApp((s) => s.setPendingPlan);
  const plans = useApp((s) => s.plans);
  const platforms = useApp((s) => s.platforms);
  const user = useApp((s) => s.user);
  const setShareOpen = useApp((s) => s.setShareOpen);

  const [previewOps, setPreviewOps] = useState<Opportunity[]>([]);

  useEffect(() => {
    // Fetch a few live opportunities for the preview (Découverte level)
    fetch("/api/opportunities?limit=4")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.opportunities?.length) setPreviewOps(d.opportunities);
      })
      .catch(() => {});
  }, []);

  const startFree = () => {
    if (user) setView("dashboard");
    else {
      setAuthMode("register");
      setView("auth");
    }
  };

  const choosePlan = (code: string) => {
    setPendingPlan(code as never);
    if (user) setView("dashboard");
    else {
      setAuthMode("register");
      setView("auth");
    }
  };

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden aurora-hero">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-7 animate-rise">
              <Badge className="w-fit gap-1.5 bg-violet-500/15 text-violet-200 border border-violet-500/30 px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot" />
                Flux temps réel actif · 4 plateformes surveillées
              </Badge>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Achetez ici.
                <br />
                Vendez là-bas.
                <br />
                <span className="text-aurora">Empochez la différence.</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                ArbiTech détecte <strong className="text-foreground">automatiquement</strong> les meilleures
                opportunités d'arbitrage crypto et P2P FCFA. Pas de jargon compliqué : chaque opportunité se lit
                comme une <strong className="text-foreground">recette de cuisine</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={startFree}
                  className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-teal-400 text-white border-0 shadow-lg shadow-violet-500/30 hover:scale-[1.02] transition-transform text-base h-12 px-7"
                >
                  <Rocket className="w-5 h-5 mr-2" /> Commencer gratuitement
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById("opportunities")?.scrollIntoView({ behavior: "smooth" })}
                  className="h-12 px-7 text-base"
                >
                  <Eye className="w-4 h-4 mr-2" /> Voir un exemple
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Sans carte bancaire</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> 100% en français</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Installable sur mobile</span>
              </div>
            </div>

            {/* Live preview card */}
            <div className="relative animate-rise" style={{ animationDelay: "0.15s" }}>
              <div className="absolute -inset-6 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-teal-400/20 blur-3xl rounded-full" />
              <div className="relative glass-strong rounded-3xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot" />
                    <span className="text-sm font-semibold">En direct maintenant</span>
                  </div>
                  <Badge className="bg-violet-500/15 text-violet-200 border border-violet-500/30">
                    <Zap className="w-3 h-3 mr-1" /> Temps réel
                  </Badge>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto scroll-elegant pr-1">
                  {previewOps.length === 0 ? (
                    [0, 1, 2].map((i) => (
                      <div key={i} className="h-24 rounded-2xl shimmer bg-muted/30" />
                    ))
                  ) : (
                    previewOps.slice(0, 4).map((op) => (
                      <OpportunityCard key={op.id} op={op} />
                    ))
                  )}
                </div>

                <Button
                  variant="ghost"
                  className="w-full mt-3"
                  onClick={() => (user ? setView("dashboard") : setView("auth"))}
                >
                  Voir toutes les opportunités <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLATFORMS STRIP ===== */}
      <section className="border-y border-white/5 bg-background/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Nous surveillons en permanence ces plateformes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            {platforms.map((p) => (
              <div key={p.code} className="flex items-center gap-2 glass rounded-xl px-4 py-2">
                <span
                  className="grid place-items-center w-8 h-8 rounded-lg text-white text-sm font-bold"
                  style={{ background: p.color }}
                >
                  {p.logo}
                </span>
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.pairsCount} paires</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="mb-4 bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <ChefHat className="w-3 h-3 mr-1" /> Simple comme une recette
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">
            Comment ça marche ? En 3 gestes
          </h2>
          <p className="text-muted-foreground text-lg">
            Vous n'avez rien à calculer. ArbiTech fait le travail. Vous n'avez qu'à suivre les étapes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Eye,
              num: "1",
              title: "Vous regardez",
              desc: "ArbiTech vous montre une opportunité : « Achetez l'USDT sur Binance à 615 FCFA ».",
              color: "from-emerald-400 to-teal-500",
            },
            {
              icon: ArrowRight,
              num: "2",
              title: "Vous agissez",
              desc: "Vous achetez sur la 1ère plateforme, vous transférez, puis vous vendez sur la 2ème.",
              color: "from-violet-400 to-fuchsia-500",
            },
            {
              icon: TrendingUp,
              num: "3",
              title: "Vous empochez",
              desc: "La différence de prix entre les deux plateformes, c'est votre profit net. Net, clair, précis.",
              color: "from-fuchsia-400 to-amber-400",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="relative glass rounded-3xl p-6 hover:glass-strong transition-all hover:-translate-y-1"
            >
              <div className={`absolute top-6 right-6 grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} text-white font-bold font-display`}>
                {step.num}
              </div>
              <div className={`inline-grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white mb-4 shadow-lg`}>
                <step.icon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== LIVE OPPORTUNITIES PREVIEW ===== */}
      <section id="opportunities" className="relative bg-background/40 border-y border-white/5">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <Badge className="mb-3 bg-violet-500/15 text-violet-200 border border-violet-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot mr-1" /> En direct
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
                Les opportunités <span className="text-aurora">du moment</span>
              </h2>
              <p className="text-muted-foreground mt-2">Un aperçu gratuit. Inscrivez-vous pour tout débloquer.</p>
            </div>
            <Button onClick={() => setView("auth")} className="w-fit">
              Débloquer tout le flux <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewOps.length === 0 ? (
              [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-44 rounded-2xl shimmer bg-muted/30" />)
            ) : (
              previewOps.slice(0, 6).map((op, i) => (
                <OpportunityCard key={op.id} op={op} highlight={i === 0} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="mb-4 bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/30">
            <Sparkles className="w-3 h-3 mr-1" /> Pensé pour vous
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">
            Tout ce qu'il faut pour <span className="text-aurora">réussir</span>, rien qui complique
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Zap, title: "Temps réel", desc: "Les prix changent chaque seconde. ArbiTech les suit 24h/24 pour vous.", color: "text-violet-400" },
            { icon: ChefHat, title: "Lisibilité absolue", desc: "Aucun terme compliqué. Chaque opportunité = Achat ➔ Vente ➔ Profit.", color: "text-fuchsia-400" },
            { icon: Bell, title: "Alertes intelligentes", desc: "Une opportunité très rentable apparaît ? Vous êtes prévenu sur votre téléphone.", color: "text-amber-400" },
            { icon: ShieldCheck, title: "Sécurité d'abord", desc: "Nos robots espions travaillent en cachette pour ne jamais se faire bannir.", color: "text-emerald-400" },
            { icon: Globe, title: "FCFA & P2P", desc: "Pensé pour l'Afrique. Comparez les prix USDT/FCFA sur Binance, Bybit, OKX, KuCoin.", color: "text-teal-400" },
            { icon: Smartphone, title: "Installable", desc: "Ajoutez ArbiTech sur votre téléphone comme une vraie application. Offline-ready.", color: "text-rose-400" },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-5 hover:glass-strong hover:-translate-y-1 transition-all">
              <f.icon className={`w-8 h-8 ${f.color} mb-3`} />
              <h3 className="font-display font-bold text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="relative bg-background/40 border-y border-white/5">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="mb-4 bg-amber-500/15 text-amber-200 border border-amber-500/30">
              <Star className="w-3 h-3 mr-1" /> Forfaits simples
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">
              Choisissez votre niveau de jeu
            </h2>
            <p className="text-muted-foreground text-lg">
              Commencez gratuitement. Passez à la vitesse supérieure quand vous êtes prêt.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} onChoose={() => choosePlan(plan.code)} current={user?.plan?.code === plan.code} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== AMBASSADOR CTA ===== */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-8 sm:p-12">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4 bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/30">
                <Gift className="w-3 h-3 mr-1" /> Programme ambassadeur
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">
                Partagez ArbiTech, <span className="text-aurora-warm">gagnez de l'argent</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Même sans abonnement, vous pouvez devenir ambassadeur. Partagez votre lien unique, et touchez
                <strong className="text-foreground"> 20% de commission</strong> à chaque ami qui s'abonne. Les textes
                d'accroche sont déjà écrits pour vous. Un clic, et c'est parti.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => setView("ambassador")}
                  className="bg-gradient-to-r from-fuchsia-500 to-amber-400 text-white border-0 h-12 px-7"
                >
                  <Gift className="w-5 h-5 mr-2" /> Devenir ambassadeur
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShareOpen(true)} className="h-12 px-7">
                  Partager maintenant
                </Button>
              </div>
            </div>
            <div className="glass rounded-2xl p-6 space-y-3">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ce que vous touchez</div>
              {[
                { label: "Par ami au plan Pro", val: "3 000 FCFA" },
                { label: "Par ami au plan Institutionnel", val: "10 000 FCFA" },
                { label: "Paiement dès 5 000 FCFA cumulés", val: "WhatsApp / Mobile Money" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="font-bold text-aurora-warm">{row.val}</span>
                </div>
              ))}
              <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Ouvert à tous. Pas besoin d'être abonné pour gagner.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-background/40 border-y border-white/5">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="mb-4 bg-rose-500/15 text-rose-200 border border-rose-500/30">
              <Heart className="w-3 h-3 mr-1" /> Ils utilisent ArbiTech
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">Des histoires qui font du bien</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Aïcha D.", city: "Douala", text: "Avant, la crypto c'était du chinois pour moi. Maintenant je vois « Achète ici, vends là-bas » et je comprends tout de suite.", role: "Commerçante" },
              { name: "Ibrahim S.", city: "Yaoundé", text: "Le programme ambassadeur m'a permis de payer mon loyer le premier mois. Je partage mon lien sur WhatsApp et ça tourne.", role: "Étudiant" },
              { name: "Mariam K.", city: "Bamako", text: "J'ai installé l'app sur mon téléphone. Les notifications me préviennent quand une opportunité en or apparaît. Magique.", role: "Coiffeuse" },
            ].map((t, i) => (
              <div key={i} className="glass rounded-2xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role} · {t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="container mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-teal-500/15 text-teal-200 border border-teal-500/30">
            <Target className="w-3 h-3 mr-1" /> Vos questions
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold">Tout ce que vous voulez savoir</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {[
            { q: "C'est quoi l'arbitrage crypto ?", a: "C'est simple : vous achetez une crypto (ex: USDT) sur une plateforme où elle est moins chère, et vous la vendez sur une autre où elle est plus chère. La différence entre les deux prix, c'est votre profit. ArbiTech trouve ces différences pour vous, automatiquement, 24h/24." },
            { q: "Ai-je besoin d'être un expert ?", a: "Absolument pas. ArbiTech est pensé pour tout le monde. Chaque opportunité s'affiche comme une recette : Achetez ici ➔ Vendez là-bas ➔ Profit net. Aucun terme compliqué, aucune courbe à analyser." },
            { q: "Combien je peux gagner ?", a: "Cela dépend du marché et de votre forfait. Les opportunités vont de 0,5% à 5% de profit par opération. Avec le plan Pro, vous accédez au marché P2P FCFA, souvent plus rentable. Attention : le trading comporte des risques, ne mettez que ce que vous pouvez perdre." },
            { q: "Est-ce que je peux installer l'app sur mon téléphone ?", a: "Oui. ArbiTech est une PWA (application web progressive). Depuis votre navigateur, vous pouvez l'installer comme une vraie application native. Vous recevrez des notifications push quand une opportunité rentable apparaît." },
            { q: "Le programme ambassadeur, c'est quoi ?", a: "Même sans être abonné, vous pouvez partager votre lien unique ArbiTech. À chaque fois qu'un ami s'abonne grâce à vous, vous touchez 20% de commission. Les messages de partage sont déjà écrits pour vous." },
            { q: "Mes données sont-elles sécurisées ?", a: "Vos mots de passe sont chiffrés. Vos sessions sont protégées. Nous ne vendons jamais vos données. Vous pouvez supprimer votre compte à tout moment." },
          ].map((item, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="glass rounded-2xl px-5 border-0">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-teal-500 p-10 sm:p-16 text-center text-white">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white, transparent 40%), radial-gradient(circle at 70% 80%, white, transparent 40%)" }} />
          <div className="relative">
            <Moon className="w-10 h-10 mx-auto mb-4 opacity-80" />
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold mb-4">
              Le marché ne dort jamais.
              <br />Vous non plus, grâce à ArbiTech.
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Rejoignez la communauté qui transforme les différences de prix en profits réels.
            </p>
            <Button
              size="lg"
              onClick={startFree}
              className="bg-white text-violet-700 hover:bg-white/90 border-0 h-14 px-8 text-base font-bold shadow-2xl"
            >
              <Rocket className="w-5 h-5 mr-2" /> Commencer gratuitement maintenant
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingCard({ plan, onChoose, current }: { plan: any; onChoose: () => void; current?: boolean }) {
  const tone = planToneClass(plan.accentColor);
  return (
    <div className={`relative rounded-3xl p-6 sm:p-7 flex flex-col ${plan.isPopular ? "glass-strong gradient-border glow-soft lg:scale-[1.03]" : "glass"}`}>
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
        {plan.features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className={f.startsWith("Tout du") ? "font-semibold text-foreground" : ""}>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={onChoose}
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
}
