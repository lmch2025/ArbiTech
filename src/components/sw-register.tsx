"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && !window.location.hostname.includes("localhost") === false) {
      // register in dev too for testing
    }
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          /* silent */
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
