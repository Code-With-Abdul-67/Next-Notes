"use client";

import { Folder, Lock, Trash2, LogOut, Plus, ChevronLeft, ChevronRight, Menu, UserX, AlertTriangle, CheckSquare, Settings } from "lucide-react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import ConfirmationModal from "@/frontend/components/ui/ConfirmationModal";

interface SidebarProps {
  currentView: "all" | "vault" | "bin" | "todos";
  onViewChange: (view: "all" | "vault" | "bin" | "todos") => void;
  onNewNote: () => void;
  onOpenSettings: () => void;
  user: {
    name?: string | null;
    email?: string | null;
  };
  hasVaultPassword: boolean;
  onDeleteVault: () => void;
  onDeleteAccount?: () => void;
  noteCounts?: { all: number; vault: number; bin: number; todos?: number };
}

const NAV_ITEMS = [
  {
    id: "all" as const,
    label: "All Notes",
    icon: Folder,
    activeClass: "bg-blue-500/20 text-blue-300 border-blue-500/20 shadow-blue-500/5",
    hoverClass: "hover:bg-blue-500/10 hover:text-blue-200 hover:border-blue-500/10",
    iconActive: "text-blue-400",
    sheenColor: "via-blue-400/[0.10]",
  },
  {
    id: "todos" as const,
    label: "To-Do Lists",
    icon: CheckSquare,
    activeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/20 shadow-emerald-500/5",
    hoverClass: "hover:bg-emerald-500/10 hover:text-emerald-200 hover:border-emerald-500/10",
    iconActive: "text-emerald-400",
    sheenColor: "via-emerald-400/[0.10]",
  },
  {
    id: "vault" as const,
    label: "Secret Vault",
    icon: Lock,
    activeClass: "bg-amber-500/20 text-amber-300 border-amber-500/20 shadow-amber-500/5",
    hoverClass: "hover:bg-amber-500/10 hover:text-amber-200 hover:border-amber-500/10",
    iconActive: "text-amber-400",
    sheenColor: "via-amber-400/[0.10]",
  },
  {
    id: "bin" as const,
    label: "Recycle Bin",
    icon: Trash2,
    activeClass: "bg-red-500/20 text-red-300 border-red-500/20 shadow-red-500/5",
    hoverClass: "hover:bg-red-500/10 hover:text-red-200 hover:border-red-500/10",
    iconActive: "text-red-400",
    sheenColor: "via-red-400/[0.10]",
  },
] as const;

/** Returns true once the viewport is ≥ 768px (Tailwind's md breakpoint). */
function useIsMd() {
  const [isMd, setIsMd] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(min-width: 768px)").matches;
    }
    return false;
  });
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMd;
}

// ─── Shared sidebar body ──────────────────────────────────────────────────────

interface SidebarContentProps {
  currentView: "all" | "vault" | "bin" | "todos";
  isCollapsed: boolean;
  onNavClick: (view: "all" | "vault" | "bin" | "todos") => void;
  onNewNote: () => void;
  onOpenSettings: () => void;
  user: { name?: string | null; email?: string | null };
  hasVaultPassword: boolean;
  onDeleteVault: () => void;
  onDeleteAccount?: () => void;
  onLogout: () => void;
  noteCounts?: { all: number; vault: number; bin: number; todos?: number };
}

function SidebarContent({
  currentView,
  isCollapsed,
  onNavClick,
  onNewNote,
  onOpenSettings,
  user,
  hasVaultPassword,
  onDeleteVault,
  onDeleteAccount,
  onLogout,
  noteCounts,
}: SidebarContentProps) {
  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex flex-col h-full justify-between p-4 relative z-10 select-none">
      <div className="space-y-6">
        {/* Header / Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-purple-500/20">
            <Image src="/favicon.ico" alt="Logo" width={24} height={24} className="object-contain" />
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              <span className="font-bold text-white tracking-wide text-sm">NEXT Notes</span>
              <span className="text-[10px] text-purple-400 font-medium tracking-wider uppercase">Workspace</span>
            </motion.div>
          )}
        </div>

        {/* New Note Button */}
        <div className="px-1">
          <Button
            onPress={onNewNote}
            className={`btn-sheen w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-900/40 border border-purple-400/20 transition-all rounded-xl ${
              isCollapsed ? "px-0 min-w-0 h-10" : "h-10"
            }`}
            isIconOnly={isCollapsed}
          >
            <Plus size={18} />
            {!isCollapsed && <span className="ml-1 text-sm font-semibold">New Note</span>}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`relative group overflow-hidden w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? item.activeClass
                    : `text-white/60 border-transparent ${item.hoverClass}`
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  <div className={`absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent ${item.sheenColor} to-transparent skew-x-12 transform -translate-x-full transition-transform duration-1000 ease-out group-hover:translate-x-[400%]`} />
                </div>
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <Icon size={18} className={isActive ? item.iconActive : ""} />
                  {!isCollapsed && <span>{item.label}</span>}
                  {!isCollapsed && noteCounts && noteCounts[item.id] !== undefined && noteCounts[item.id]! > 0 && (
                    <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      isActive ? "bg-white/15 text-white/80" : "bg-white/8 text-white/35"
                    }`}>
                      {noteCounts[item.id]}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings trigger */}
      <div className="border-t border-white/5 pt-4 space-y-2">
        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-xs font-medium cursor-pointer ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
          title="App Settings & Themes"
        >
          <Settings size={16} className="text-purple-400 shrink-0" />
          {!isCollapsed && <span>Settings & Themes</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Sidebar({
  currentView,
  onViewChange,
  onNewNote,
  onOpenSettings,
  user,
  hasVaultPassword,
  onDeleteVault,
  onDeleteAccount,
  noteCounts,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const isMd = useIsMd();

  const handleNavClick = (view: "all" | "vault" | "bin" | "todos") => {
    onViewChange(view);
    setMobileOpen(false);
  };

  const sharedContentProps: SidebarContentProps = {
    currentView,
    isCollapsed,
    onNavClick: handleNavClick,
    onNewNote,
    onOpenSettings,
    user,
    hasVaultPassword,
    onDeleteVault,
    onDeleteAccount,
    onLogout: () => setLogoutConfirmOpen(true),
    noteCounts,
  };

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden w-full flex items-center justify-between px-4 py-3 glass-panel border-x-0 border-t-0 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white">
            <Image src="/favicon.ico" alt="Logo" width={24} height={24} className="object-contain" />
          </div>
          <span className="font-bold text-white">NEXT Notes</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onOpenSettings} className="w-9 h-9 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-colors">
            <Settings size={20} />
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="w-9 h-9 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-colors">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative flex flex-col w-64 h-full glass-panel border-y-0 border-l-0"
            >
              <SidebarContent {...sharedContentProps} isCollapsed={false} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      {isMd && (
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? 80 : 256 }}
          className="flex flex-col border-r border-white/5 h-screen sticky top-0 z-30 bg-black/20 backdrop-blur-md"
        >
          <div className="relative h-full w-full">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-purple-900 border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-white transition-all z-50 cursor-pointer"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            <div className="h-full w-full overflow-hidden">
              <SidebarContent {...sharedContentProps} />
            </div>
          </div>
        </motion.aside>
      )}

      {/* Logout confirmation */}
      <ConfirmationModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => signOut()}
        title="Sign Out?"
        message="Are you sure you want to sign out of NEXT Notes?"
        confirmText="Sign Out"
        isDestructive={false}
      />
    </>
  );
}
