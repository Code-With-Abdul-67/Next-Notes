"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Tabs,
  Tab,
} from "@nextui-org/react";
import {
  User as UserIcon,
  Trash2,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  Mail,
  Lock,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { NITRO_THEMES, useNitroTheme } from "@/frontend/context/ThemeContext";
import { motion } from "framer-motion";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name?: string | null;
    email?: string | null;
  };
  hasVaultPassword: boolean;
  onDeleteVault: () => void;
  onDeleteAccount?: () => void;
  onUpdateUserName?: (name: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  hasVaultPassword,
  onDeleteVault,
  onDeleteAccount,
  onUpdateUserName,
}: SettingsModalProps) {
  const { currentTheme, themeSettings, setTheme, resetToDefault, saveToServer } =
    useNitroTheme();

  const [activeTab, setActiveTab] = useState<string>("appearance");
  const [displayName, setDisplayName] = useState(user.name || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);

  const initials = (displayName || user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      if (res.ok) {
        setNameSavedSuccess(true);
        if (onUpdateUserName) onUpdateUserName(displayName);
        setTimeout(() => setNameSavedSuccess(false), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        saveToServer();
        onClose();
      }}
      size="2xl"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        base: "bg-[rgba(12,8,20,0.60)] border border-white/[0.07] backdrop-blur-2xl backdrop-saturate-150 text-white max-h-[85vh] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)]",
        header: "border-b border-white/[0.05] py-3 px-5",
        body: "py-3 px-5",
        footer: "border-t border-white/[0.05] py-3 px-5",
        closeButton: "hover:bg-white/8 text-white/50 hover:text-white active:scale-95 transition-all top-3 right-3",
      }}
    >
      <ModalContent>
        {() => (
          <>
            {/* ── Header ─────────────────────────────────────────── */}
            <ModalHeader className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                <Sliders size={14} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight">App Settings</span>
                <span className="text-[11px] text-white/40 font-normal leading-none mt-0.5">
                  Themes · Profile · Security
                </span>
              </div>
            </ModalHeader>

            {/* ── Body ───────────────────────────────────────────── */}
            <ModalBody className="space-y-4">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(k) => setActiveTab(k as string)}
                variant="light"
                aria-label="Settings navigation"
                classNames={{
                  tabList: "bg-white/[0.03] p-0.5 rounded-xl border border-white/[0.07] w-full gap-1",
                  cursor: "bg-gradient-to-r from-purple-600/90 to-indigo-600/90 rounded-[10px] shadow-md shadow-purple-500/20",
                  tab: "h-8 text-xs font-semibold text-white/50 data-[selected=true]:text-white transition-all px-4",
                }}
              >
                {/* ── TAB 1: THEME STYLING ──────────────────────── */}
                <Tab
                  key="appearance"
                  title={
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>Theme Styling</span>
                    </div>
                  }
                >
                  <div className="pt-3 space-y-4">

                    {/* Banner */}
                    <div className="relative overflow-hidden rounded-xl px-4 py-3 border border-purple-500/15 bg-gradient-to-r from-purple-900/25 via-indigo-900/15 to-pink-900/15">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                            <Flame size={10} /> Custom Theme
                          </span>
                          <p className="text-[11px] text-white/50 truncate">
                            Vibrant gradients, glowing glass surfaces, dark palettes.
                          </p>
                        </div>
                        <button
                          onClick={resetToDefault}
                          className="shrink-0 flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-medium text-white/50 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <RotateCcw size={11} />
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Theme grid */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                          Themes ({NITRO_THEMES.length})
                        </span>
                        <span className="text-[10px] text-white/30 font-mono">
                          Active: <span className="text-purple-400 font-semibold">{currentTheme.name}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {NITRO_THEMES.map((theme) => {
                          const isSelected =
                            themeSettings.activeThemeId === theme.id && !themeSettings.isCustom;
                          return (
                            <motion.button
                              key={theme.id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setTheme(theme.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                                isSelected
                                  ? "border-purple-500/50 bg-purple-500/12 text-white shadow-sm shadow-purple-500/10 ring-1 ring-purple-500/15"
                                  : "border-white/[0.07] bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white/80 hover:border-white/15"
                              }`}
                            >
                              <div className="flex items-center gap-0.5">
                                {theme.previewColors.map((color, i) => (
                                  <span
                                    key={i}
                                    className="w-2 h-2 rounded-full border border-black/20"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <span>{theme.name}</span>
                              {isSelected && <Check size={10} strokeWidth={3} className="text-purple-400" />}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Tab>

                {/* ── TAB 2: MY ACCOUNT ─────────────────────────── */}
                <Tab
                  key="account"
                  title={
                    <div className="flex items-center gap-1.5">
                      <UserIcon size={13} />
                      <span>My Account</span>
                    </div>
                  }
                >
                  <div className="pt-3 space-y-4">

                    {/* Profile row */}
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-white/10 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-purple-500/20 shrink-0">
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {displayName || user.name || "User"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Mail size={11} className="text-white/30 shrink-0" />
                          <span className="text-[11px] text-white/45 font-mono truncate">
                            {user.email || "No email"}
                          </span>
                          <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/25">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Name editor */}
                    <div className="flex items-end gap-2">
                      <Input
                        label="Display Name"
                        labelPlacement="outside"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                        classNames={{
                          label: "text-[11px] font-semibold text-white/50 mb-1",
                          inputWrapper: "bg-white/[0.03] border border-white/[0.08] rounded-xl h-9 hover:bg-white/[0.05] transition-colors",
                          input: "text-sm text-white placeholder:text-white/25",
                        }}
                      />
                      <Button
                        size="sm"
                        onPress={handleSaveName}
                        isLoading={isSavingName}
                        className="h-9 shrink-0 btn-primary rounded-xl text-xs px-4 mb-[1px]"
                      >
                        {nameSavedSuccess ? (
                          <span className="flex items-center gap-1 text-emerald-300">
                            <CheckCircle2 size={13} /> Saved
                          </span>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>

                    {/* Security section */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                        Security
                      </p>

                      {/* Vault row */}
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-amber-500/[0.03] border border-amber-500/12">
                        <div className="flex items-center gap-2 min-w-0">
                          <Lock size={13} className="text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-amber-300/90">Secret Vault</p>
                            <p className="text-[11px] text-white/40 truncate">
                              {hasVaultPassword
                                ? "Master password set — delete to wipe vault"
                                : "No vault password configured"}
                            </p>
                          </div>
                        </div>
                        {hasVaultPassword ? (
                          <button
                            onClick={() => { onClose(); onDeleteVault(); }}
                            className="shrink-0 px-2.5 h-7 rounded-lg text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-[11px] text-white/25 italic">Inactive</span>
                        )}
                      </div>

                      {/* Delete account row */}
                      {onDeleteAccount && (
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-red-500/[0.03] border border-red-500/12">
                          <div className="flex items-center gap-2 min-w-0">
                            <Trash2 size={13} className="text-red-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-red-300/90">Delete Account</p>
                              <p className="text-[11px] text-white/40 truncate">
                                Permanently remove account, notes & vault
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => { onClose(); onDeleteAccount(); }}
                            className="shrink-0 px-2.5 h-7 rounded-lg text-[11px] font-semibold text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>

            {/* ── Footer ─────────────────────────────────────────── */}
            <ModalFooter className="flex items-center justify-between">
              <span className="text-[11px] text-white/30">
                Changes apply instantly
              </span>
              <Button
                size="sm"
                onPress={() => { saveToServer(); onClose(); }}
                className="h-8 btn-primary rounded-xl text-xs px-5"
              >
                Done
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
