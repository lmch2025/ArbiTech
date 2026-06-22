"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Opportunity } from "@/lib/types";

const FRESH_MS = 6000;
const EXPIRING_MS = 30000;
const FADE_MS = 3000;

type EnrichedOpportunity = Opportunity & {
  fingerprint: string;
  firstSeenAt: number;
  isNew: boolean;
  isExpiring: boolean;
  isExpired: boolean;
  isFavorite: boolean;
};

function fingerprint(op: Opportunity): string {
  return `${op.type}:${op.pair}:${op.buyPlatformCode}:${op.sellPlatformCode}`;
}

function enrich(op: Opportunity, existing: EnrichedOpportunity | null, favorites: Set<string>): EnrichedOpportunity {
  const fp = fingerprint(op);
  const now = Date.now();
  const firstSeenAt = existing?.firstSeenAt ?? now;
  const isFavorite = favorites.has(fp);
  const expiresAt = new Date(op.expiresAt).getTime();
  const isExpired = expiresAt < now;
  const isExpiring = !isExpired && expiresAt - now < EXPIRING_MS;
  const isNew = !existing && now - firstSeenAt < FRESH_MS;
  return { ...op, fingerprint: fp, firstSeenAt, isNew, isExpiring, isExpired, isFavorite };
}

const FAVORITES_KEY = "arbitech_favorites";

function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")); } catch { return new Set(); }
}

function saveFavorites(favs: Set<string>) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs])); } catch {}
}

export type SortMode = "profit" | "profit_asc" | "confidence" | "expiry" | "newest";
export type CategoryFilter = "all" | "hot" | "p2p" | "spot" | "favorites" | "history";

export function useOpportunities() {
  const [ops, setOps] = useState<EnrichedOpportunity[]>([]);
  const [paused, setPaused] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const pausedRef = useRef(paused);
  // eslint-disable-next-line react-hooks/refs
  pausedRef.current = paused;
  const favoritesRef = useRef(favorites);
  // eslint-disable-next-line react-hooks/refs
  favoritesRef.current = favorites;

  useEffect(() => { setFavorites(loadFavorites()); }, []);

  const mergeOpportunities = useCallback((incoming: Opportunity[]) => {
    if (pausedRef.current) return;
    const now = Date.now();
    setOps((prev) => {
      const prevMap = new Map(prev.map((o) => [o.fingerprint, o]));
      const incomingFps = new Set(incoming.map((o) => fingerprint(o)));
      const updated: EnrichedOpportunity[] = [];
      const seen = new Set<string>();
      for (const o of prev) {
        const fp = o.fingerprint;
        if (incomingFps.has(fp)) {
          const incomingOp = incoming.find((i) => fingerprint(i) === fp)!;
          updated.push(enrich(incomingOp, o, favoritesRef.current));
          seen.add(fp);
        } else if (now - new Date(o.expiresAt).getTime() < FADE_MS) {
          updated.push({ ...o, isExpired: true });
          seen.add(fp);
        }
      }
      for (const o of incoming) {
        const fp = fingerprint(o);
        if (!seen.has(fp)) updated.push(enrich(o, null, favoritesRef.current));
      }
      return updated;
    });
    setLastUpdate(new Date());
  }, []);

  const toggleFavorite = useCallback((fp: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(fp)) next.delete(fp); else next.add(fp);
      saveFavorites(next);
      setOps((ops) => ops.map((o) => ({ ...o, isFavorite: next.has(o.fingerprint) })));
      return next;
    });
  }, []);

  return { ops, mergeOpportunities, toggleFavorite, paused, setPaused, favorites, lastUpdate };
}
