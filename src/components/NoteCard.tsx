"use client";

import { Pin, Trash2, RotateCcw, Lock, Unlock, Calendar } from "lucide-react";
import { Button, Tooltip } from "@nextui-org/react";
import { motion } from "framer-motion";

interface Note {
  id: string;
  title: string;
  content: string;
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
  note,
  onEdit,
  onPinToggle,
  onLockToggle,
  onDeleteToggle,
  onDeletePermanent,
  view,
}: NoteCardProps) {
  const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const contentPreview = note.content
    ? note.content.length > 120
      ? note.content.slice(0, 120) + "..."
      : note.content
    : "No additional text";

  const handleCardClick = () => {
    if (view !== "bin") {
      onEdit(note);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <div
        onClick={handleCardClick}
        className={`glass-card w-full h-48 flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-md shadow-lg transition-all duration-200 ${
          view !== "bin" ? "cursor-pointer hover:bg-white/8 hover:border-white/10" : ""
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-2 pt-4 px-4 pb-2">
          <div className="flex flex-col text-left">
            <h4 className="font-bold text-white text-base line-clamp-1">
              {note.title || "Untitled Note"}
            </h4>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {view === "all" && onPinToggle && (
              <Tooltip content={note.isPinned ? "Unpin note" : "Pin note"}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className={note.isPinned ? "text-purple-400" : "text-white/30 hover:text-white"}
                  onClick={() => onPinToggle(note.id, note.isPinned)}
                >
                  <Pin size={16} fill={note.isPinned ? "currentColor" : "none"} />
                </Button>
              </Tooltip>
            )}
            {view !== "bin" && onLockToggle && (
              <Tooltip content={note.isLocked ? "Remove from Vault" : "Move to Vault"}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className={note.isLocked ? "text-amber-400" : "text-white/30 hover:text-amber-400"}
                  onClick={() => onLockToggle(note.id, note.isLocked)}
                >
                  {note.isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
        {/* Body */}
        <p className="text-white/60 text-xs leading-relaxed line-clamp-3 whitespace-pre-line px-4 py-1">
          {contentPreview}
        </p>
        {/* Footer */}
        <div
          className="flex justify-between items-center bg-black/10 border-t border-white/5 py-2.5 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <Calendar size={11} />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            {view === "bin" ? (
              <>
                {onDeleteToggle && (
                  <Tooltip content="Recover note">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="text-white/40 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg"
                      onClick={() => onDeleteToggle(note.id, note.isDeleted)}
                    >
                      <RotateCcw size={14} />
                    </Button>
                  </Tooltip>
                )}
                {onDeletePermanent && (
                  <Tooltip content="Delete permanently">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      onClick={() => onDeletePermanent(note.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Tooltip>
                )}
              </>
            ) : (
              onDeleteToggle && (
                <Tooltip content="Move to recycle bin">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-white/30 hover:text-red-400 hover:bg-red/5 rounded-lg"
                    onClick={() => onDeleteToggle(note.id, note.isDeleted)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </Tooltip>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
