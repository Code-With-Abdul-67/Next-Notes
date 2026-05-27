"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Spinner } from "@nextui-org/react";
import { ShieldCheck, Mail } from "lucide-react";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
  title: string;
  message: string;
  isLoading?: boolean;
  error?: string;
}

export default function OTPModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  isLoading = false,
  error,
}: OTPModalProps) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          setCode("");
          onClose();
        }
      }}
      backdrop="blur"
      isDismissable={!isLoading}
      hideCloseButton={isLoading}
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
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                <ShieldCheck size={18} />
              </div>
              <span className="font-semibold">{title}</span>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody className="py-6 flex flex-col items-center">
                <div className="bg-purple-500/10 p-4 rounded-full mb-4">
                  <Mail className="text-purple-400" size={32} />
                </div>
                <p className="text-white/70 text-sm text-center mb-6">{message}</p>
                <Input
                  autoFocus
                  placeholder="000000"
                  variant="flat"
                  size="lg"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} // numbers only
                  classNames={{
                    inputWrapper: "glass-input",
                    input: "text-center text-2xl tracking-[0.5em] font-bold text-white",
                  }}
                  isDisabled={isLoading}
                />
                {error && (
                  <p className="text-red-400 text-xs mt-3 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 w-full text-center">
                    {error}
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button 
                  variant="light" 
                  className="text-white/60 hover:text-white hover:bg-white/5"
                  onClick={onClose}
                  isDisabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary"
                  className="font-semibold shadow-lg shadow-purple-500/20"
                  type="submit"
                  isDisabled={code.length !== 6 || isLoading}
                  isLoading={isLoading}
                >
                  Verify Code
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
