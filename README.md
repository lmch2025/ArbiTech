# 🌙 ArbiTech — Plateforme SaaS d'Arbitrage Crypto

> Achetez ici. Vendez là-bas. Empochez la différence.

Plateforme SaaS (PWA) qui détecte et centralise les opportunités d'arbitrage crypto (Spot et P2P FCFA) sur Binance, Bybit, OKX et KuCoin. L'accès est monétisé via un modèle d'abonnement (3 plans). Pensé pour un public non digital : chaque opportunité se lit comme une recette de cuisine.

---

## ✨ Fonctionnalités

- **Dashboard temps réel** — opportunités d'arbitrage live via WebSocket (ou polling REST fallback)
- **Vraies données de marché** — APIs REST publiques de Binance, Bybit, OKX, KuCoin + Binance P2P FCFA (aucune clé API requise, 100% légal et furtif)
- **3 plans d'abonnement** — Découverte (gratuit, 5 min de retard), Pro (temps réel + P2P FCFA + push), Institutionnel (volume + API + VIP)
- **Back-office admin** — KPIs, gestion utilisateurs, forfaits, plateformes (ajout dynamique), monitoring des robots espions, config ambassadeur
- **Programme ambassadeur** — ouvert à tous (même visiteurs), 20% de commission, textes émotionnels prédéfinis, partage 1-clic WhatsApp/Telegram/Twitter
- **PWA installable** — manifest, service worker (offline + web push), icônes
- **SEO élite** — SSR, JSON-LD (Organization, WebApplication, FAQPage, Blog), sitemap.xml, balises sémantiques, mots-clés ciblés
- **Blog & Outils gratuits** — 6 articles SEO + calculateur de profit + convertisseur USDT/FCFA + glossaire
- **Pages légales** — Conditions, Confidentialité, Avertissement risques, Support
- **Espace profil** — édition, mot de passe, abonnement, préférences notifications Web Push natives
- **Design immersif** — thème Aurora/Améthyste (glassmorphism, dégradés spirituels, dark-first), responsive, footer sticky

---

## 🏗️ Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Langage | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Base de données | Neon PostgreSQL (serverless) |
| ORM | Prisma 6 |
| Auth | Sessions en DB (cookie httpOnly, hashing scrypt) |
| Temps réel | Polling REST optimisé (4s Pro / 15s Découverte) + cron Vercel cache warming |
| Thème | next-themes (dark/light) |
| Notifications | Web Push (VAPID) + Service Worker — push serveur réel via `web-push` |
| icônes | Lucide React |
| Animations | Framer Motion + CSS custom |

---

## 🚀 Déploiement sur Vercel + Neon

### 1. Créer la base de données Neon

1. Allez sur [console.neon.tech](https://console.neon.tech) et créez un projet
2. Récupérez les deux URLs de connexion :
   - **Pooled connection** (avec `-pooler` dans le hostname) → `DATABASE_URL`
   - **Direct connection** (sans `-pooler`) → `DIRECT_URL`
3. Les deux doivent finir par `?sslmode=require`

### 2. Configurer les variables d'environnement Vercel

Dans Vercel → votre projet → Settings → Environment Variables, ajoutez :

```
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/arbitech?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/arbitech?sslmode=require
CRON_SECRET=<générez avec: openssl rand -hex 32>
```

### 3. Déployer sur Vercel

```bash
# Option A : via GitHub (recommandé — auto-deploy sur chaque push)
# 1. Poussez le code sur GitHub
# 2. Vercel → "New Project" → importez le repo GitHub
# 3. Vercel détecte Next.js automatiquement
# 4. Ajoutez les variables d'environnement (voir étape 2)
# 5. Deploy

# Option B : via Vercel CLI
npm i -g vercel
vercel
```

Le `buildCommand` défini dans `vercel.json` (`prisma generate && next build`) génère le client Prisma automatiquement à chaque build.

### 4. Initialiser le schéma de base de données

Après le premier déploiement, poussez le schéma Prisma vers Neon :

```bash
# En local, avec DATABASE_URL pointant vers Neon dans .env
bun run db:push

# Puis seed les données (plans, plateformes, texts de partage, admin, user démo)
bun run prisma/seed.ts
```

### 5. Configurer le Cron Job (cache warming)

Le fichier `vercel.json` définit un cron qui appelle `/api/cron/warm-cache` toutes les minutes pour maintenir le cache des prix à jour en serverless. Dans Vercel → Settings → Cron Jobs, vérifiez que le cron est bien détecté. Le secret (`CRON_SECRET`) doit correspondre entre la variable d'environnement et le paramètre `secret` de l'URL du cron.

### 6. Temps réel (déjà inclus, sans service séparé)

Le dashboard utilise un **polling REST optimisé** comme mécanisme principal de temps réel :
- **Plan Pro+** : rafraîchissement toutes les **4 secondes** (latence imperceptible pour un humain)
- **Plan Découverte** : toutes les **15 secondes**

Le cron Vercel `warm-cache` (étape 5) maintient le cache des prix à jour toutes les minutes côté serveur, donc chaque requête du dashboard lit directement le cache — **zéro surcoût, zéro latence API externe**. Aucun service WebSocket persistant à déployer, aucune complexité, 100% gratuit.

> ℹ️ Le code du mini-service WebSocket (`mini-services/opportunity-feed/`) est conservé dans le repo pour référence, mais **n'est plus utilisé** par défaut. Si vous souhaitez un jour du vrai temps réel push (sub-seconde), vous pouvez le déployer séparément sur [Render free](https://render.com) avec un cron keep-alive — voir le commentaire en tête du fichier.

---

## 💻 Développement local

```bash
# 1. Installer les dépendances
bun install

# 2. Configurer l'environnement
cp .env.example .env
# Éditez .env avec votre DATABASE_URL Neon (ou SQLite local pour dev)

# 3. Pour dev local avec SQLite (rapide, sans Neon) :
#    - Commentez la ligne postgresql dans prisma/schema.prisma
#    - Utilisez: DATABASE_URL="file:./dev.db"
DATABASE_URL="file:./dev.db" bun run db:push
bun run prisma/seed.ts

# 4. Démarrer le serveur de dev
bun run dev
```

L'app tourne sur `http://localhost:3000`. Le dashboard interroge `/api/opportunities` toutes les 4-15s (polling REST), qui lit le cache en mémoire des prix de marché réels.

### Comptes de démonstration (après seed)

- **Admin** : `admin@arbitech.app` / `ArbiTech2025!`
- **User Pro** : `demo@arbitech.app` / `Demo2025!`

---

## 📁 Structure du projet

```
.
├── prisma/
│   ├── schema.prisma          # Schéma PostgreSQL (User, Plan, Subscription, Platform, Opportunity, ...)
│   └── seed.ts                # Données initiales (plans, plateformes, admin, démo)
├── src/
│   ├── app/
│   │   ├── api/               # API routes (auth, opportunities, admin, cron, ...)
│   │   ├── layout.tsx         # Layout racine (SEO, JSON-LD, PWA, thèmes)
│   │   ├── page.tsx           # Page SSR unique (pré-charge les données pour le SEO)
│   │   ├── manifest.webmanifest
│   │   └── sitemap.ts         # Sitemap dynamique
│   ├── components/
│   │   ├── app/               # Composants app (navbar, footer, views, opportunity-card, ...)
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts            # Sessions, hashing scrypt
│   │   ├── db.ts              # Client Prisma
│   │   ├── exchange-fetcher.ts# Scraper furtif des APIs publiques (rotation UA, jitter, cache)
│   │   ├── arbitrage-calculator.ts # Calcul des spreads réels
│   │   ├── opportunity-service.ts  # Gating par plan + filtres
│   │   ├── constants.ts       # Plans, plateformes, assets
│   │   ├── format.ts          # formatFcfa, formatPercent, timeAgo, ...
│   │   └── ...
│   └── hooks/
│       └── use-notifications.ts # Web Push hook
├── mini-services/
│   └── opportunity-feed/      # Service WebSocket temps réel (port 3003)
├── public/
│   ├── sw.js                  # Service Worker (offline + push)
│   ├── icon.svg, og.svg, manifest.webmanifest, robots.txt, offline.html
├── vercel.json                # Config Vercel (build + cron)
├── .env.example
└── package.json
```

---

## 🔒 Stratégie de scraping sécurisée (cahier des charges section 3)

Le projet utilise les **APIs REST publiques officielles** des exchanges — aucune clé, aucun bannissement, 100% légal :

- **Rotation de User-Agents** : pool de 7 UAs réalistes (Chrome, Safari, Firefox, Edge, iPhone, Android, Mac)
- **Headers dynamiques** : Accept-Language, Origin, Referer imitant un navigateur humain
- **Délais aléatoires (Jitter) 12-28s** : jamais d'intervalle régulier (déjoue la détection de bots)
- **Mise en cache** : le snapshot est gardé en mémoire. 100 utilisateurs connectés = 1 seule requête vers Binance, pas 100
- **Fallback intelligent** : si le réseau tombe, une simulation prend le relais pour ne jamais laisser le flux vide

Sources interrogées :
- Binance : `/api/v3/ticker/bookTicker` (Spot) + `/bapi/c2c/v2/friendly/c2c/adv/search` (P2P FCFA)
- Bybit : `/v5/market/tickers?category=spot` (Spot)
- OKX : `/api/v5/market/tickers?instType=SPOT` (Spot)
- KuCoin : `/api/v1/market/allTickers` (Spot)

---

## 📊 Données réelles vs simulées

Les opportunités sont marquées avec un badge **« Live »** (emerald) quand elles proviennent des vraies APIs, pour une transparence totale. Un bandeau dans le dashboard indique le ratio `X live · Y simulées`. Les opportunités P2P USDT/FCFA affichent le **vrai spread** Binance P2P (souvent 5-7%).

---

## ⚠️ Avertissement

Le trading de crypto-monnaies comporte des risques de perte en capital. ArbiTech est un outil d'information et ne constitue pas un conseil financier. N'investissez que ce que vous pouvez vous permettre de perdre. Voir la page [Avertissement sur les risques](/?view=legal&doc=avertissement).

---

## 📄 Licence

Propriétaire — © ArbiTech 2025. Tous droits réservés.
