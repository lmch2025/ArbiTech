import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});
const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://arbitech.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ArbiTech — Repérez les opportunités crypto automatiquement",
    template: "%s | ArbiTech",
  },
  description:
    "ArbiTech détecte en temps réel les meilleures opportunités d'arbitrage crypto (Binance, Bybit, OKX, KuCoin) et P2P FCFA. Achetez ici, vendez là-bas, empochez la différence. Simple comme une recette de cuisine.",
  keywords: [
    "arbitrage crypto FCFA",
    "gagner argent P2P Binance",
    "comparateur prix USDT Bybit OKX",
    "arbitrage USDT FCFA",
    "opportunités crypto Afrique",
    "ArbiTech",
    "trading crypto simple",
    "achat vente crypto différence",
  ],
  authors: [{ name: "ArbiTech" }],
  creator: "ArbiTech",
  publisher: "ArbiTech",
  applicationName: "ArbiTech",
  category: "Finance",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/icon.svg" }],
  },
  openGraph: {
    title: "ArbiTech — Repérez les opportunités crypto automatiquement",
    description:
      "La plateforme qui détecte pour vous les meilleures opportunités d'arbitrage crypto et P2P FCFA. Achetez ici, vendez là-bas, empochez le profit.",
    url: SITE_URL,
    siteName: "ArbiTech",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "ArbiTech — Arbitrage crypto simplifié" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArbiTech — Arbitrage crypto simplifié",
    description: "Achetez ici, vendez là-bas, empochez la différence. Le tout automatiquement.",
    images: ["/og.svg"],
  },
  appleWebApp: {
    capable: true,
    title: "ArbiTech",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1ff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1426" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ArbiTech",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description:
    "Plateforme SaaS de détection d'opportunités d'arbitrage crypto (Spot et P2P FCFA) sur Binance, Bybit, OKX, KuCoin.",
  foundingDate: "2025",
  knowsAbout: ["Cryptocurrency Arbitrage", "P2P Trading", "FCFA Trading", "DeFi"],
  sameAs: ["https://twitter.com/arbitech", "https://t.me/arbitech"],
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ArbiTech",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web, Android, iOS",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "XAF",
    lowPrice: "0",
    highPrice: "50000",
  },
  featureList: [
    "Détection en temps réel des opportunités d'arbitrage crypto",
    "Comparateur de prix USDT/FCFA multi-plateformes",
    "Notifications push d'opportunités rentables",
    "Programme ambassadeur avec commissions",
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "C'est quoi l'arbitrage crypto ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "C'est simple : vous achetez une crypto (ex: USDT) sur une plateforme où elle est moins chère, et vous la vendez sur une autre où elle est plus chère. La différence entre les deux prix, c'est votre profit. ArbiTech trouve ces différences pour vous, automatiquement.",
      },
    },
    {
      "@type": "Question",
      name: "Ai-je besoin d'être un expert pour utiliser ArbiTech ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. ArbiTech est pensé pour tout le monde. Chaque opportunité s'affiche comme une recette : Achetez ici, Vendez là-bas, Profit net. Aucun terme compliqué.",
      },
    },
    {
      "@type": "Question",
      name: "Est-ce que je peux installer ArbiTech sur mon téléphone ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. ArbiTech est une PWA (application web progressive). Vous pouvez l'installer directement depuis votre navigateur comme une application native et recevoir des notifications push.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Sonner />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
