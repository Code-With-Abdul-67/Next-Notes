"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Sparkles } from "lucide-react";

/**
 * UpdatePrompt — shows ONLY when:
 *  1. Running as an installed PWA (display-mode: standalone) on a mobile device
 *  2. A new service worker is waiting to activate
 *
 * Never shows on desktop browsers or in a regular browser tab.
 */

function isMobilePWA(): boolean {
  if (typeof window === "undefined") return false;
  // Must be running in standalone mode (added to home screen)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  if (!isStandalone) return false;
  // Must be a mobile device (Android or iOS)
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  return isMobile;
}

export default function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updating, setUpdating] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    // Only run for mobile PWA installs
    if (!isMobilePWA()) return;
    if (!("serviceWorker" in navigator)) return;

    const registerAndWatch = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        const handleWaiting = (sw: ServiceWorker) => {
          waitingWorkerRef.current = sw;
          setShowPrompt(true);
        };

        // Already waiting (e.g. tab was in background)
        if (registration.waiting) {
          handleWaiting(registration.waiting);
          return;
        }

        // New SW starts installing
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              handleWaiting(newWorker);
            }
          });
        });

        // Poll for updates every 60s while the app is open
        const interval = setInterval(() => registration.update(), 60_000);
        return () => clearInterval(interval);
      } catch (err) {
        console.error("SW registration failed:", err);
      }
    };

    registerAndWatch();

    // Reload once the new SW takes control
    const handleControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (!waitingWorkerRef.current) return;
    setUpdating(true);
    waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          key="update-prompt"
          initial={{ opacity: 0, y: 80, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="glass-panel rounded-2xl border border-purple-500/25 p-4 shadow-2xl shadow-purple-900/40">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Sparkles size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-snug">
                  Update available
                </p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                  A new version of NEXT Notes is ready. Tap Update to get the latest features and fixes.
                </p>
              </div>
              <button
                onClick={() => setShowPrompt(false)}
                aria-label="Dismiss update"
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-white/50 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                Later
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="btn-sheen flex-[2] h-9 rounded-xl text-xs font-semibold text-white bg-primary shadow-lg shadow-purple-500/25 hover:brightness-110 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <RefreshCw size={13} className={updating ? "animate-spin" : ""} />
                {updating ? "Updating…" : "Update now"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
