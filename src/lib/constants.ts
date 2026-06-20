export const PLANS_SEED = [
  {
    code: "DECOUVERTE",
    name: "Découverte",
    tagline: "Pour commencer en douceur",
    description:
      "Le forfait gratuit pour découvrir le pouvoir de l'arbitrage sans rien payer. Idéal pour comprendre comment ça marche.",
    priceMonthly: 0,
    priceYearly: 0,
    delaySeconds: 300,
    isRealTime: false,
    hasP2PFiat: false,
    hasPush: false,
    hasVolume: false,
    hasVipSupport: false,
    hasAllPairs: false,
    features: JSON.stringify([
      "Opportunités affichées avec 5 min de délai",
      "Paires classiques (BTC, ETH, USDT)",
      "1 plateforme de comparaison",
      "Support communautaire",
    ]),
    accentColor: "teal",
    isPopular: false,
    sortOrder: 1,
  },
  {
    code: "PRO",
    name: "Pro",
    tagline: "Le plus populaire",
    description:
      "Pour ceux qui veulent vraiment gagner. Opportunités en temps réel, accès au marché P2P FCFA et notifications push.",
    priceMonthly: 15000,
    priceYearly: 150000,
    delaySeconds: 0,
    isRealTime: true,
    hasP2PFiat: true,
    hasPush: true,
    hasVolume: false,
    hasVipSupport: false,
    hasAllPairs: false,
    features: JSON.stringify([
      "Opportunités en TEMPS RÉEL",
      "Marché P2P FCFA (Binance, Bybit)",
      "Notifications push illimitées",
      "Toutes les plateformes comparées",
      "Filtres intelligents avancés",
      "Support prioritaire 24/7",
    ]),
    accentColor: "violet",
    isPopular: true,
    sortOrder: 2,
  },
  {
    code: "INSTITUTIONNEL",
    name: "Institutionnel",
    tagline: "L'arsenal complet",
    description:
      "Pour les pros et les équipes. Volume d'arbitrage disponible, toutes les paires, API privées et support VIP dédié.",
    priceMonthly: 50000,
    priceYearly: 500000,
    delaySeconds: 0,
    isRealTime: true,
    hasP2PFiat: true,
    hasPush: true,
    hasVolume: true,
    hasVipSupport: true,
    hasAllPairs: true,
    features: JSON.stringify([
      "Tout du plan Pro, PLUS :",
      "Volume d'arbitrage disponible affiché",
      "Toutes les paires (même exotiques)",
      "Accès API privées",
      "Temps réel prioritaire (serveurs dédiés)",
      "Support VIP dédié (WhatsApp direct)",
      "Manager de compte personnel",
    ]),
    accentColor: "magenta",
    isPopular: false,
    sortOrder: 3,
  },
] as const;

export const PLATFORMS_SEED = [
  {
    code: "BINANCE",
    name: "Binance",
    logo: "B",
    color: "#F0B90B",
    url: "https://www.binance.com",
    pairsCount: 412,
  },
  {
    code: "BYBIT",
    name: "Bybit",
    logo: "By",
    color: "#F7A600",
    url: "https://www.bybit.com",
    pairsCount: 318,
  },
  {
    code: "OKX",
    name: "OKX",
    logo: "OK",
    color: "#10b981",
    url: "https://www.okx.com",
    pairsCount: 286,
  },
  {
    code: "KUCOIN",
    name: "KuCoin",
    logo: "K",
    color: "#24d39a",
    url: "https://www.kucoin.com",
    pairsCount: 401,
  },
] as const;

export const BASE_ASSETS = [
  { symbol: "USDT", name: "Tether", basePriceFcfa: 615, volatility: 0.012 },
  { symbol: "USDC", name: "USD Coin", basePriceFcfa: 614, volatility: 0.010 },
  { symbol: "BTC", name: "Bitcoin", basePriceFcfa: 41800000, volatility: 0.022 },
  { symbol: "ETH", name: "Ethereum", basePriceFcfa: 2240000, volatility: 0.025 },
  { symbol: "BNB", name: "BNB", basePriceFcfa: 388000, volatility: 0.020 },
  { symbol: "SOL", name: "Solana", basePriceFcfa: 98000, volatility: 0.035 },
  { symbol: "TRX", name: "Tron", basePriceFcfa: 580, volatility: 0.015 },
];

export const PLAN_LABELS: Record<string, { label: string; tone: string }> = {
  DECOUVERTE: { label: "Découverte", tone: "teal" },
  PRO: { label: "Pro", tone: "violet" },
  INSTITUTIONNEL: { label: "Institutionnel", tone: "magenta" },
};

export const WS_PORT = 3003;

export function planToneClass(tone: string) {
  switch (tone) {
    case "teal":
      return "from-teal-400 to-emerald-500";
    case "violet":
      return "from-violet-500 to-fuchsia-500";
    case "magenta":
      return "from-fuchsia-500 to-rose-500";
    default:
      return "from-violet-500 to-fuchsia-500";
  }
}
