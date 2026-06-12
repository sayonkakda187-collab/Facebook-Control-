"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) in production only.
 * Disabled in development to avoid caching/HMR interference.
 */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Registration failures are non-fatal for the dashboard.
    });
  }, []);

  return null;
}
