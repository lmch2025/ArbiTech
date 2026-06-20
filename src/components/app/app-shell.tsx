"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { Navbar } from "@/components/app/navbar";
import { SiteFooter } from "@/components/app/site-footer";
import { FloatingShare } from "@/components/app/floating-share";
import { LandingView } from "@/components/app/views/landing-view";
import { AuthView } from "@/components/app/views/auth-view";
import { DashboardView } from "@/components/app/views/dashboard-view";
import { AdminView } from "@/components/app/views/admin-view";
import { AmbassadorView } from "@/components/app/views/ambassador-view";
import { PricingView } from "@/components/app/views/pricing-view";
import { BlogView } from "@/components/app/views/blog-view";
import { ToolsView } from "@/components/app/views/tools-view";
import { ProfileView } from "@/components/app/views/profile-view";
import { LegalView } from "@/components/app/views/legal-view";
import type { PlanInfo, PlatformInfo, UserInfo, Opportunity } from "@/lib/types";

type InitialCatalog = {
  plans: PlanInfo[];
  platforms: PlatformInfo[];
  planLabels: Record<string, { label: string; tone: string }>;
};

export function AppShell({
  initialCatalog,
  initialUser,
  initialOpportunities,
}: {
  initialCatalog: InitialCatalog;
  initialUser: UserInfo | null;
  initialOpportunities: Opportunity[];
}) {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const refreshUser = useApp((s) => s.refreshUser);
  const loadCatalog = useApp((s) => s.loadCatalog);
  const setCatalog = useApp((s) => s.setCatalog);
  const setUser = useApp((s) => s.setUser);
  const setLoadingUser = useApp((s) => s.setLoadingUser);
  const setReferralCode = useApp((s) => s.setReferralCode);

  // Seed store with SSR data immediately (avoids flash, keeps SEO content)
  useEffect(() => {
    setCatalog(initialCatalog.plans, initialCatalog.platforms);
    if (initialUser) {
      setUser(initialUser);
    }
    setLoadingUser(false);

    // Hydrate view + referral from URL
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const v = url.searchParams.get("view");
      const ref = url.searchParams.get("ref");
      if (v && ["landing", "auth", "dashboard", "admin", "ambassador", "pricing", "blog", "tools", "profile", "legal"].includes(v)) {
        useApp.setState({ view: v as never });
      }
      if (ref) {
        setReferralCode(ref.toUpperCase());
      }
    }
    // Soft refresh in background to sync any changes
    refreshUser();
    loadCatalog();
  }, []);

  // Guards
  const user = useApp((s) => s.user);
  const loadingUser = useApp((s) => s.loadingUser);

  useEffect(() => {
    if (!loadingUser) {
      if (view === "admin" && (!user || user.role !== "ADMIN")) {
        setView("auth");
      }
      if (view === "dashboard" && !user) {
        setView("auth");
      }
    }
  }, [view, user, loadingUser, setView]);

  return (
    <div className="relative min-h-screen flex flex-col aurora-bg">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {view === "landing" && <LandingView initialOpportunities={initialOpportunities} />}
        {view === "auth" && <AuthView />}
        {view === "pricing" && <PricingView />}
        {view === "dashboard" && <DashboardView />}
        {view === "admin" && <AdminView />}
        {view === "ambassador" && <AmbassadorView />}
        {view === "blog" && <BlogView />}
        {view === "tools" && <ToolsView />}
        {view === "profile" && <ProfileView />}
        {view === "legal" && <LegalView />}
      </main>
      <SiteFooter />
      <FloatingShare />
    </div>
  );
}
