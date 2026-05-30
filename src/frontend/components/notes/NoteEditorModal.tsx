"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from "@nextui-org/react";
import { Pin, Lock, Unlock, Loader2, Save } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
}

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  defaultLocked?: boolean;
  onSave: (id: string | null, title: string, content: string, isPinned: boolean, isLocked: boolean) => Promise<void>;
  isSaving: boolean;
}

export default function NoteEditorModal({
  isOpen,
  onClose,
  note,
  defaultLocked = false,
  onSave,
  isSaving,
}: NoteEditorModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNewNote = !note;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setIsPinned(note.isPinned);
      setIsLocked(note.isLocked);
    } else {
      setTitle("");
      setContent("");
      setIsPinned(false);
      setIsLocked(defaultLocked);
    }
    setAutoSaveStatus("idle");
  }, [note, isOpen, defaultLocked]);

  // Auto-save for existing notes only
  const triggerAutoSave = useCallback(() => {
    if (isNewNote || !isOpen) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus("saving");
    autoSaveTimer.current = setTimeout(async () => {
      await onSave(note!.id, title, content, isPinned, isLocked);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 1500);
  }, [isNewNote, isOpen, note, title, content, isPinned, isLocked, onSave]);

  useEffect(() => {
    if (!isNewNote && isOpen) triggerAutoSave();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  const handleSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await onSave(note ? note.id : null, title, content, isPinned, isLocked);
    onClose();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="2xl"
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
            <ModalHeader className="flex justify-between items-center gap-4">
              <span className="font-semibold text-lg">
                {note ? "Edit Note" : "Create Note"}
              </span>
              <div className="flex items-center gap-2 mr-6">
                <Button
                  isIconOnly size="sm" variant="light"
                  aria-label={isPinned ? "Unpin Note" : "Pin Note"}
                  className={isPinned ? "text-purple-400" : "text-white/30 hover:text-white"}
                  onPress={() => setIsPinned(!isPinned)}
                >
                  <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
                </Button>
                <Button
                  isIconOnly size="sm" variant="light"
                  aria-label={isLocked ? "Unlock Note" : "Lock Note"}
                  className={isLocked ? "text-amber-400" : "text-white/30 hover:text-amber-400"}
                  onPress={() => setIsLocked(!isLocked)}
                >
                  {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                </Button>
              </div>
            </ModalHeader>

            <ModalBody className="py-6 gap-4">
              <Input
                label="Title"
                placeholder="Enter note title..."
                variant="flat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                classNames={{
                  inputWrapper: "glass-input text-white",
                  input: "text-white text-base font-semibold placeholder:text-white/30",
                  label: "text-purple-300/70",
                }}
              />
              <Textarea
                label="Note Content"
                placeholder="Type your notes here..."
                variant="flat"
                minRows={8}
                maxRows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                classNames={{
                  inputWrapper: "glass-input text-white",
                  input: "text-white text-sm placeholder:text-white/30 leading-relaxed",
                  label: "text-purple-300/70",
                }}
              />
              {/* Word / char count */}
              <div className="flex items-center justify-end gap-3 text-[11px] text-white/30">
                <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                <span>·</span>
                <span>{charCount} {charCount === 1 ? "char" : "chars"}</span>
              </div>
            </ModalBody>

            <ModalFooter className="flex justify-between items-center">
              <span className="text-xs text-white/40">
                {autoSaveStatus === "saving" || isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-purple-400" />
                    <span>Saving…</span>
                  </span>
                ) : autoSaveStatus === "saved" ? (
                  <span className="text-green-400/70">✓ Saved</span>
                ) : (
                  <span className="text-white/20">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                )}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="light"
                  className="text-white/60 hover:text-white hover:bg-white/5 font-semibold"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  className="font-semibold shadow-lg shadow-purple-500/10 bg-primary"
                  onPress={handleSave}
                  startContent={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  isDisabled={isSaving}
                >
                  Save Note
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
