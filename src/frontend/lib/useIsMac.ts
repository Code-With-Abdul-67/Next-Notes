"use client";

import { useState, useEffect } from "react";

/**
 * Detects whether the user is on macOS/iOS at runtime.
 * Returns true on Mac/iPhone/iPad, false on Windows/Linux/Android.
 * Safe to use in SSR — returns false on the server and updates after hydration.
 */
export function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // navigator.userAgentData is the modern API (Chromium-based browsers)
    if (typeof navigator === "undefined") return;

    if ("userAgentData" in navigator && navigator.userAgentData) {
      setIsMac((navigator.userAgentData as { platform?: string }).platform === "macOS");
    } else {
      // Fallback: navigator.platform (deprecated but still widely supported)
      setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
    }
  }, []);

  return isMac;
}
