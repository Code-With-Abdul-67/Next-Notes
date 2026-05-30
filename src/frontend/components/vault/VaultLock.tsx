"use client";

import { useState, useEffect } from "react";
import { Lock, KeyRound, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { Input, Card, CardBody, CardHeader } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import VaultReset from "./VaultReset";

interface VaultLockProps {
  onUnlock: (password: string) => void;
  hasVaultPassword: boolean;
  onPasswordSet: (password: string) => void;
}

export default function VaultLock({ onUnlock, hasVaultPassword, onPasswordSet }: VaultLockProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const isSetupMode = !hasVaultPassword;

  // Auto-dismiss error toast after 4 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 4) { setError("Master password must be at least 4 characters long."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/vault/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to set up master password."); }
      else { onPasswordSet(password); }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) { setError("Please enter your master password."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/vault/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Incorrect master password."); }
      else { onUnlock(password); }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const handleResetRequest = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/vault/reset-request", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send reset email.");
      } else {
        setPassword("");
        setConfirmPassword("");
        setIsResetting(true);
      }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  if (isResetting) {
    return (
      <VaultReset
        onCancel={() => setIsResetting(false)}
        onResetSuccess={() => {
          setIsResetting(false);
          setPassword("");
        }}
      />
    );
  }

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <Card className="glass-panel w-full max-w-md border border-white/10 rounded-2xl p-6 bg-black/40">
        <CardHeader className="flex flex-col gap-2 items-center text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 shadow-lg shadow-amber-500/5">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isSetupMode ? "Create Secret Vault" : "Secret Vault"}
          </h2>
          <p className="text-sm text-white/50">
            {isSetupMode
              ? "Create a master password to encrypt and secure your notes."
              : "Verify your master password to access encrypted notes."}
          </p>
        </CardHeader>

        <CardBody className="py-4">
          <form onSubmit={isSetupMode ? handleSetup : handleVerify} className="space-y-4">
            <Input
              type="password"
              label="Master Password"
              placeholder="••••••••"
              variant="flat"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              classNames={{
                inputWrapper: "glass-input text-white",
                input: "text-white placeholder:text-white/20",
                label: "text-purple-300/70",
              }}
            />
            {isSetupMode && (
              <Input
                type="password"
                label="Confirm Master Password"
                placeholder="••••••••"
                variant="flat"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                classNames={{
                  inputWrapper: "glass-input text-white",
                  input: "text-white placeholder:text-white/20",
                  label: "text-purple-300/70",
                }}
              />
            )}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: 80, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/15 backdrop-blur-md shadow-lg text-sm text-white/90 font-medium max-w-xs cursor-pointer"
                  onClick={() => setError("")}
                >
                  <AlertCircle size={15} className="text-red-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="submit"
              disabled={loading}
              className="btn-sheen w-full h-10 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {isSetupMode ? "Create Vault" : "Unlock Vault"}
            </button>
          </form>

          {!isSetupMode && (
            <div className="mt-6 flex flex-col items-center border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={handleResetRequest}
                disabled={loading}
                className="text-xs text-purple-300/70 hover:text-purple-300 font-semibold underline underline-offset-4 flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <KeyRound size={12} />
                <span>Forgot password? Send reset code to my email</span>
              </button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
