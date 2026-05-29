"use client";

import { Folder, Lock, Trash2, LogOut, Plus, ChevronLeft, ChevronRight, Menu, UserX, AlertTriangle } from "lucide-react";
import { Button, Avatar, User, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useState } from "react";
import Image from 'next/image';

interface SidebarProps {
  currentView: "all" | "vault" | "bin";
  onViewChange: (view: "all" | "vault" | "bin") => void;
  onNewNote: () => void;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  hasVaultPassword: boolean;
  onDeleteVault: () => void;
  onDeleteAccount?: () => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  onNewNote, 
  user, 
  hasVaultPassword, 
  onDeleteVault, 
  onDeleteAccount 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "all", label: "All Notes", icon: Folder },
    { id: "vault", label: "Secret Vault", icon: Lock },
    { id: "bin", label: "Recycle Bin", icon: Trash2 },
  ] as const;

  const handleNavClick = (view: "all" | "vault" | "bin") => {
    onViewChange(view);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
            <Image
              src="/favicon.ico"
              alt="Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              NEXT Notes
            </span>
          )}
        </div>

        {/* Create Note Quick Action */}
        <Button
          color="primary"
          className={`w-full font-semibold shadow-lg shadow-purple-500/20 bg-primary ${
            isCollapsed ? "min-w-0 p-0 h-10 w-10" : ""
          }`}
          onClick={onNewNote}
          startContent={<Plus size={18} />}
        >
          {!isCollapsed && "New Note"}
        </Button>

        {/* Navigation items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full group relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/20 text-purple-300 border border-primary/20 shadow-lg shadow-purple-500/5"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {/* Premium Glass Sheen Reflective Effect */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-12 transform -translate-x-full transition-transform duration-1000 ease-out group-hover:translate-x-[400%]" />
                </div>

                {/* Content layers pinned to relative z-10 */}
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <Icon size={18} className={isActive ? "text-purple-400" : ""} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Optional: Vault Actions in sidebar if you still want them there in addition to the dropdown */}
        {hasVaultPassword && (
          <div className="pt-4 mt-2 border-t border-white/5">
            <button
              onClick={onDeleteVault}
              className="w-full group relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent"
              title="Delete Vault"
            >
              {/* Premium Glass Sheen Reflective Effect for Delete Vault */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-12 transform -translate-x-full transition-transform duration-1000 ease-out group-hover:translate-x-[400%]" />
              </div>

              <div className="relative z-10 flex items-center gap-3 w-full">
                <Trash2 size={18} />
                {!isCollapsed && <span>Delete Vault</span>}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* User profile with Modal Context Menu Dropdown */}
      <div className="border-t border-white/5 pt-4">
        <Dropdown placement="top-start" className="bg-zinc-950/95 backdrop-blur-md border border-white/10 text-white rounded-xl">
          <DropdownTrigger>
            <div className="w-full cursor-pointer hover:bg-white/5 transition-colors p-1.5 rounded-xl flex items-center justify-center">
              {!isCollapsed ? (
                <div className="flex items-center justify-between gap-2 w-full px-1">
                  <User
                    name={user.name || "User"}
                    description={user.email || ""}
                    avatarProps={{
                      src: user.image || "",
                      className: "border border-purple-500/30",
                    }}
                    classNames={{
                      name: "text-white/90 text-sm font-semibold",
                      description: "text-white/40 text-xs truncate max-w-[140px]",
                    }}
                  />
                </div>
              ) : (
                <Avatar src={user.image || ""} size="sm" className="border border-purple-500/30" />
              )}
            </div>
          </DropdownTrigger>
          
          <DropdownMenu aria-label="User Profile Actions" variant="flat">
            <DropdownItem 
              key="logout" 
              startContent={<LogOut size={16} />}
              onClick={() => signOut()}
              className="text-white/80 hover:text-white"
            >
              Logout
            </DropdownItem>
            
            {/* Using CSS hidden class for conditional rendering inside NextUI DropdownMenu */}
            <DropdownItem 
              key="delete-vault" 
              className={hasVaultPassword ? "text-warning font-medium" : "hidden"} 
              color="warning"
              startContent={<AlertTriangle size={16} />}
              onClick={onDeleteVault}
            >
              Delete Vault
            </DropdownItem>

            <DropdownItem 
              key="delete-account" 
              className="text-danger font-medium" 
              color="danger"
              startContent={<UserX size={16} />}
              onClick={onDeleteAccount}
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
            <Image
              src="/favicon.ico"
              alt="Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="font-bold text-white">NEXT Notes</span>
        </div>
        <Button isIconOnly variant="light" className="text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          <Menu size={20} />
        </Button>
      </div>

      {/* Mobile Sidebar overlay Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

          <div className="relative flex flex-col w-64 h-full glass-panel border-y-0 border-l-0">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        className="hidden md:flex flex-col border-r border-white/5 h-screen sticky top-0 z-30 bg-black/20 backdrop-blur-md"
      >
        <div className="relative h-full flex flex-col">
          {/* Collapse toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-purple-900 border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-white transition-all z-50 cursor-pointer"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <SidebarContent />
        </div>
      </motion.aside>
    </>
  );
}