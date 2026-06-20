"use client";

import { useApp } from "@/lib/store";
import { Sparkles, Twitter, Send, MessageCircle, Mail } from "lucide-react";

export function SiteFooter() {
  const setView = useApp((s) => s.setView);

  return (
    <footer className="mt-auto glass border-t border-white/10">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-teal-400 text-white">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="font-display font-extrabold text-lg">
                <span className="text-aurora">ArbiTech</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La plateforme qui détecte pour vous les opportunités d'arbitrage crypto et P2P FCFA.
              Simple comme une recette de cuisine.
            </p>
            <div className="flex gap-2 pt-1">
              <a href="#" aria-label="Twitter" className="grid place-items-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Telegram" className="grid place-items-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Send className="w-4 h-4" />
              </a>
              <a href="#" aria-label="WhatsApp" className="grid place-items-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Email" className="grid place-items-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Produit</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView("landing")} className="hover:text-primary transition-colors">Accueil</button></li>
              <li><button onClick={() => setView("pricing")} className="hover:text-primary transition-colors">Tarifs</button></li>
              <li><button onClick={() => setView("dashboard")} className="hover:text-primary transition-colors">Opportunités</button></li>
              <li><a href="#how" className="hover:text-primary transition-colors">Comment ça marche</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Gagner</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView("ambassador")} className="hover:text-primary transition-colors">Programme ambassadeur</button></li>
              <li><button onClick={() => setView("ambassador")} className="hover:text-primary transition-colors">Devenir parrain</button></li>
              <li><a href="#" className="hover:text-primary transition-colors">Outils gratuits</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Légal & Aide</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Conditions d'utilisation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Avertissement risque</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ArbiTech. Tous droits réservés.</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 live-dot" />
            Flux en temps réel actif · Binance · Bybit · OKX · KuCoin
          </p>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/70">
          ⚠️ Avertissement : Le trading de crypto-monnaies comporte des risques de perte en capital. Les performances
          passées ne préjugent pas des performances futures. ArbiTech est un outil d'information et ne constitue pas
          un conseil financier. N'investissez que ce que vous pouvez vous permettre de perdre.
        </p>
      </div>
    </footer>
  );
}
