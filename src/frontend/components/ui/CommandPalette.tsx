"use client";

import { useEffect } from "react";
import { Command } from "cmdk";
import { Search, Lock, Trash2, Folder, Plus, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewNote: () => void;
  onNavigate: (view: "all" | "vault" | "bin") => void;
  onLogout: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNewNote,
  onNavigate,
  onLogout,
}: CommandPaletteProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // Toggle logic should be in parent, this just prevents default so parent catches it.
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runCommand = (command: () => void) => {
    onClose();
    command();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Command.Dialog
          open={isOpen}
          onOpenChange={(open) => !open && onClose()}
          label="Global Command Menu"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center border-b border-white/10 px-4">
              <Search className="w-5 h-5 text-white/40 mr-3 shrink-0" />
              <Command.Input
                placeholder="Type a command or search..."
                className="w-full bg-transparent text-white placeholder-white/40 py-4 outline-none text-lg"
              />
            </div>
            
            <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
              <Command.Empty className="py-6 text-center text-white/50 text-sm">
                No results found.
              </Command.Empty>

              <Command.Group heading="Actions" className="text-xs font-medium text-white/40 px-2 py-2">
                <Command.Item
                  onSelect={() => runCommand(onNewNote)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create New Note
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Navigation" className="text-xs font-medium text-white/40 px-2 py-2">
                <Command.Item
                  onSelect={() => runCommand(() => onNavigate("all"))}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/80 aria-selected:bg-blue-500/20 aria-selected:text-blue-300 cursor-pointer transition-colors"
                >
                  <Folder className="w-4 h-4 text-blue-400" />
                  All Notes
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => onNavigate("vault"))}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/80 aria-selected:bg-amber-500/20 aria-selected:text-amber-300 cursor-pointer transition-colors"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  Secret Vault
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => onNavigate("bin"))}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/80 aria-selected:bg-red-500/20 aria-selected:text-red-300 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Recycle Bin
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Account" className="text-xs font-medium text-white/40 px-2 py-2">
                <Command.Item
                  onSelect={() => runCommand(onLogout)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Command.Item>
              </Command.Group>
            </Command.List>
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  );
}
