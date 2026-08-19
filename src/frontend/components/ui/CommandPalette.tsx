"use client";

import { useEffect } from "react";
import { Command } from "cmdk";
import { Search, Lock, Trash2, Folder, Plus, LogOut, CheckSquare, Settings, Command as CommandIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewNote: () => void;
  onNavigate: (view: "all" | "vault" | "bin" | "todos") => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNewNote,
  onNavigate,
  onOpenSettings,
  onLogout,
}: CommandPaletteProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const runCommand = (command: () => void) => {
    onClose();
    command();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog container */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[20vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full max-w-lg mx-4"
            >
              <Command
                label="Global Command Menu"
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(15, 10, 25, 0.75)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                }}
              >
                {/* Search Input */}
                <div className="flex items-center px-4 border-b border-white/[0.06]">
                  <Search className="w-5 h-5 text-purple-400/60 mr-3 shrink-0" />
                  <Command.Input
                    placeholder="Type a command or search..."
                    className="w-full bg-transparent text-white placeholder-white/30 py-4 outline-none text-[15px] font-light tracking-wide"
                    autoFocus
                  />
                  <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-white/25 bg-white/[0.04] border border-white/[0.06] shrink-0 ml-2">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <Command.List className="max-h-[280px] overflow-y-auto p-2">
                  <Command.Empty className="py-8 text-center text-white/30 text-sm font-light">
                    No results found.
                  </Command.Empty>

                  <Command.Group
                    heading="Actions"
                    className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-purple-400/40 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                  >
                    <Command.Item
                      onSelect={() => runCommand(onNewNote)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 data-[selected=true]:bg-purple-500/15 data-[selected=true]:text-white cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-data-[selected=true]:bg-purple-500/20 group-data-[selected=true]:border-purple-500/30 transition-colors">
                        <Plus className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Create New Note</span>
                        <span className="text-[11px] text-white/30">Start writing a new note</span>
                      </div>
                      <kbd className="ml-auto hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-white/20 bg-white/[0.03] border border-white/[0.06]">
                        ⌘N
                      </kbd>
                    </Command.Item>

                    <Command.Item
                      onSelect={() => runCommand(onOpenSettings)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 data-[selected=true]:bg-purple-500/15 data-[selected=true]:text-white cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-data-[selected=true]:bg-purple-500/20 group-data-[selected=true]:border-purple-500/30 transition-colors">
                        <Settings className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">App Settings & Themes</span>
                        <span className="text-[11px] text-white/30">Customize Discord Nitro themes and profile</span>
                      </div>
                      <kbd className="ml-auto hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-white/20 bg-white/[0.03] border border-white/[0.06]">
                        ⌘,
                      </kbd>
                    </Command.Item>
                  </Command.Group>

                  <Command.Group
                    heading="Navigation"
                    className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-purple-400/40 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                  >
                    <Command.Item
                      onSelect={() => runCommand(() => onNavigate("all"))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 data-[selected=true]:bg-blue-500/15 data-[selected=true]:text-white cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-data-[selected=true]:bg-blue-500/20 group-data-[selected=true]:border-blue-500/30 transition-colors">
                        <Folder className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="font-medium">All Notes</span>
                    </Command.Item>

                    <Command.Item
                      onSelect={() => runCommand(() => onNavigate("todos"))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-white cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-data-[selected=true]:bg-emerald-500/20 group-data-[selected=true]:border-emerald-500/30 transition-colors">
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="font-medium">To-Do Lists</span>
                    </Command.Item>

                    <Command.Item
                      onSelect={() => runCommand(() => onNavigate("vault"))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 data-[selected=true]:bg-amber-500/15 data-[selected=true]:text-white cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-data-[selected=true]:bg-amber-500/20 group-data-[selected=true]:border-amber-500/30 transition-colors">
                        <Lock className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="font-medium">Secret Vault</span>
                    </Command.Item>

                    <Command.Item
                      onSelect={() => runCommand(() => onNavigate("bin"))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 data-[selected=true]:bg-red-500/15 data-[selected=true]:text-white cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-data-[selected=true]:bg-red-500/20 group-data-[selected=true]:border-red-500/30 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="font-medium">Recycle Bin</span>
                    </Command.Item>
                  </Command.Group>

                  <Command.Group
                    heading="Account"
                    className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-purple-400/40 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                  >
                    <Command.Item
                      onSelect={() => runCommand(onLogout)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 data-[selected=true]:bg-white/10 data-[selected=true]:text-white cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-data-[selected=true]:bg-white/10 group-data-[selected=true]:border-white/15 transition-colors">
                        <LogOut className="w-4 h-4 text-white/50" />
                      </div>
                      <span className="font-medium">Log Out</span>
                    </Command.Item>
                  </Command.Group>
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] text-[11px] text-white/20">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px]">↑↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px]">↵</kbd>
                      select
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CommandIcon className="w-3 h-3" />
                    <span>Command Palette</span>
                  </div>
                </div>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
