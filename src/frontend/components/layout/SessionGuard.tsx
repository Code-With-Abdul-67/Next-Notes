"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Timer } from "lucide-react";

/**
 * SessionGuard — client-side inactivity logout.
 *
 * Two-phase timer:
 *   1. INACTIVITY_MS of no activity  → show a warning modal with a countdown
 *   2. COUNTDOWN_S seconds of no response → sign out automatically
 *
 * Any user interaction (mouse, keyboard, touch, scroll) resets the timer
 * and dismisses the warning if it's already showing.
 */

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes idle → show warning
const COUNTDOWN_S   = 60;              // 60-second countdown before auto-logout

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;

export default function SessionGuard() {
  const [showWarning, setShowWarning]   = useState(false);
  const [countdown, setCountdown]       = useState(COUNTDOWN_S);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWarningRef    = useRef(false); // ref mirror so event handler reads latest value

  const clearCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_S);
    clearCountdown();
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCountdown();
          signOut({ callbackUrl: "/" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdown]);

  const showWarningModal = useCallback(() => {
    isWarningRef.current = true;
    setShowWarning(true);
    startCountdown();
  }, [startCountdown]);

  const resetTimer = useCallback(() => {
    // If the warning is already showing, dismiss it and reset everything
    if (isWarningRef.current) {
      isWarningRef.current = false;
      setShowWarning(false);
      clearCountdown();
      setCountdown(COUNTDOWN_S);
    }

    // Restart the inactivity timer
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(showWarningModal, INACTIVITY_MS);
  }, [showWarningModal, clearCountdown]);

  // Attach activity listeners on mount
  useEffect(() => {
    // Start the initial timer
    inactivityTimer.current = setTimeout(showWarningModal, INACTIVITY_MS);

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, resetTimer, { passive: true })
    );

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      clearCountdown();
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, resetTimer)
      );
    };
  }, [resetTimer, showWarningModal, clearCountdown]);

  const handleStayLoggedIn = () => {
    resetTimer();
  };

  const handleLogoutNow = () => {
    clearCountdown();
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    signOut({ callbackUrl: "/" });
  };

  // Progress ring dimensions
  const RADIUS = 28;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = countdown / COUNTDOWN_S;
  const ringColor =
    countdown > 30 ? "#8B5CF6" : countdown > 10 ? "#F59E0B" : "#EF4444";

  return (
    <AnimatePresence>
      {showWarning && (
        <>
          {/* Backdrop */}
          <motion.div
            key="session-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="session-modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 p-8 flex flex-col items-center text-center gap-5">
              {/* Countdown ring */}
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg
                  className="absolute inset-0 rotate-[-90deg]"
                  viewBox="0 0 72 72"
                  width={72}
                  height={72}
                >
                  {/* Track */}
                  <circle
                    cx="36" cy="36" r={RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="5"
                  />
                  {/* Progress */}
                  <circle
                    cx="36" cy="36" r={RADIUS}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
                  />
                </svg>
                <span
                  className="relative z-10 text-xl font-bold tabular-nums transition-colors duration-500"
                  style={{ color: ringColor }}
                >
                  {countdown}
                </span>
              </div>

              {/* Icon + heading */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Timer size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Still there?</h2>
                <p className="text-sm text-white/55 leading-relaxed max-w-[260px]">
                  You&apos;ve been inactive for 30 minutes. You&apos;ll be signed out automatically in{" "}
                  <span className="font-semibold text-white/80">{countdown} second{countdown !== 1 ? "s" : ""}</span>.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleLogoutNow}
                  className="btn-sheen flex-1 h-10 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
                <button
                  onClick={handleStayLoggedIn}
                  className="btn-primary flex-1 h-10 rounded-xl text-sm"
                >
                  Stay logged in
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
