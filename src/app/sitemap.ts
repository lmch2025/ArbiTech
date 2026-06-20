import type { MetadataRoute } from "next";

const SITE_URL = "https://arbitech.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const views = [
    { path: "/", label: "Accueil — Arbitrage crypto simplifié", priority: 1.0, change: "hourly" },
    { path: "/?view=pricing", label: "Tarifs des forfaits ArbiTech", priority: 0.9, change: "weekly" },
    { path: "/?view=ambassador", label: "Programme ambassadeur — gagnez en parrainant", priority: 0.9, change: "weekly" },
    { path: "/?view=blog", label: "Blog — guides arbitrage crypto & FCFA", priority: 0.8, change: "weekly" },
    { path: "/?view=tools", label: "Outils gratuits — calculateur & convertisseur crypto", priority: 0.8, change: "weekly" },
    { path: "/?view=legal", label: "Documents légaux — conditions, confidentialité, support", priority: 0.6, change: "monthly" },
    { path: "/?view=legal&doc=conditions", label: "Conditions d'utilisation ArbiTech", priority: 0.6, change: "monthly" },
    { path: "/?view=legal&doc=confidentialite", label: "Politique de confidentialité ArbiTech", priority: 0.6, change: "monthly" },
    { path: "/?view=legal&doc=avertissement", label: "Avertissement sur les risques crypto", priority: 0.6, change: "monthly" },
    { path: "/?view=legal&doc=support", label: "Support & Aide ArbiTech", priority: 0.6, change: "monthly" },
  ];

  return views.map((v) => ({
    url: `${SITE_URL}${v.path}`,
    lastModified: now,
    changeFrequency: v.change as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: v.priority,
  }));
}
