"use client";

import { Folder, Lock, Trash2, LogOut, Plus, ChevronLeft, ChevronRight, Menu, UserX, AlertTriangle, LockKeyhole } from "lucide-react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import ConfirmationModal from "@/frontend/components/ui/ConfirmationModal";

interface SidebarProps {
  currentView: "all" | "vault" | "bin";
  onViewChange: (view: "all" | "vault" | "bin") => void;
  onNewNote: () => void;
  user: {
    name?: string | null;
    email?: string | null;
  };
  hasVaultPassword: boolean;
  vaultUnlocked: boolean;
  onLockVault: () => void;
  onDeleteVault: () => void;
  onDeleteAccount?: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  onNewNote,
  user,
  hasVaultPassword,
  vaultUnlocked,
  onLockVault,
  onDeleteVault,
  onDeleteAccount,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [lockVaultConfirmOpen, setLockVaultConfirmOpen] = useState(false);

  const navItems = [
    {
      id: "all",
      label: "All Notes",
      icon: Folder,
      activeClass: "bg-blue-500/20 text-blue-300 border-blue-500/20 shadow-blue-500/5",
      hoverClass: "hover:bg-blue-500/10 hover:text-blue-200 hover:border-blue-500/10",
      iconActive: "text-blue-400",
      sheenColor: "via-blue-400/[0.10]",
    },
    {
      id: "vault",
      label: "Secret Vault",
      icon: Lock,
      activeClass: "bg-amber-500/20 text-amber-300 border-amber-500/20 shadow-amber-500/5",
      hoverClass: "hover:bg-amber-500/10 hover:text-amber-200 hover:border-amber-500/10",
      iconActive: "text-amber-400",
      sheenColor: "via-amber-400/[0.10]",
    },
    {
      id: "bin",
      label: "Recycle Bin",
      icon: Trash2,
      activeClass: "bg-red-500/20 text-red-300 border-red-500/20 shadow-red-500/5",
      hoverClass: "hover:bg-red-500/10 hover:text-red-200 hover:border-red-500/10",
      iconActive: "text-red-400",
      sheenColor: "via-red-400/[0.10]",
    },
  ] as const;

  const handleNavClick = (view: "all" | "vault" | "bin") => {
    onViewChange(view);
    setMobileOpen(false);
  };

  // Initials avatar fallback
  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const AvatarFallback = ({ size = "sm" }: { size?: "sm" | "md" }) => (
    <div
      className={`${
        size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm"
      } rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-500/30 flex items-center justify-center font-bold text-white shrink-0`}
    >
      {initials}
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
            <Image src="/favicon.ico" alt="Logo" width={24} height={24} className="object-contain" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              NEXT Notes
            </span>
          )}
        </div>

        {/* New Note Button */}
        <button
          onClick={onNewNote}
          className={`group relative overflow-hidden w-full font-semibold rounded-xl bg-primary text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:shadow-purple-500/40 hover:brightness-110 flex items-center justify-center gap-2 ${
            isCollapsed ? "h-10 w-10 p-0" : "h-10 px-4"
          }`}
        >
          {/* Sliding sheen */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.18] to-transparent skew-x-12 transform -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-[400%]" />
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <Plus size={18} />
            {!isCollapsed && <span>New Note</span>}
          </div>
        </button>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full group relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  isActive
                    ? `${item.activeClass} shadow-lg`
                    : `text-white/60 border-transparent ${item.hoverClass}`
                }`}
              >
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className={`absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent ${item.sheenColor} to-transparent skew-x-12 transform -translate-x-full transition-transform duration-1000 ease-out group-hover:translate-x-[400%]`} />
                </div>
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <Icon size={18} className={isActive ? item.iconActive : ""} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile dropdown */}
      <div className="border-t border-white/5 pt-4">
        <Dropdown
          placement="top-start"
          className="bg-zinc-950/95 backdrop-blur-md border border-white/10 text-white rounded-xl"
        >
          <DropdownTrigger>
            <div className="w-full cursor-pointer hover:bg-white/5 transition-colors p-1.5 rounded-xl flex items-center justify-center">
              {!isCollapsed ? (
                <div className="flex items-center gap-3 w-full px-1">
                  <AvatarFallback />
                  <div className="flex flex-col min-w-0">
                    <span className="text-white/90 text-sm font-semibold truncate">
                      {user.name || "User"}
                    </span>
                    <span className="text-white/40 text-xs truncate max-w-[140px]">
                      {user.email || ""}
                    </span>
                  </div>
                </div>
              ) : (
                <AvatarFallback />
              )}
            </div>
          </DropdownTrigger>

          <DropdownMenu aria-label="User actions" variant="flat">
            <DropdownItem
              key="logout"
              startContent={<LogOut size={16} />}
              onPress={() => setLogoutConfirmOpen(true)}
              className="text-white/70 font-medium data-[hover=true]:bg-white/10 data-[hover=true]:text-white"
            >
              Logout
            </DropdownItem>

            <DropdownItem
              key="lock-vault"
              className={vaultUnlocked ? "text-amber-400 font-medium data-[hover=true]:bg-amber-500/15 data-[hover=true]:text-amber-300" : "hidden"}
              startContent={<LockKeyhole size={16} />}
              onPress={() => setLockVaultConfirmOpen(true)}
            >
              Lock Vault
            </DropdownItem>

            <DropdownItem
              key="delete-vault"
              className={hasVaultPassword ? "text-amber-400 font-medium data-[hover=true]:bg-amber-500/15 data-[hover=true]:text-amber-300" : "hidden"}
              startContent={<AlertTriangle size={16} />}
              onPress={onDeleteVault}
            >
              Delete Vault
            </DropdownItem>

            <DropdownItem
              key="delete-account"
              className="text-red-400 font-medium data-[hover=true]:bg-red-500/15 data-[hover=true]:text-red-300"
              startContent={<UserX size={16} />}
              onPress={onDeleteAccount}
            >
              Delete Account
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );

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
        <Button isIconOnly variant="light" className="text-white" onPress={() => setMobileOpen(!mobileOpen)}>
          <Menu size={20} />
        </Button>
      </div>

      {/* Mobile drawer — slides in from left */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative flex flex-col w-64 h-full glass-panel border-y-0 border-l-0"
            >
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        className="hidden md:flex flex-col border-r border-white/5 h-screen sticky top-0 z-30 bg-black/20 backdrop-blur-md"
      >
        <div className="relative h-full flex flex-col">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-purple-900 border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-white transition-all z-50 cursor-pointer"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <SidebarContent />
        </div>
      </motion.aside>

      {/* Logout confirmation modal */}
      <ConfirmationModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => signOut()}
        title="Sign Out?"
        message="Are you sure you want to sign out of NEXT Notes?"
        confirmText="Sign Out"
        isDestructive={false}
      />

      {/* Lock Vault confirmation modal */}
      <ConfirmationModal
        isOpen={lockVaultConfirmOpen}
        onClose={() => setLockVaultConfirmOpen(false)}
        onConfirm={onLockVault}
        title="Lock Vault?"
        message="This will lock the vault and clear the password from memory. You'll need to enter your master password again to access vault notes."
        confirmText="Lock Vault"
        isDestructive={false}
      />
    </>
  );
}
