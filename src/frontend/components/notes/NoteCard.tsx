"use client";

import { Pin, Trash2, RotateCcw, Lock, Unlock, Calendar, Copy } from "lucide-react";
import { motion } from "framer-motion";

interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  updatedAt: string;
  createdAt?: string;
}

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onPinToggle?: (id: string, currentVal: boolean) => void;
  onLockToggle?: (id: string, currentVal: boolean) => void;
  onDeleteToggle?: (id: string, currentVal: boolean) => void;
  onDeletePermanent?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  view: "all" | "vault" | "bin";
}

function IconBtn({
  label, onClick, className, children,
}: {
  label: string;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onTouchEnd={(e) => e.stopPropagation()}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 ${className}`}
    >
      {children}
    </button>
  );
}

export default function NoteCard({
  note, onEdit, onPinToggle, onLockToggle, onDeleteToggle, onDeletePermanent, onDuplicate, view,
}: NoteCardProps) {
  const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
  const formattedTime = new Date(note.updatedAt).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  const fullTimestamp = `${formattedDate} • ${formattedTime}`;

  const contentPreview = note.content
    ? note.content.length > 120 ? note.content.slice(0, 120) + "…" : note.content
    : "No additional text";

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
        className="group relative overflow-hidden glass-card w-full h-48 flex flex-col justify-between rounded-xl border border-white/5 bg-white/5 backdrop-blur-md shadow-lg transition-all duration-300 cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-purple-500/5"
      >
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
            <div className="flex items-center gap-0.5 shrink-0">
              {view === "all" && onPinToggle && (
                <IconBtn
                  label={note.isPinned ? "Unpin" : "Pin"}
                  onClick={() => onPinToggle(note.id, note.isPinned)}
                  className={note.isPinned ? "text-purple-400 bg-purple-500/10" : "text-white/20 hover:text-white hover:bg-white/5"}
                >
                  <Pin size={14} fill={note.isPinned ? "currentColor" : "none"} />
                </IconBtn>
              )}
              {view !== "bin" && onLockToggle && (
                <IconBtn
                  label={note.isLocked ? "Remove from Vault" : "Move to Vault"}
                  onClick={() => onLockToggle(note.id, note.isLocked)}
                  className={note.isLocked ? "text-amber-400 bg-amber-500/10" : "text-white/20 hover:text-amber-400 hover:bg-amber-500/10"}
                >
                  {note.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </IconBtn>
              )}
            </div>
          </div>

          {/* Body */}
          <p className="text-white/60 text-xs leading-relaxed line-clamp-3 whitespace-pre-line px-4 py-1 flex-1">
            {contentPreview}
          </p>

          {/* Footer */}
          <div
            className="flex justify-between items-center bg-black/10 border-t border-white/5 py-2 px-4"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 transition-colors duration-300 group-hover:text-purple-300">
              <Calendar size={11} className="text-white/30 transition-colors duration-300 group-hover:text-purple-400" />
              <span>{fullTimestamp}</span>
            </div>

            <div className="flex items-center gap-0.5">
              {view === "bin" ? (
                <>
                  {onDeleteToggle && (
                    <IconBtn
                      label="Recover note"
                      onClick={() => onDeleteToggle(note.id, note.isDeleted)}
                      className="text-white/30 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      <RotateCcw size={13} />
                    </IconBtn>
                  )}
                  {onDeletePermanent && (
                    <IconBtn
                      label="Delete permanently"
                      onClick={() => onDeletePermanent(note.id)}
                      className="text-white/30 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={13} />
                    </IconBtn>
                  )}
                </>
              ) : (
                <>
                  {onDuplicate && !note.isLocked && (
                    <IconBtn
                      label="Duplicate note"
                      onClick={() => onDuplicate(note.id)}
                      className="text-white/20 hover:text-blue-400 hover:bg-blue-500/10"
                    >
                      <Copy size={13} />
                    </IconBtn>
                  )}
                  {onDeleteToggle && (
                    <IconBtn
                      label="Move to recycle bin"
                      onClick={() => onDeleteToggle(note.id, note.isDeleted)}
                      className="text-white/20 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={13} />
                    </IconBtn>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
