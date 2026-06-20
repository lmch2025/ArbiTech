export const SHARE_TEXTS = [
  {
    text: "Je viens de découvrir comment repérer les failles du marché crypto automatiquement. Viens voir ça avant que ce soit saturé ! 🚀",
    category: "FOMO",
    channel: "ALL",
  },
  {
    text: "Frère, j'ai trouvé un outil qui compare les prix USDT sur Binance, Bybit, OKX et KuCoin en temps réel. Tu achètes là où c'est moins cher, tu vends là où c'est plus cher. C'est ça l'arbitrage. Essaye, c'est simple comme une recette de cuisine. 💜",
    category: "EMOTIONAL",
    channel: "WHATSAPP",
  },
  {
    text: "Tu savais qu'on peut gagner de l'argent avec la crypto SANS prédire les cours ? C'est l'arbitrage : achat ici, vente là-bas, profit net. ArbiTech trouve les opportunités pour toi. Rejoins-moi 👇",
    category: "SIMPLE",
    channel: "ALL",
  },
  {
    text: "Avant je pensais que la crypto c'était trop complexe. Maintenant je vois des opportunités d'arbitrage USDT/FCFA en temps réel, et je capte la différence de prix entre plateformes. La vie change vite 😅✨",
    category: "EMOTIONAL",
    channel: "TELEGRAM",
  },
  {
    text: "🚨 Les pros de la crypto utilisent un secret : l'arbitrage. Acheter bas sur une plateforme, vendre haut sur une autre. ArbiTech automatise TOUT. Suis mon lien et teste gratuitement.",
    category: "FOMO",
    channel: "TWITTER",
  },
  {
    text: "Je partage ce que j'utilise pour repérer les opportunités crypto en Afrique. P2P FCFA inclus. Si tu veux comprendre comment je fais, clique sur mon lien. Pas besoin d'être expert. 🙏",
    category: "FINANCIAL",
    channel: "ALL",
  },
  {
    text: "On est en 2025. Il existe des outils qui chassent les opportunités crypto POUR toi, 24h/24. Voici celui que j'utilise. Profite, avant que tout le monde le découvre. 🌌",
    category: "FOMO",
    channel: "ALL",
  },
  {
    text: "Maîtrise l'arbitrage crypto sans jargon compliqué. ArbiTech affiche : Achat ici ➔ Vente là-bas ➔ Profit net. Tellement simple que même ma mère pourrait le faire 😄",
    category: "SIMPLE",
    channel: "WHATSAPP",
  },
] as const;

export type ShareText = (typeof SHARE_TEXTS)[number];

export function pickShareText(channel?: string) {
  const pool = channel
    ? SHARE_TEXTS.filter((t) => t.channel === "ALL" || t.channel === channel)
    : SHARE_TEXTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
