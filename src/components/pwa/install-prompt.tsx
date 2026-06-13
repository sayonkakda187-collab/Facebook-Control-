"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight, dismissible install hint. Hidden once the app is running as an
 * installed PWA (standalone display mode).
 */
export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  // Assume standalone until proven otherwise so the banner never flashes on load.
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari exposes navigator.standalone instead of display-mode.
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true,
    );
  }, []);

  if (isStandalone || dismissed) return null;

  return (
    <div className="mt-8 flex items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-200">Install PagePulse</p>
        <p className="mt-1 text-sm text-zinc-400">
          {isIOS
            ? "Tap the Share button, then “Add to Home Screen” to install it as an app."
            : "Open your browser menu and choose “Install app” to add PagePulse to your home screen."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      >
        Dismiss
      </button>
    </div>
  );
}
