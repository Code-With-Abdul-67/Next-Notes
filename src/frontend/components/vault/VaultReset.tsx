"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Input, Card, CardBody, CardHeader } from "@nextui-org/react";
import { KeyRound, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

interface VaultResetProps {
  onCancel: () => void;
  onResetSuccess: () => void;
}

export default function VaultReset({ onCancel, onResetSuccess }: VaultResetProps) {
  const [step, setStep] = useState<"code" | "password">("code");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 5-minute countdown
  useEffect(() => {
    if (timeLeft <= 0) { setIsExpired(true); return; }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
    setCode(newCode);
    if (pasted.length > 0) inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyCode = () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    if (isExpired) { setError("The code has expired. Go back and request a new one."); return; }
    setVerifiedCode(fullCode);
    setStep("password");
    setError("");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 4) { setError("New password must be at least 4 characters long."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/vault/reset-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifiedCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to reset vault password."); }
      else { onResetSuccess(); }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const timerPercentage = (timeLeft / 300) * 100;
  const timerColor = timeLeft > 120 ? "#8B5CF6" : timeLeft > 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <Card className="glass-panel w-full max-w-md border border-white/10 rounded-2xl p-6 bg-black/40">
        <CardHeader className="flex flex-col items-center text-center pb-2 gap-2">
          <button
            onClick={onCancel}
            className="self-start flex items-center gap-1.5 text-white/40 hover:text-white/80 text-xs font-medium transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Vault</span>
          </button>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-2 shadow-lg shadow-purple-500/10">
            <KeyRound size={32} />
          </div>

          <h2 className="text-xl font-bold text-white">
            {step === "code" ? "Check Your Email" : "Create New Password"}
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            {step === "code"
              ? "A 6-digit code was sent to your registered email. It expires in 5 minutes."
              : "Enter and confirm your new vault master password."}
          </p>
        </CardHeader>

        <CardBody className="py-4">
          {step === "code" ? (
            <div className="space-y-6">
              {/* Timer */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center w-20 h-20">
                  <svg className="absolute inset-0 rotate-[-90deg]" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={timerColor}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - timerPercentage / 100)}`}
                      style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
                    />
                  </svg>
                  <span style={{ color: timerColor }} className="text-sm font-bold tabular-nums z-10 transition-colors duration-500">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                {isExpired && (
                  <p className="text-xs text-red-400 font-medium">Code expired. Go back and try again.</p>
                )}
              </div>

              {/* OTP inputs */}
              <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
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
                    disabled={isExpired}
                    className={`w-11 h-12 text-center text-xl font-bold rounded-xl border-2 bg-white/5 backdrop-blur-sm outline-none transition-all ${
                      digit
                        ? "border-primary text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                        : "border-white/10 text-white/40"
                    } focus:border-primary focus:shadow-[0_0_12px_rgba(139,92,246,0.3)] disabled:opacity-40`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-xl">
                  {error}
                </p>
              )}

              <Button
                color="primary"
                className="w-full font-semibold shadow-lg shadow-purple-500/10 bg-primary"
                onPress={handleVerifyCode}
                isDisabled={isExpired || code.join("").length < 6}
                startContent={<ShieldCheck size={16} />}
              >
                Verify Code
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <Input
                type="password"
                label="New Master Password"
                placeholder="Min. 4 characters"
                variant="flat"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                classNames={{
                  inputWrapper: "glass-input",
                  input: "text-white placeholder:text-white/20",
                  label: "text-purple-300/70",
                }}
              />
              <Input
                type="password"
                label="Confirm New Password"
                placeholder="••••••••"
                variant="flat"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                classNames={{
                  inputWrapper: "glass-input",
                  input: "text-white placeholder:text-white/20",
                  label: "text-purple-300/70",
                }}
              />
              {error && (
                <p className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-xl">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                color="primary"
                className="w-full font-semibold bg-primary shadow-lg shadow-purple-500/10"
                isDisabled={loading}
                startContent={loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              >
                Reset Vault Password
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
