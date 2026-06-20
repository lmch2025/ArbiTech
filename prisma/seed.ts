import { db } from "../src/lib/db";
import { PLANS_SEED, PLATFORMS_SEED } from "../src/lib/constants";
import { SHARE_TEXTS } from "../src/lib/share-texts";
import { hashPassword, generateReferralCode } from "../src/lib/auth";

async function main() {
  console.log("🌱 Seeding ArbiTech database…");

  // Plans
  for (const plan of PLANS_SEED) {
    await db.plan.upsert({
      where: { code: plan.code },
      update: {},
      create: { ...plan },
    });
  }
  console.log("✓ Plans créés");

  // Platforms
  for (const p of PLATFORMS_SEED) {
    await db.platform.upsert({
      where: { code: p.code },
      update: {},
      create: {
        ...p,
        status: "ONLINE",
        lastSyncAt: new Date(),
        latencyMs: Math.floor(Math.random() * 120) + 40,
        successRate: 96 + Math.random() * 4,
      },
    });
  }
  console.log("✓ Plateformes créées");

  // Share texts
  for (const t of SHARE_TEXTS) {
    await db.shareText.upsert({
      where: { id: `st_${t.category}_${t.channel}` },
      update: { text: t.text },
      create: { id: `st_${t.category}_${t.channel}`, text: t.text, category: t.category, channel: t.channel },
    });
  }
  console.log("✓ Textes de partage créés");

  // Ambassador config
  await db.ambassadorConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", commissionType: "PERCENT", commissionValue: 20, minPayout: 5000, isActive: true },
  });
  console.log("✓ Config ambassadeur créée");

  // Admin user
  const adminEmail = "admin@arbitech.app";
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: adminEmail,
        name: "Administrateur",
        passwordHash: hashPassword("ArbiTech2025!"),
        role: "ADMIN",
        status: "ACTIVE",
        referralCode: generateReferralCode("ADMIN"),
      },
    });
    console.log("✓ Admin créé : admin@arbitech.app / ArbiTech2025!");
  }

  // Demo user
  const demoEmail = "demo@arbitech.app";
  const existingDemo = await db.user.findUnique({ where: { email: demoEmail } });
  if (!existingDemo) {
    const proPlan = await db.plan.findUnique({ where: { code: "PRO" } });
    await db.user.create({
      data: {
        email: demoEmail,
        name: "Démo Utilisateur",
        phone: "+237600000000",
        passwordHash: hashPassword("Demo2025!"),
        role: "USER",
        status: "ACTIVE",
        planId: proPlan?.id,
        referralCode: generateReferralCode("DEMO"),
        subscription: proPlan
          ? {
              create: {
                planId: proPlan.id,
                status: "ACTIVE",
                billingCycle: "MONTHLY",
                amount: proPlan.priceMonthly,
                endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
              },
            }
          : undefined,
      },
    });
    console.log("✓ Utilisateur démo créé : demo@arbitech.app / Demo2025!");
  }

  console.log("🎉 Seed terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
