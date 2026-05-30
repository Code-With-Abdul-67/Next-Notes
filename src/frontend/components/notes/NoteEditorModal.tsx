"use client";

import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Tooltip } from "@nextui-org/react";
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
  }, [note, isOpen, defaultLocked]);

  const handleSave = async () => {
    await onSave(note ? note.id : null, title, content, isPinned, isLocked);
    onClose();
  };

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
                <Tooltip content={isPinned ? "Unpin Note" : "Pin Note"}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className={`${
                      isPinned ? "text-purple-400" : "text-white/30 hover:text-white"
                    }`}
                    onClick={() => setIsPinned(!isPinned)}
                  >
                    <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
                  </Button>
                </Tooltip>

                <Tooltip content={isLocked ? "Unlock Note" : "Lock Note (Send to Vault)"}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className={`${
                      isLocked ? "text-amber-400" : "text-white/30 hover:text-amber-400"
                    }`}
                    onClick={() => setIsLocked(!isLocked)}
                  >
                    {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                  </Button>
                </Tooltip>
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
            </ModalBody>

            <ModalFooter className="flex justify-between items-center">
              <span className="text-xs text-white/40">
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-purple-400" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  "All changes saved"
                )}
              </span>

              <div className="flex gap-2">
                <Button 
                  variant="light" 
                  className="text-white/60 hover:text-white hover:bg-white/5 font-semibold"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  className="font-semibold shadow-lg shadow-purple-500/10 bg-primary"
                  onClick={handleSave}
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
