"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
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
            <ModalFooter>
              <Button 
                variant="light" 
                className="text-white/60 hover:text-white hover:bg-white/5"
                onClick={onClose}
              >
                No, Cancel
              </Button>
              <Button 
                color={isDestructive ? "danger" : "primary"}
                className="font-semibold shadow-lg"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                Yes, {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
