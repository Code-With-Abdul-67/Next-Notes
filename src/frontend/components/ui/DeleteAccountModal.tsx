"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/react";
import { Trash2, ShieldAlert, HeartCrack, Loader2, Mail } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

type Step = "otp" | "goodbye";

const OTP_TIMEOUT = 60;

export default function DeleteAccountModal({
  isOpen,
  onClose,
  userEmail,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<Step>("otp");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(OTP_TIMEOUT);
  const [isExpired, setIsExpired] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset everything when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("otp");
      setCode(["", "", "", "", "", ""]);
      setTimeLeft(OTP_TIMEOUT);
      setIsExpired(false);
      setError("");
      setCodeSent(false);
      setIsSending(false);
      setIsVerifying(false);
    }
  }, [isOpen]);

  // Countdown timer — starts after code is sent
  useEffect(() => {
    if (!codeSent || isExpired) return;
    if (timeLeft <= 0) { setIsExpired(true); return; }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [codeSent, isExpired, timeLeft]);

  // Auto-focus first input after code sent
  useEffect(() => {
    if (codeSent) setTimeout(() => inputRefs.current[0]?.focus(), 80);
  }, [codeSent]);

  const sendCode = async () => {
    setIsSending(true);
    setError("");
    try {
      const res = await fetch("/api/user/delete-request", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send code."); return; }
      setCodeSent(true);
      setTimeLeft(OTP_TIMEOUT);
      setIsExpired(false);
      setCode(["", "", "", "", "", ""]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    if (pasted.length > 0)
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) { setError("Enter the complete 6-digit code."); return; }
    if (isExpired) { setError("Code expired. Request a new one."); return; }
    setIsVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/user/delete-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed."); return; }
      // Show goodbye screen then sign out
      setStep("goodbye");
      setTimeout(() => signOut({ callbackUrl: "/" }), 4000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Arc timer
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const progress = timeLeft / OTP_TIMEOUT;
  const timerColor = timeLeft > 30 ? "#a78bfa" : timeLeft > 15 ? "#f59e0b" : "#ef4444";

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open && step !== "goodbye") onClose(); }}
      backdrop="blur"
      hideCloseButton={step === "goodbye"}
      classNames={{
        wrapper: "backdrop-blur-sm",
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "bg-[rgba(12,6,18,0.70)] border border-white/[0.07] backdrop-blur-2xl backdrop-saturate-150 text-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.03)] max-w-md",
        header: "border-b border-white/[0.05] py-4 px-5",
        body: "px-5 py-5",
        closeButton: "hover:bg-white/8 text-white/40 hover:text-white active:scale-95 transition-all top-3 right-3",
      }}
    >
      <ModalContent>
        {() => (
          <AnimatePresence mode="wait">

            {/* ── OTP step ─────────────────────────────────────── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ModalHeader className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/25 flex items-center justify-center shrink-0">
                    <Trash2 size={14} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Delete Account</p>
                    <p className="text-[11px] text-white/40 font-normal leading-none mt-0.5">
                      This is permanent and cannot be undone
                    </p>
                  </div>
                </ModalHeader>

                <ModalBody className="space-y-5">
                  {/* What gets deleted */}
                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/15">
                    <ShieldAlert size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-300/80 leading-relaxed">
                      All notes, vault content, and tasks will be <strong className="text-red-300">permanently deleted</strong>. We will send a 6-digit confirmation code to <strong className="text-white/70">{userEmail}</strong>.
                    </p>
                  </div>

                  {!codeSent ? (
                    /* Send code CTA */
                    <div className="space-y-3">
                      <button
                        onClick={sendCode}
                        disabled={isSending}
                        className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600/80 hover:bg-red-600 border border-red-500/30 shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSending ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Mail size={15} />
                        )}
                        {isSending ? "Sending code…" : "Send Confirmation Code"}
                      </button>
                      <button
                        onClick={onClose}
                        className="w-full h-9 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
                      >
                        Cancel
                      </button>
                      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                    </div>
                  ) : (
                    /* OTP entry */
                    <div className="space-y-5">
                      {/* Timer + OTP inputs side by side */}
                      <div className="flex items-center gap-5">
                        {/* Circular timer */}
                        <div className="shrink-0 relative flex items-center justify-center w-14 h-14">
                          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 60 60" width="56" height="56">
                            <circle cx="30" cy="30" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                            <circle
                              cx="30" cy="30" r={radius} fill="none"
                              stroke={timerColor} strokeWidth="4" strokeLinecap="round"
                              strokeDasharray={circ}
                              strokeDashoffset={circ * (1 - progress)}
                              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
                            />
                          </svg>
                          <span className="text-xs font-bold tabular-nums z-10" style={{ color: timerColor }}>
                            {timeLeft}s
                          </span>
                        </div>

                        {/* 6-digit inputs */}
                        <div className="flex gap-1.5" onPaste={handlePaste}>
                          {code.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => { inputRefs.current[i] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleCodeChange(i, e.target.value)}
                              onKeyDown={(e) => handleCodeKeyDown(i, e)}
                              disabled={isExpired || isVerifying}
                              className={`w-9 h-11 text-center text-lg font-bold rounded-lg border-2 bg-white/[0.04] outline-none transition-all
                                ${digit ? "border-red-500/60 text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-white/10 text-white/30"}
                                focus:border-red-500/70 focus:shadow-[0_0_10px_rgba(239,68,68,0.25)]
                                disabled:opacity-40`}
                            />
                          ))}
                        </div>
                      </div>

                      {isExpired && (
                        <p className="text-xs text-red-400 text-center -mt-2">
                          Code expired.{" "}
                          <button onClick={sendCode} className="underline hover:text-red-300 transition-colors">
                            Send a new one
                          </button>
                        </p>
                      )}

                      {error && <p className="text-xs text-red-400 text-center -mt-2">{error}</p>}

                      <button
                        onClick={handleVerify}
                        disabled={code.join("").length < 6 || isExpired || isVerifying}
                        className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600/80 hover:bg-red-600 border border-red-500/30 shadow-lg shadow-red-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isVerifying ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                        {isVerifying ? "Deleting account…" : "Confirm & Delete Account"}
                      </button>

                      <button
                        onClick={onClose}
                        className="w-full h-8 rounded-xl text-xs font-medium text-white/30 hover:text-white/60 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </ModalBody>
              </motion.div>
            )}

            {/* ── Goodbye step ─────────────────────────────────── */}
            {step === "goodbye" && (
              <motion.div
                key="goodbye"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <ModalBody className="py-10 flex flex-col items-center text-center gap-5">
                  {/* Animated heart */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-red-500/20 border border-pink-500/20 flex items-center justify-center"
                  >
                    <HeartCrack size={30} className="text-pink-400" />
                  </motion.div>

                  <div className="space-y-2 max-w-xs">
                    <h2 className="text-lg font-bold text-white">We're sad to see you go</h2>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Your account and all data have been permanently deleted. We hope our paths cross again someday. Take care.
                    </p>
                  </div>

                  {/* Signing out indicator */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.07]">
                    <Loader2 size={12} className="animate-spin text-white/40" />
                    <span className="text-[11px] text-white/40">Signing you out…</span>
                  </div>

                  {/* Animated progress bar */}
                  <motion.div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4, ease: "linear" }}
                    />
                  </motion.div>
                </ModalBody>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </ModalContent>
    </Modal>
  );
}
