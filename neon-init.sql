-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "planId" TEXT,
    "referralCode" TEXT NOT NULL,
    "referredById" TEXT,
    "dailyViewsCount" INTEGER NOT NULL DEFAULT 0,
    "dailyViewsDate" TIMESTAMP(3),
    "dailySeenFingerprints" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMonthly" DOUBLE PRECISION NOT NULL,
    "priceYearly" DOUBLE PRECISION NOT NULL,
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
    "isRealTime" BOOLEAN NOT NULL DEFAULT false,
    "hasP2PFiat" BOOLEAN NOT NULL DEFAULT false,
    "hasPush" BOOLEAN NOT NULL DEFAULT false,
    "hasVolume" BOOLEAN NOT NULL DEFAULT false,
    "hasVipSupport" BOOLEAN NOT NULL DEFAULT false,
    "hasAllPairs" BOOLEAN NOT NULL DEFAULT false,
    "features" TEXT NOT NULL DEFAULT '[]',
    "dailyOpportunityLimit" INTEGER NOT NULL DEFAULT 0,
    "accentColor" TEXT NOT NULL DEFAULT 'violet',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "amount" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'violet',
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "lastSyncAt" TIMESTAMP(3),
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "pairsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "buyPlatformId" TEXT NOT NULL,
    "sellPlatformId" TEXT NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "profitPercent" DOUBLE PRECISION NOT NULL,
    "profitAmount" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'SPOT',
    "requiresPlan" TEXT NOT NULL DEFAULT 'DECOUVERTE',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareText" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'EMOTIONAL',
    "channel" TEXT NOT NULL DEFAULT 'ALL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbassadorEarning" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "AmbassadorEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OPPORTUNITY',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScraperLog" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScraperLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbassadorConfig" (
    "id" TEXT NOT NULL,
    "commissionType" TEXT NOT NULL DEFAULT 'PERCENT',
    "commissionValue" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "minPayout" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbassadorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keysP256dh" TEXT NOT NULL,
    "keysAuth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CacheEntry" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CacheEntry_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "OpportunityView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "buyPlatformCode" TEXT NOT NULL,
    "sellPlatformCode" TEXT NOT NULL,
    "buyPlatformName" TEXT NOT NULL,
    "sellPlatformName" TEXT NOT NULL,
    "buyPlatformColor" TEXT NOT NULL,
    "sellPlatformColor" TEXT NOT NULL,
    "buyPlatformLogo" TEXT NOT NULL,
    "sellPlatformLogo" TEXT NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "profitPercent" DOUBLE PRECISION NOT NULL,
    "profitAmount" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_code_key" ON "Platform"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_userId_endpoint_key" ON "PushSubscription"("userId", "endpoint");

-- CreateIndex
CREATE INDEX "OpportunityView_userId_viewedAt_idx" ON "OpportunityView"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityView_userId_fingerprint_key" ON "OpportunityView"("userId", "fingerprint");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_buyPlatformId_fkey" FOREIGN KEY ("buyPlatformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_sellPlatformId_fkey" FOREIGN KEY ("sellPlatformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorEarning" ADD CONSTRAINT "AmbassadorEarning_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorEarning" ADD CONSTRAINT "AmbassadorEarning_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScraperLog" ADD CONSTRAINT "ScraperLog_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityView" ADD CONSTRAINT "OpportunityView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ===== SEED DATA =====

-- Plans
INSERT INTO "Plan" ("id","code","name","tagline","description","priceMonthly","priceYearly","delaySeconds","isRealTime","hasP2PFiat","hasPush","hasVolume","hasVipSupport","hasAllPairs","features","dailyOpportunityLimit","accentColor","isPopular","isActive","sortOrder","createdAt","updatedAt")
VALUES
('plan_decouverte','DECOUVERTE','Découverte','Pour commencer en douceur','Le forfait gratuit pour découvrir le pouvoir de l''arbitrage sans rien payer.',0,0,900,false,false,false,false,false,false,'["10 opportunités détaillées par jour","Opportunités avec 15 min de retard","Au-delà du quota : floutées","Support communautaire"]',10,'teal',false,true,1,NOW(),NOW()),
('plan_pro','PRO','Pro','Le plus populaire','Pour ceux qui veulent vraiment gagner. Temps réel, P2P FCFA et notifications push.',15000,150000,0,true,true,true,false,false,false,'["Opportunités en TEMPS RÉEL (illimitées)","Marché P2P FCFA","Notifications push illimitées","Toutes les plateformes","Filtres avancés","Support prioritaire 24/7"]',0,'violet',true,true,2,NOW(),NOW()),
('plan_institutionnel','INSTITUTIONNEL','Institutionnel','L''arsenal complet','Pour les pros. Volume, toutes les paires, API privées et support VIP.',50000,500000,0,true,true,true,true,true,true,'["Tout du plan Pro","Volume d''arbitrage affiché","Toutes les paires","Accès API privées","Temps réel prioritaire","Support VIP dédié","Manager de compte"]',0,'magenta',false,true,3,NOW(),NOW())
ON CONFLICT ("code") DO UPDATE SET "name"=EXCLUDED."name","tagline"=EXCLUDED."tagline","description"=EXCLUDED."description","priceMonthly"=EXCLUDED."priceMonthly","priceYearly"=EXCLUDED."priceYearly","delaySeconds"=EXCLUDED."delaySeconds","isRealTime"=EXCLUDED."isRealTime","hasP2PFiat"=EXCLUDED."hasP2PFiat","hasPush"=EXCLUDED."hasPush","hasVolume"=EXCLUDED."hasVolume","hasVipSupport"=EXCLUDED."hasVipSupport","hasAllPairs"=EXCLUDED."hasAllPairs","features"=EXCLUDED."features","dailyOpportunityLimit"=EXCLUDED."dailyOpportunityLimit","accentColor"=EXCLUDED."accentColor","isPopular"=EXCLUDED."isPopular","isActive"=EXCLUDED."isActive","sortOrder"=EXCLUDED."sortOrder","updatedAt"=NOW();

-- Platforms
INSERT INTO "Platform" ("id","code","name","logo","color","url","isActive","status","lastSyncAt","latencyMs","successRate","pairsCount","createdAt","updatedAt")
VALUES
('pf_binance','BINANCE','Binance','B','#F0B90B','https://www.binance.com',true,'ONLINE',NOW(),72,99.3,412,NOW(),NOW()),
('pf_bybit','BYBIT','Bybit','By','#F7A600','https://www.bybit.com',true,'ONLINE',NOW(),77,99.6,318,NOW(),NOW()),
('pf_okx','OKX','OKX','OK','#10b981','https://www.okx.com',true,'ONLINE',NOW(),57,99.6,286,NOW(),NOW()),
('pf_kucoin','KUCOIN','KuCoin','K','#24d39a','https://www.kucoin.com',true,'ONLINE',NOW(),140,99.7,401,NOW(),NOW())
ON CONFLICT ("code") DO UPDATE SET "name"=EXCLUDED."name","logo"=EXCLUDED."logo","color"=EXCLUDED."color","url"=EXCLUDED."url","status"=EXCLUDED."status","lastSyncAt"=NOW(),"updatedAt"=NOW();

-- Ambassador config
INSERT INTO "AmbassadorConfig" ("id","commissionType","commissionValue","minPayout","isActive","updatedAt")
VALUES ('default','PERCENT',20,5000,true,NOW())
ON CONFLICT ("id") DO UPDATE SET "commissionType"=EXCLUDED."commissionType","commissionValue"=EXCLUDED."commissionValue","minPayout"=EXCLUDED."minPayout","isActive"=EXCLUDED."isActive","updatedAt"=NOW();

-- Share texts
INSERT INTO "ShareText" ("id","text","category","channel","isActive","createdAt") VALUES
('st_FOMO_ALL','Je viens de découvrir comment repérer les failles du marché crypto automatiquement. Viens voir ça avant que ce soit saturé ! 🚀','FOMO','ALL',true,NOW()),
('st_EMOTIONAL_WHATSAPP','Frère, j''ai trouvé un outil qui compare les prix USDT sur Binance, Bybit, OKX et KuCoin en temps réel. C''est ça l''arbitrage. Essaye, c''est simple comme une recette. 💜','EMOTIONAL','WHATSAPP',true,NOW()),
('st_SIMPLE_ALL','Tu savais qu''on peut gagner de l''argent avec la crypto SANS prédire les cours ? C''est l''arbitrage : achat ici, vente là-bas, profit net. ArbiTech trouve les opportunités pour toi. 👇','SIMPLE','ALL',true,NOW()),
('st_EMOTIONAL_TELEGRAM','Avant je pensais que la crypto c''était trop complexe. Maintenant je vois des opportunités d''arbitrage en temps réel. 😅✨','EMOTIONAL','TELEGRAM',true,NOW()),
('st_FOMO_TWITTER','🚨 Les pros utilisent un secret : l''arbitrage. Acheter bas, vendre haut. ArbiTech automatise TOUT.','FOMO','TWITTER',true,NOW()),
('st_FINANCIAL_ALL','Je partage ce que j''utilise pour repérer les opportunités crypto en Afrique. P2P FCFA inclus. 🙏','FINANCIAL','ALL',true,NOW()),
('st_FOMO_ALL2','On est en 2025. Il existe des outils qui chassent les opportunités crypto POUR toi, 24h/24. 🌌','FOMO','ALL',true,NOW()),
('st_SIMPLE_WHATSAPP','Maîtrise l''arbitrage crypto sans jargon. ArbiTech : Achat ➔ Vente ➔ Profit net. 😄','SIMPLE','WHATSAPP',true,NOW())
ON CONFLICT ("id") DO UPDATE SET "text"=EXCLUDED."text";

-- Admin user (password: ArbiTech2025!)
INSERT INTO "User" ("id","email","name","passwordHash","role","status","referralCode","dailyViewsCount","dailySeenFingerprints","createdAt","updatedAt")
VALUES ('user_admin','admin@arbitech.app','Administrateur','3257888de4347270f188eea5bdbe239a:a06ac6e47255a07364b651ec3070da74bb0b27039cd331663a0e97f2a75621d9ae7d6008eacfdaa7018f1387325fe3cb0fa49e48cf0f2e80df49df37f3be0f15','ADMIN','ACTIVE','ADMIEA848B',0,'[]',NOW(),NOW())
ON CONFLICT ("email") DO NOTHING;

-- Demo Pro user (password: Demo2025!)
INSERT INTO "User" ("id","email","name","phone","passwordHash","role","status","planId","referralCode","dailyViewsCount","dailySeenFingerprints","createdAt","updatedAt")
VALUES ('user_demo','demo@arbitech.app','Démo Utilisateur','+237600000000','bddfba76905baf847884a30eeeedb344:4a03cfa7c3394a72b563d6d754dd8de08e6a1a958325dd389a44bdf5a7ae2fd10b4b735ca9c1dd13706159b6396fe2bb9fdac2775e5199284e931798f4607136','USER','ACTIVE','plan_pro','DEMO362EF6',0,'[]',NOW(),NOW())
ON CONFLICT ("email") DO NOTHING;

-- Demo subscription
INSERT INTO "Subscription" ("id","userId","planId","status","billingCycle","amount","startDate","endDate","createdAt","updatedAt")
SELECT 'sub_demo','user_demo','plan_pro','ACTIVE','MONTHLY',15000,NOW(),NOW() + INTERVAL '30 days',NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Subscription" WHERE "userId" = 'user_demo');
