"use client";

import { useState } from "react";
import { Lock, KeyRound, Loader2, ArrowRight } from "lucide-react";
import { Input, Card, CardBody, CardHeader } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import VaultReset from "./VaultReset";
import Toast, { useToast } from "@/frontend/components/ui/Toast";

interface VaultLockProps {
  onUnlock: (password: string) => void;
  hasVaultPassword: boolean;
  onPasswordSet: (password: string) => void;
}

type PasswordStrength = "empty" | "weak" | "normal" | "excellent";

function getPasswordStrength(pwd: string): PasswordStrength {
  if (!pwd) return "empty";
  if (pwd.length < 6) return "weak";
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
  const variety = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  if (pwd.length >= 10 && variety >= 3) return "excellent";
  return "normal";
}

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; barColor: string; segments: number }> = {
  empty:     { label: "",          color: "text-white/30",   barColor: "bg-white/10",    segments: 0 },
  weak:      { label: "Weak",      color: "text-red-400",    barColor: "bg-red-500",     segments: 1 },
  normal:    { label: "Normal",    color: "text-yellow-400", barColor: "bg-yellow-400",  segments: 2 },
  excellent: { label: "Excellent", color: "text-green-400",  barColor: "bg-green-500",   segments: 3 },
};

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((seg) => (
          <motion.div
            key={seg}
            className="h-1.5 flex-1 rounded-full overflow-hidden bg-white/10"
          >
            <motion.div
              className={`h-full rounded-full ${seg <= config.segments ? config.barColor : "bg-transparent"}`}
              initial={{ width: 0 }}
              animate={{ width: seg <= config.segments ? "100%" : "0%" }}
              transition={{ duration: 0.3, ease: "easeOut", delay: seg * 0.05 }}
            />
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/30">
          {password.length > 0 ? `${password.length} characters` : ""}
        </span>
        <AnimatePresence mode="wait">
          {strength !== "empty" && (
            <motion.span
              key={strength}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className={`text-[11px] font-semibold ${config.color}`}
            >
              {config.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function VaultLock({ onUnlock, hasVaultPassword, onPasswordSet }: VaultLockProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const isSetupMode = !hasVaultPassword;
  const { toasts, addToast, removeToast } = useToast();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) { addToast("error", "Master password must be at least 4 characters long."); return; }
    if (password !== confirmPassword) { addToast("error", "Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/vault/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { addToast("error", data.error || "Failed to set up master password."); }
      else { onPasswordSet(password); }
    } catch { addToast("error", "Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { addToast("error", "Please enter your master password."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/vault/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { addToast("error", data.error || "Incorrect master password."); }
      else { onUnlock(password); }
    } catch { addToast("error", "Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const handleResetRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault/reset-request", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Failed to send reset email.");
      } else {
        setPassword("");
        setConfirmPassword("");
        setIsResetting(true);
      }
    } catch { addToast("error", "Something went wrong. Please try again."); }
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
    <>
      <Toast toasts={toasts} onRemove={removeToast} />
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
              <div className="space-y-2">
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
                {isSetupMode && <PasswordStrengthBar password={password} />}
              </div>
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
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-10 rounded-xl flex items-center justify-center gap-2"
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
    </>
  );
}
