"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Trash2, Trash } from "lucide-react";

export type ToastType = "vault" | "bin" | "deleted";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  vault: <Lock size={15} className="text-amber-400 shrink-0" />,
  bin: <Trash2 size={15} className="text-red-400 shrink-0" />,
  deleted: <Trash size={15} className="text-red-500 shrink-0" />,
};

const COLORS: Record<ToastType, string> = {
  vault: "border-amber-500/30 bg-amber-500/10",
  bin: "border-red-500/20 bg-red-500/10",
  deleted: "border-red-600/30 bg-red-600/10",
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.35, ease: "easeIn" } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg text-sm text-white/90 font-medium cursor-pointer select-none ${COLORS[toast.type]}`}
      onClick={() => onRemove(toast.id)}
    >
      {ICONS[toast.type]}
      <span>{toast.message}</span>
    </motion.div>
  );
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook to manage toasts
let _nextId = 1;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = _nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
