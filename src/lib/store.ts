"use client";

import { create } from "zustand";
import type { PlanInfo, PlatformInfo, UserInfo, View, PlanCode } from "@/lib/types";

type AppState = {
  // navigation
  view: View;
  setView: (v: View) => void;
  pendingPlan: PlanCode | null;
  setPendingPlan: (p: PlanCode | null) => void;

  // auth
  user: UserInfo | null;
  setUser: (u: UserInfo | null) => void;
  loadingUser: boolean;
  setLoadingUser: (b: boolean) => void;

  // catalog
  plans: PlanInfo[];
  platforms: PlatformInfo[];
  setCatalog: (plans: PlanInfo[], platforms: PlatformInfo[]) => void;

  // ui
  authMode: "login" | "register";
  setAuthMode: (m: "login" | "register") => void;
  referralCode: string | null;
  setReferralCode: (c: string | null) => void;
  shareOpen: boolean;
  setShareOpen: (b: boolean) => void;

  // actions
  refreshUser: () => Promise<void>;
  loadCatalog: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useApp = create<AppState>((set, get) => ({
  view: "landing",
  setView: (v) => {
    set({ view: v });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (v === "landing") url.searchParams.delete("view");
      else url.searchParams.set("view", v);
      window.history.replaceState({}, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  pendingPlan: null,
  setPendingPlan: (p) => set({ pendingPlan: p }),

  user: null,
  setUser: (u) => set({ user: u }),
  loadingUser: true,
  setLoadingUser: (b) => set({ loadingUser: b }),

  plans: [],
  platforms: [],
  setCatalog: (plans, platforms) => set({ plans, platforms }),

  authMode: "login",
  setAuthMode: (m) => set({ authMode: m }),
  referralCode: null,
  setReferralCode: (c) => set({ referralCode: c }),
  shareOpen: false,
  setShareOpen: (b) => set({ shareOpen: b }),

  refreshUser: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user });
      } else {
        set({ user: null });
      }
    } catch {
      set({ user: null });
    } finally {
      set({ loadingUser: false });
    }
  },

  loadCatalog: async () => {
    try {
      const res = await fetch("/api/plans");
      if (res.ok) {
        const data = await res.json();
        set({ plans: data.plans, platforms: data.platforms });
      }
    } catch {
      /* ignore */
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null, view: "landing" });
  },
}));
