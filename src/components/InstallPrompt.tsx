"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Detect standalone PWA mode
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Check localStorage if user dismissed the prompt
    const isDismissed = localStorage.getItem("pwa-prompt-dismissed") === "true";

    if (!standalone && !isDismissed) {
      setShowPrompt(true);
    }

    // Android/Chrome beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!standalone && !isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
      localStorage.setItem("pwa-prompt-dismissed", "true");
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 glass-panel p-5 rounded-2xl border border-white/10"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Download size={20} />
            </div>
            <h4 className="font-semibold text-white">Install Next Notes</h4>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/5 rounded-full text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-white/70 mb-4 leading-relaxed">
          Install Next Notes on your device for full-screen workspace, faster loading, and offline note-taking access.
        </p>

        {isIOS ? (
          <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white/60 space-y-2">
            <div className="flex items-center gap-2">
              <Share size={14} className="text-primary" />
              <span>Tap the <strong>Share</strong> button in your Safari toolbar.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base text-primary font-bold leading-none">+</span>
              <span>Select <strong>Add to Home Screen</strong> from the list.</span>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleInstallClick}
            color="primary"
            className="w-full font-medium"
            isDisabled={!deferredPrompt}
          >
            {deferredPrompt ? "Add to Home Screen" : "Compatible Browser Required"}
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
