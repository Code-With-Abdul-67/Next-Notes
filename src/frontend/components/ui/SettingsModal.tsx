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
  Palette,
  Shield,
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
  const { currentTheme, themeSettings, setTheme, setCustomTheme, resetToDefault, saveToServer } =
    useNitroTheme();

  const [activeTab, setActiveTab] = useState<string>("appearance");
  const [displayName, setDisplayName] = useState(user.name || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);

  // Custom theme controls state
  const [customColor, setCustomColor] = useState(themeSettings.customAccent || "#5865F2");
  const [customGradientStart, setCustomGradientStart] = useState(
    themeSettings.customBgGradientStart || "#5865F2"
  );
  const [customGradientEnd, setCustomGradientEnd] = useState(
    themeSettings.customBgGradientEnd || "#8B5CF6"
  );

  const initials = (displayName || user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

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

  const applyCustomColor = (color: string) => {
    setCustomColor(color);
    setCustomTheme({
      customAccent: color,
    });
  };

  const applyCustomGradients = (start: string, end: string) => {
    setCustomGradientStart(start);
    setCustomGradientEnd(end);
    setCustomTheme({
      customBgGradientStart: start,
      customBgGradientEnd: end,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        saveToServer();
        onClose();
      }}
      size="3xl"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        base: "bg-zinc-950/95 border border-white/10 backdrop-blur-2xl text-white max-h-[90vh] rounded-3xl shadow-2xl",
        header: "border-b border-white/5 pb-3 pt-5 px-6",
        body: "py-4 px-6",
        footer: "border-t border-white/5 py-4 px-6",
        closeButton: "hover:bg-white/10 text-white/70 active:scale-95 transition-all",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sliders size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight">App Settings</span>
                <span className="text-xs text-white/50 font-normal">
                  Customize themes, manage profile & security
                </span>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(k) => setActiveTab(k as string)}
                variant="light"
                aria-label="Settings navigation"
                classNames={{
                  tabList: "bg-white/5 p-1 rounded-2xl border border-white/5 w-full gap-2",
                  cursor: "bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-md",
                  tab: "h-9 text-xs font-semibold text-white/70 data-[selected=true]:text-white transition-all",
                }}
              >
                {/* ─── TAB 1: DISCORD NITRO THEMES ─────────────────────────────── */}
                <Tab
                  key="appearance"
                  title={
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Theme & Nitro Styling</span>
                    </div>
                  }
                >
                  <div className="pt-3 space-y-6">
                    {/* Nitro Header Banner */}
                    <div className="relative overflow-hidden rounded-2xl p-5 border border-purple-500/20 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-pink-900/20 backdrop-blur-md">
                      <div className="relative z-10 flex items-start justify-between gap-4">
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm flex items-center gap-1">
                              <Flame size={12} /> Nitro Unlocked
                            </span>
                            <h3 className="text-base font-bold text-white">
                              Discord Nitro Themes
                            </h3>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed">
                            Personalize your workspace with vibrant gradients, glowing glass surfaces, and tailored dark palettes.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<RotateCcw size={13} />}
                          onPress={resetToDefault}
                          className="bg-white/10 hover:bg-white/15 text-white/80 text-xs rounded-xl border border-white/5 shrink-0"
                        >
                          Reset Default
                        </Button>
                      </div>
                    </div>

                    {/* Preset Theme Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">
                          Nitro Preset Collection ({NITRO_THEMES.length})
                        </h4>
                        <span className="text-[11px] text-white/40 font-mono">
                          Live Active: <span className="text-purple-400 font-semibold">{currentTheme.name}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {NITRO_THEMES.map((theme) => {
                          const isSelected =
                            themeSettings.activeThemeId === theme.id && !themeSettings.isCustom;
                          return (
                            <motion.button
                              key={theme.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setTheme(theme.id)}
                              className={`relative text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between h-28 overflow-hidden group ${
                                isSelected
                                  ? "border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                                  : "border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]"
                              }`}
                            >
                              {/* Background Gradient Preview swatch */}
                              <div
                                className="absolute inset-0 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none"
                                style={{
                                  background: `linear-gradient(135deg, ${theme.previewColors[0]}, ${theme.previewColors[1]}, ${theme.previewColors[2]})`,
                                }}
                              />

                              <div className="relative z-10 flex items-start justify-between w-full">
                                <span className="font-bold text-sm text-white tracking-tight">
                                  {theme.name}
                                </span>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-md">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </div>

                              <div className="relative z-10 space-y-2">
                                <p className="text-[11px] text-white/50 line-clamp-1">
                                  {theme.description}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  {theme.previewColors.map((color, i) => (
                                    <div
                                      key={i}
                                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Color Palette Studio */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Palette size={16} className="text-purple-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                          Custom Accent Colors
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {[
                          { name: "Blurple", hex: "#5865F2" },
                          { name: "Cyan Neon", hex: "#00F2FE" },
                          { name: "Emerald", hex: "#10B981" },
                          { name: "Sunset Orange", hex: "#FF4B2B" },
                          { name: "Sakura Pink", hex: "#F67280" },
                          { name: "Crimson", hex: "#EF4444" },
                          { name: "Gold", hex: "#F59E0B" },
                          { name: "Synth Magenta", hex: "#EC4899" },
                          { name: "Electric Indigo", hex: "#8B5CF6" },
                          { name: "Pure White", hex: "#FFFFFF" },
                        ].map((swatch) => (
                          <button
                            key={swatch.hex}
                            onClick={() => applyCustomColor(swatch.hex)}
                            className="group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 transition-all text-xs text-white/80 hover:text-white"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full shadow-sm"
                              style={{ backgroundColor: swatch.hex }}
                            />
                            <span>{swatch.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Manual Hex Input */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <label className="text-xs text-white/60 shrink-0">Custom Hex:</label>
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => applyCustomColor(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                          />
                          <Input
                            size="sm"
                            value={customColor}
                            onChange={(e) => applyCustomColor(e.target.value)}
                            className="max-w-[120px]"
                            classNames={{
                              inputWrapper: "bg-white/5 border border-white/10 rounded-xl h-8",
                              input: "text-xs font-mono uppercase text-white",
                            }}
                          />
                        </div>

                        <span className="text-[11px] text-white/40">
                          Instantly recolors buttons, active navigation, search glows and border accents.
                        </span>
                      </div>
                    </div>
                  </div>
                </Tab>

                {/* ─── TAB 2: MY ACCOUNT & PROFILE ─────────────────────────────── */}
                <Tab
                  key="account"
                  title={
                    <div className="flex items-center gap-2">
                      <UserIcon size={14} />
                      <span>My Account</span>
                    </div>
                  }
                >
                  <div className="pt-3 space-y-6">
                    {/* User Profile Card */}
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-white/10 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-purple-500/20 shrink-0">
                        {initials}
                      </div>

                      <div className="flex-1 space-y-4 w-full text-center sm:text-left">
                        <div>
                          <h3 className="text-base font-bold text-white">
                            {displayName || user.name || "User"}
                          </h3>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                            <Mail size={13} className="text-white/40" />
                            <span className="text-xs text-white/60 font-mono">
                              {user.email || "No email linked"}
                            </span>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Logged In
                            </span>
                          </div>
                        </div>

                        {/* Name editor input */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                          <Input
                            label="Display Name"
                            labelPlacement="outside"
                            placeholder="Enter your name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            classNames={{
                              label: "text-xs font-semibold text-white/60",
                              inputWrapper: "bg-white/5 border border-white/10 rounded-xl",
                              input: "text-sm text-white",
                            }}
                          />
                          <Button
                            size="md"
                            onPress={handleSaveName}
                            isLoading={isSavingName}
                            className="mt-4 sm:mt-6 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs px-5 shadow-lg shadow-purple-600/30 shrink-0"
                          >
                            {nameSavedSuccess ? (
                              <span className="flex items-center gap-1 text-emerald-300">
                                <CheckCircle2 size={14} /> Saved
                              </span>
                            ) : (
                              "Update Name"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Security & Vault Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">
                        Vault & Account Security
                      </h4>

                      {/* Delete Vault Option */}
                      <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Lock size={15} className="text-amber-400" />
                            <h5 className="text-sm font-bold text-amber-300">
                              Private Vault Management
                            </h5>
                          </div>
                          <p className="text-xs text-white/60">
                            {hasVaultPassword
                              ? "Reset your master vault password and wipe encrypted vault notes safely."
                              : "No master vault password currently configured on this account."}
                          </p>
                        </div>
                        {hasVaultPassword ? (
                          <Button
                            size="sm"
                            onPress={() => {
                              onClose();
                              onDeleteVault();
                            }}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-xl text-xs border border-amber-500/30 shrink-0"
                          >
                            Delete Vault
                          </Button>
                        ) : (
                          <span className="text-xs text-white/40 italic">Vault Inactive</span>
                        )}
                      </div>

                      {/* Delete Account Option */}
                      {onDeleteAccount && (
                        <div className="p-4 rounded-2xl bg-red-500/[0.04] border border-red-500/20 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Trash2 size={15} className="text-red-400" />
                              <h5 className="text-sm font-bold text-red-300">Delete Entire Account</h5>
                            </div>
                            <p className="text-xs text-white/60">
                              Permanently remove your account, profile, all notes, vault items, and to-do lists.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onPress={() => {
                              onClose();
                              onDeleteAccount();
                            }}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold rounded-xl text-xs border border-red-500/30 shrink-0"
                          >
                            Delete Account
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>

            <ModalFooter className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">
                Changes apply instantly across your whole workspace
              </span>
              <Button
                size="sm"
                onPress={() => {
                  saveToServer();
                  onClose();
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs px-6 shadow-md"
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
