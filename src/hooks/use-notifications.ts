"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const PREFS_KEY = "arbitech_notif_prefs";

type NotifPrefs = {
  pushEnabled: boolean;
  soundEnabled: boolean;
};

const DEFAULT_PREFS: NotifPrefs = {
  pushEnabled: false,
  soundEnabled: false,
};

function loadPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

function savePrefs(prefs: NotifPrefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

/**
 * Hook pour gérer les notifications Web Push (locales, via Service Worker).
 * - Vérifie la permission Notification
 * - Demande la permission si besoin
 * - Affiche des notifications natives via le SW quand showOpportunity() est appelé
 * - Persiste les préférences dans localStorage
 */
export function useNotifications() {
  // Lazy initializers — SSR-safe (default values on server, real values on client first paint)
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "default";
    return Notification.permission;
  });
  const [prefs, setPrefs] = useState<NotifPrefs>(() => loadPrefs());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe mount flag for UI gating
    setMounted(true);
  }, []);

  const swRef = useRef<ServiceWorkerRegistration | null>(null);

  // Pré-enregistre la référence du SW pour les notifications
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then((reg) => {
        swRef.current = reg || null;
      })
      .catch(() => {});
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch {
      return false;
    }
  }, []);

  /**
   * Active les notifications push :
   * 1. Demande la permission Notification
   * 2. Récupère la clé publique VAPID depuis l'API
   * 3. S'abonne via PushManager.subscribe (applicationServerKey = VAPID publique)
   * 4. Enregistre l'abonnement côté serveur (POST /api/notifications/subscribe)
   */
  const enablePush = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }
    const granted = await requestPermission();
    if (!granted) return false;

    try {
      // Récupère la clé VAPID publique
      const vapidRes = await fetch("/api/notifications/vapid-public");
      const vapidData = await vapidRes.json();
      if (!vapidData.publicKey) {
        console.error("[push] VAPID public key manquante côté serveur");
        return false;
      }

      // Convertit la clé VAPID (base64url) en ArrayBuffer pour applicationServerKey
      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);

      // Récupère le service worker et s'abonne
      const reg = (await navigator.serviceWorker.getRegistration("/sw.js")) || (await navigator.serviceWorker.register("/sw.js"));
      swRef.current = reg;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true, // obligatoire : les notifs doivent être visibles
        applicationServerKey,
      });

      // Enregistre l'abonnement côté serveur
      const subJson = subscription.toJSON();
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      const newPrefs = { ...prefs, pushEnabled: true };
      setPrefs(newPrefs);
      savePrefs(newPrefs);
      return true;
    } catch (err) {
      console.error("[push] subscribe error:", err);
      return false;
    }
  }, [prefs, requestPermission]);

  /**
   * Désactive les notifications push :
   * 1. Récupère l'abonnement actuel
   * 2. Se désabonne du PushManager
   * 3. Notifie le serveur (POST /api/notifications/unsubscribe)
   */
  const disablePush = useCallback(async () => {
    const newPrefs = { ...prefs, pushEnabled: false };
    setPrefs(newPrefs);
    savePrefs(newPrefs);

    try {
      if (swRef.current) {
        const sub = await swRef.current.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/notifications/unsubscribe", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
      }
    } catch (err) {
      console.error("[push] unsubscribe error:", err);
    }
  }, [prefs]);

  const toggleSound = useCallback(() => {
    const newPrefs = { ...prefs, soundEnabled: !prefs.soundEnabled };
    setPrefs(newPrefs);
    savePrefs(newPrefs);
  }, [prefs]);

  /**
   * Affiche une notification native pour une opportunité chaude.
   * Ne fait rien si : notifications désactivées, permission refusée, ou document caché.
   * Joue aussi un son si soundEnabled.
   */
  const showOpportunity = useCallback(
    (opts: { pair: string; profit: number; buyPlatform: string; sellPlatform: string }) => {
      if (!prefs.pushEnabled) return;
      if (permission !== "granted") return;
      // Ne pas notifier si l'onglet est actif (l'utilisateur voit déjà le toast in-app)
      if (typeof document !== "undefined" && !document.hidden) return;

      const title = `🔥 Opportunité chaude : ${opts.pair}`;
      const body = `${opts.buyPlatform} → ${opts.sellPlatform} · +${opts.profit.toFixed(2)}% de profit`;

      // Essaie via le Service Worker (pour le crédit de l'app + fonctionne même tab fermée en PWA installée)
      if (swRef.current) {
        swRef.current.showNotification(title, {
          body,
          icon: "/icon.svg",
          badge: "/icon.svg",
          tag: "arbitech-opportunity",
          renotify: true,
          vibrate: [120, 60, 120],
          data: { url: "/" },
        });
      } else if (typeof Notification !== "undefined") {
        // Fallback : notification directe
        try {
          new Notification(title, { body, icon: "/icon.svg", tag: "arbitech-opportunity" });
        } catch {}
      }

      // Son (synthèse Web Audio, pas de fichier requis)
      if (prefs.soundEnabled && typeof window !== "undefined") {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch {}
      }
    },
    [prefs.pushEnabled, prefs.soundEnabled, permission]
  );

  return {
    mounted,
    permission,
    pushEnabled: prefs.pushEnabled,
    soundEnabled: prefs.soundEnabled,
    supported: typeof window !== "undefined" && "Notification" in window && "PushManager" in window,
    requestPermission,
    enablePush,
    disablePush,
    toggleSound,
    showOpportunity,
  };
}

/**
 * Convertit une clé publique VAPID base64url en ArrayBuffer (requis par PushManager.subscribe).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof atob !== "undefined" ? atob(base64) : "";
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
