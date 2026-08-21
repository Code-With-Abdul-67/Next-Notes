"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, Input } from "@nextui-org/react";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import Toast, { useToast } from "@/frontend/components/ui/Toast";

interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (password: string) => void;
}

export default function VaultUnlockModal({ isOpen, onClose, onUnlock }: VaultUnlockModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      addToast("error", "Please enter your vault password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/vault/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Incorrect password.");
      } else {
        setPassword("");
        onUnlock(password);
      }
    } catch {
      addToast("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => { if (!open) { setPassword(""); onClose(); } }}
        backdrop="blur"
        classNames={{
          base: "glass-panel border border-white/10 rounded-2xl bg-black/40 text-white",
          header: "border-b border-white/5 py-4",
          closeButton: "hover:bg-white/5 text-white/50 hover:text-white rounded-full",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Lock size={16} />
                </div>
                <span className="font-semibold">Vault Password Required</span>
              </ModalHeader>
              <ModalBody className="py-6">
                <p className="text-white/60 text-sm mb-4">
                  Enter your vault password to move this note to the Secret Vault.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="password"
                    label="Vault Password"
                    placeholder="••••••••"
                    variant="flat"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    classNames={{
                      inputWrapper: "glass-input",
                      input: "text-white placeholder:text-white/20",
                      label: "text-purple-300/70",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-sheen w-full h-10 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    Unlock & Move to Vault
                  </button>
                </form>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
