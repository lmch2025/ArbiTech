export type View = "landing" | "auth" | "dashboard" | "admin" | "ambassador" | "pricing";

export type PlanCode = "DECOUVERTE" | "PRO" | "INSTITUTIONNEL";

export type PlanInfo = {
  id: string;
  code: PlanCode;
  name: string;
  tagline: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  delaySeconds: number;
  isRealTime: boolean;
  hasP2PFiat: boolean;
  hasPush: boolean;
  hasVolume: boolean;
  hasVipSupport: boolean;
  hasAllPairs: boolean;
  features: string[];
  accentColor: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type PlatformInfo = {
  id: string;
  code: string;
  name: string;
  logo: string;
  color: string;
  url: string;
  status: string;
  pairsCount: number;
};

export type UserInfo = {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  role: "USER" | "ADMIN";
  status: string;
  referralCode: string;
  plan: {
    id: string;
    code: PlanCode;
    name: string;
    isRealTime: boolean;
    delaySeconds: number;
    hasP2PFiat: boolean;
    hasPush: boolean;
    hasVolume: boolean;
    hasVipSupport: boolean;
    hasAllPairs: boolean;
  } | null;
};

export type Opportunity = {
  id: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  buyPlatformCode: string;
  sellPlatformCode: string;
  buyPrice: number;
  sellPrice: number;
  profitPercent: number;
  profitAmount: number;
  volume: number | null;
  type: "SPOT" | "P2P";
  requiresPlan: PlanCode;
  confidence: number;
  expiresAt: string;
  createdAt: string;
  buyPlatform: { code: string; name: string; color: string; logo: string };
  sellPlatform: { code: string; name: string; color: string; logo: string };
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};
