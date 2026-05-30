"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  isDestructive?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  isDestructive = false,
}: ConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      backdrop="blur"
      classNames={{
        base: "glass-panel border border-white/10 rounded-2xl bg-black/40 text-white",
        header: "border-b border-white/5 py-4",
        footer: "border-t border-white/5 py-3",
        closeButton: "hover:bg-white/5 text-white/50 hover:text-white rounded-full",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex gap-3 items-center">
              {isDestructive ? (
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                  <AlertTriangle size={18} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Info size={18} />
                </div>
              )}
              <span className="font-semibold">{title}</span>
            </ModalHeader>
            <ModalBody className="py-6">
              <p className="text-white/70 text-sm">{message}</p>
            </ModalBody>
            <ModalFooter className="gap-2">
              <button
                onClick={onClose}
                className="btn-sheen px-4 h-9 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                No, Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`btn-sheen px-4 h-9 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-lg ${
                  isDestructive
                    ? "bg-red-600 hover:bg-red-500 shadow-red-500/20 hover:shadow-red-500/40"
                    : "bg-primary hover:brightness-110 shadow-purple-500/20 hover:shadow-purple-500/40"
                }`}
              >
                Yes, {confirmText}
              </button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
