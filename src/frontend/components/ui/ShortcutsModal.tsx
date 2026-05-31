"use client";

import { useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/react";
import { Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["Ctrl", "N"],   mac: ["⌘", "N"],   label: "New note" },
  { keys: ["Ctrl", "S"],   mac: ["⌘", "S"],   label: "Save note (in editor)" },
  { keys: ["Escape"],      mac: ["Esc"],       label: "Close modal / editor" },
  { keys: ["?"],           mac: ["?"],         label: "Show keyboard shortcuts" },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/8 border border-white/15 text-white/70 font-mono min-w-[28px]">
      {children}
    </kbd>
  );
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      backdrop="blur"
      size="sm"
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
              <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <Keyboard size={16} />
              </div>
              <span className="font-semibold">Keyboard Shortcuts</span>
            </ModalHeader>
            <ModalBody className="py-5">
              <div className="space-y-1">
                {SHORTCUTS.map((s) => {
                  const keys = isMac ? s.mac : s.keys;
                  return (
                    <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <span className="text-sm text-white/65">{s.label}</span>
                      <div className="flex items-center gap-1">
                        {keys.map((k, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <Kbd>{k}</Kbd>
                            {i < keys.length - 1 && <span className="text-white/25 text-xs">+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-white/25 text-center mt-3">
                Press <Kbd>?</Kbd> anywhere to toggle this panel
              </p>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
