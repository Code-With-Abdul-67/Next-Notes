"use client";

import { Pin, Trash2, RotateCcw, Lock, Unlock, Calendar } from "lucide-react";
import { Button } from "@nextui-org/react";
import { motion } from "framer-motion";

const COLOR_MAP: Record<string, { border: string; glow: string; accent: string }> = {
  purple: { border: "border-purple-500/40", glow: "hover:shadow-purple-500/20", accent: "bg-purple-500/10" },
  blue:   { border: "border-blue-500/40",   glow: "hover:shadow-blue-500/20",   accent: "bg-blue-500/10" },
  green:  { border: "border-green-500/40",  glow: "hover:shadow-green-500/20",  accent: "bg-green-500/10" },
  yellow: { border: "border-yellow-500/40", glow: "hover:shadow-yellow-500/20", accent: "bg-yellow-500/10" },
  red:    { border: "border-red-500/40",    glow: "hover:shadow-red-500/20",    accent: "bg-red-500/10" },
};

interface Note {
  id: string;
  title: string;
  content: string;
  color?: string | null;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  updatedAt: string;
}

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onPinToggle?: (id: string, currentVal: boolean) => void;
  onLockToggle?: (id: string, currentVal: boolean) => void;
  onDeleteToggle?: (id: string, currentVal: boolean) => void;
  onDeletePermanent?: (id: string) => void;
  view: "all" | "vault" | "bin";
}

export default function NoteCard({
  note, onEdit, onPinToggle, onLockToggle, onDeleteToggle, onDeletePermanent, view,
}: NoteCardProps) {
  const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
  const formattedTime = new Date(note.updatedAt).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  const fullTimestamp = `${formattedDate} • ${formattedTime}`;

  const contentPreview = note.content
    ? note.content.length > 120 ? note.content.slice(0, 120) + "..." : note.content
    : "No additional text";

  const colorStyle = note.color ? COLOR_MAP[note.color] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.90, y: 15, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25, layout: { duration: 0.25 } }}
      className="h-full"
    >
      <div
        onClick={() => view !== "bin" && onEdit(note)}
        className={`group relative overflow-hidden glass-card w-full h-48 flex flex-col justify-between rounded-xl border bg-white/5 backdrop-blur-md shadow-lg transition-all duration-300 cursor-pointer hover:bg-white/10 hover:shadow-xl ${
          colorStyle
            ? `${colorStyle.border} ${colorStyle.glow}`
            : "border-white/5 hover:border-white/20 hover:shadow-purple-500/5"
        }`}
      >
        {/* Color accent top bar */}
        {colorStyle && (
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${colorStyle.accent} rounded-t-xl`} />
        )}

        {/* Sheen */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent skew-x-12 transform -translate-x-full transition-transform duration-1000 ease-out group-hover:translate-x-[400%]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          {/* Header */}
          <div className="flex justify-between items-start gap-2 pt-4 px-4 pb-2">
            <h4 className="font-bold text-white text-base line-clamp-1 flex-1">
              {note.title || "Untitled Note"}
            </h4>
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {view === "all" && onPinToggle && (
                <Button isIconOnly size="sm" variant="light"
                  aria-label={note.isPinned ? "Unpin" : "Pin"}
                  className={note.isPinned ? "text-purple-400" : "text-white/30 hover:text-white"}
                  onPress={() => onPinToggle(note.id, note.isPinned)}
                >
                  <Pin size={16} fill={note.isPinned ? "currentColor" : "none"} />
                </Button>
              )}
              {view !== "bin" && onLockToggle && (
                <Button isIconOnly size="sm" variant="light"
                  aria-label={note.isLocked ? "Remove from Vault" : "Move to Vault"}
                  className={note.isLocked ? "text-amber-400" : "text-white/30 hover:text-amber-400"}
                  onPress={() => onLockToggle(note.id, note.isLocked)}
                >
                  {note.isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                </Button>
              )}
            </div>
          </div>

          {/* Body */}
          <p className="text-white/60 text-xs leading-relaxed line-clamp-3 whitespace-pre-line px-4 py-1 flex-1">
            {contentPreview}
          </p>

          {/* Footer */}
          <div
            className="flex justify-between items-center bg-black/10 border-t border-white/5 py-2.5 px-4"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 transition-colors duration-300 group-hover:text-purple-300">
              <Calendar size={11} className="text-white/30 transition-colors duration-300 group-hover:text-purple-400" />
              <span>{fullTimestamp}</span>
            </div>
            <div className="flex items-center gap-1">
              {view === "bin" ? (
                <>
                  {onDeleteToggle && (
                    <Button isIconOnly size="sm" variant="light"
                      aria-label="Recover note"
                      className="text-white/40 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg"
                      onPress={() => onDeleteToggle(note.id, note.isDeleted)}
                    >
                      <RotateCcw size={14} />
                    </Button>
                  )}
                  {onDeletePermanent && (
                    <Button isIconOnly size="sm" variant="light"
                      aria-label="Delete permanently"
                      className="text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      onPress={() => onDeletePermanent(note.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </>
              ) : (
                onDeleteToggle && (
                  <Button isIconOnly size="sm" variant="light"
                    aria-label="Move to recycle bin"
                    className="text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    onPress={() => onDeleteToggle(note.id, note.isDeleted)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
